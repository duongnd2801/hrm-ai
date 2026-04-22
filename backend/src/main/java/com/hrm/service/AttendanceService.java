package com.hrm.service;

import com.hrm.dto.AttendanceDTO;
import com.hrm.dto.ImportErrorResponse;
import com.hrm.dto.ImportResultResponse;
import com.hrm.entity.*;
import com.hrm.repository.AttendanceRepository;
import com.hrm.repository.CompanyConfigRepository;
import com.hrm.repository.EmployeeRepository;
import com.hrm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceService {

    private static final String DEFAULT_CONFIG_ID = "default";
    private static final ZoneId APP_ZONE = ZoneId.systemDefault();

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final CompanyConfigRepository companyConfigRepository;
    private final ImportExportService importExportService;
    private final TransactionTemplate transactionTemplate;
    private final JdbcTemplate jdbcTemplate;
    private final AuditService auditService;

    private static final String UPSERT_VALUE_ROW = "(?, ?, ?, ?, ?, ?, CAST(? AS hrm.attendance_status), ?, ?, ?)";

    private static final String UPSERT_ON_CONFLICT = """
            ON CONFLICT (employee_id, date)
            DO UPDATE SET
              check_in  = COALESCE(EXCLUDED.check_in,  t.check_in),
              check_out = COALESCE(EXCLUDED.check_out, t.check_out),
              total_hours = EXCLUDED.total_hours,
              status = EXCLUDED.status,
              note = COALESCE(EXCLUDED.note, t.note),
              updated_at = EXCLUDED.updated_at
            """;

    @Value("${app.attendance.import.chunk-size:1000}")
    private int importChunkSize;

    /** Số dòng tối đa trong một câu INSERT multi-row (round-trip). */
    @Value("${app.attendance.import.jdbc-multi-rows-per-statement:1000}")
    private int jdbcMultiRowsPerStatement;

    @Transactional
    @CacheEvict(value = "employee_stats", allEntries = true)
    public AttendanceDTO checkIn(Authentication authentication) {
        Employee employee = resolveCurrentEmployee(authentication);
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        LocalDate today = now.toLocalDate();

        Attendance attendance = attendanceRepository.findByEmployeeAndDate(employee, today)
                .orElseGet(() -> Attendance.builder().employee(employee).date(today).build());

        if (attendance.getCheckIn() != null) {
            throw new IllegalArgumentException("Bạn đã check-in trong ngày hôm nay.");
        }

        CompanyConfig config = getCompanyConfig();
        // D28: Safe null-checks for work start time and early check-in minutes
        if (config.getWorkStartTime() != null && config.getEarlyCheckinMinutes() != null) {
            LocalDateTime earliest = LocalDateTime.of(today,
                    config.getWorkStartTime().minusMinutes(config.getEarlyCheckinMinutes()));
            if (now.isBefore(earliest)) {
                throw new IllegalArgumentException("Chưa đến thời gian cho phép check-in.");
            }
        }

        attendance.setCheckIn(now);
        normalizeStatus(attendance, config, today);
        try {
            return toDto(attendanceRepository.saveAndFlush(attendance));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Bạn đã check-in hoặc thao tác đang được xử lý.");
        }
    }

    @Transactional
    @CacheEvict(value = "employee_stats", allEntries = true)
    public AttendanceDTO checkOut(Authentication authentication) {
        Employee employee = resolveCurrentEmployee(authentication);
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        LocalDate today = now.toLocalDate();

        Attendance attendance = attendanceRepository.findByEmployeeAndDate(employee, today)
                .orElseThrow(() -> new IllegalArgumentException("Bạn chưa check-in hôm nay."));

        if (attendance.getCheckIn() == null) {
            throw new IllegalArgumentException("Bạn chưa check-in hôm nay.");
        }
        if (attendance.getCheckOut() != null) {
            throw new IllegalArgumentException("Bạn đã check-out trong ngày hôm nay.");
        }
        if (now.isBefore(attendance.getCheckIn())) {
            throw new IllegalArgumentException("Thời gian check-out không hợp lệ.");
        }

        attendance.setCheckOut(now);
        normalizeStatus(attendance, getCompanyConfig(), today);
        return toDto(attendanceRepository.save(attendance));
    }

    @Transactional(readOnly = true)
    public List<AttendanceDTO> getMyAttendance(Integer month, Integer year, Authentication authentication) {
        Employee employee = resolveCurrentEmployee(authentication);
        return getAttendanceForEmployee(employee.getId(), month, year, authentication);
    }

    @Transactional(readOnly = true)
    public List<AttendanceDTO> getAttendanceForEmployee(UUID employeeId, Integer month, Integer year,
            Authentication authentication) {
        Employee current = resolveCurrentEmployee(authentication);
        Employee target = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên."));

        boolean sameUser = current.getId().equals(target.getId());
        boolean elevated = hasAuthority(authentication, "ATT_TEAM_VIEW");
        if (!sameUser && !elevated) {
            throw new AccessDeniedException("Bạn không có quyền xem chấm công của nhân viên khác.");
        }

        int resolvedYear = year == null ? LocalDate.now(APP_ZONE).getYear() : year;
        LocalDate fromDate;
        LocalDate toDate;

        if (month == null) {
            // No month specified: fetch entire year
            fromDate = LocalDate.of(resolvedYear, 1, 1);
            toDate = LocalDate.of(resolvedYear, 12, 31);
        } else {
            // Month specified: fetch only that month
            fromDate = LocalDate.of(resolvedYear, month, 1);
            toDate = fromDate.withDayOfMonth(fromDate.lengthOfMonth());
        }

        CompanyConfig config = getCompanyConfig();
        LocalDate today = LocalDate.now(APP_ZONE);
        List<Attendance> records = attendanceRepository.findByEmployeeAndDateBetweenOrderByDateAsc(target, fromDate,
                toDate);
        records.forEach(record -> normalizeStatus(record, config, today));
        return records.stream().map(this::toDto).toList();
    }

    @Transactional
    public List<com.hrm.dto.TeamMatrixDTO> getTeamMatrix(Integer month, Integer year,
            Authentication authentication) {
        if (!hasAuthority(authentication, "ATT_TEAM_VIEW")) {
            throw new AccessDeniedException("Bạn không có quyền xem thống kê đội ngũ.");
        }

        int resolvedYear = year == null ? LocalDate.now(APP_ZONE).getYear() : year;
        int resolvedMonth = month == null ? LocalDate.now(APP_ZONE).getMonthValue() : month;

        LocalDate fromDate = LocalDate.of(resolvedYear, resolvedMonth, 1);
        LocalDate toDate = fromDate.withDayOfMonth(fromDate.lengthOfMonth());

        // Get all active employees (including probation, contract, collaborator)
        List<Employee> employees = employeeRepository.findByStatusNot(com.hrm.entity.EmpStatus.INACTIVE);
        List<Attendance> allAttendance = attendanceRepository.findByDateBetween(fromDate, toDate);

        // Group attendance by employee
        Map<UUID, List<Attendance>> attMap = allAttendance.stream()
                .collect(java.util.stream.Collectors.groupingBy(a -> a.getEmployee().getId()));

        BigDecimal stdHours = companyConfigRepository.findById("default")
                .map(com.hrm.entity.CompanyConfig::getStandardHours)
                .orElse(BigDecimal.valueOf(8.0));

        List<com.hrm.dto.TeamMatrixDTO> results = new ArrayList<>();

        for (Employee e : employees) {
            List<Attendance> records = attMap.getOrDefault(e.getId(), new ArrayList<>());
            Map<Integer, AttendanceStatus> dailyStatus = new java.util.HashMap<>();
            Map<Integer, Double> dailyHours = new java.util.HashMap<>();
            double totalHours = 0;
            double totalDays = 0;
            double paidDays = 0;
            long lateCount = 0;
            long absentCount = 0;

            for (Attendance a : records) {
                int day = a.getDate().getDayOfMonth();
                dailyStatus.put(day, a.getStatus());
                
                double h = a.getTotalHours() != null ? a.getTotalHours().doubleValue() : 0.0;
                dailyHours.put(day, h);
                totalHours += h;

                switch (a.getStatus()) {
                    case ON_TIME, APPROVED -> {
                        totalDays += 1.0;
                        paidDays += 1.0;
                    }
                    case LATE -> {
                        totalDays += 1.0;
                        paidDays += 1.0;
                        lateCount++;
                    }
                    case INSUFFICIENT -> {
                        double partial = h / stdHours.doubleValue();
                        totalDays += partial;
                        paidDays += partial;
                    }
                    case ABSENT -> absentCount++;
                }
            }

            results.add(com.hrm.dto.TeamMatrixDTO.builder()
                    .employeeId(e.getId())
                    .employeeName(e.getFullName())
                    .departmentName(e.getDepartment() != null ? e.getDepartment().getName() : "N/A")
                    .dailyStatus(dailyStatus)
                    .dailyHours(dailyHours)
                    .totalWorkHours(totalHours)
                    .totalWorkDays(totalDays)
                    .paidDays(paidDays)
                    .lateCount(lateCount)
                    .absentCount(absentCount)
                    .build());
        }

        return results;
    }

    @Transactional
    public List<com.hrm.dto.AttendanceSummaryDTO> getTeamSummary(Integer month, Integer year,
            Authentication authentication) {
        if (!hasAuthority(authentication, "ATT_TEAM_VIEW")) {
            throw new AccessDeniedException("Bạn không có quyền xem thống kê đội ngũ.");
        }

        int resolvedYear = year == null ? LocalDate.now(APP_ZONE).getYear() : year;
        int resolvedMonth = month == null ? LocalDate.now(APP_ZONE).getMonthValue() : month;

        LocalDate fromDate = LocalDate.of(resolvedYear, resolvedMonth, 1);
        LocalDate toDate = fromDate.withDayOfMonth(fromDate.lengthOfMonth());

        List<Object[]> stats = attendanceRepository.getAttendanceStats(fromDate, toDate);

        // Map to group by Employee ID
        Map<UUID, com.hrm.dto.AttendanceSummaryDTO> summaryMap = new LinkedHashMap<>();

        BigDecimal stdHours = companyConfigRepository.findById("default")
                .map(com.hrm.entity.CompanyConfig::getStandardHours)
                .orElse(BigDecimal.valueOf(8.0));

        for (Object[] row : stats) {
            UUID empId = (UUID) row[0];
            String name = (String) row[1];
            String dept = (String) row[2];
            AttendanceStatus status = (AttendanceStatus) row[3];
            long count = (long) row[4];
            BigDecimal hours = (BigDecimal) row[5];
            double hoursVal = hours != null ? hours.doubleValue() : 0.0;

            com.hrm.dto.AttendanceSummaryDTO dto = summaryMap.computeIfAbsent(empId,
                    id -> com.hrm.dto.AttendanceSummaryDTO.builder()
                            .employeeId(id)
                            .employeeName(name)
                            .departmentName(dept != null ? dept : "N/A")
                            .build());

            dto.setTotalWorkHours(dto.getTotalWorkHours() + hoursVal);

            switch (status) {
                case ON_TIME -> {
                    dto.setOnTimeCount(count);
                    dto.setTotalWorkDays(dto.getTotalWorkDays() + count);
                }
                case LATE -> {
                    dto.setLateCount(count);
                    dto.setTotalWorkDays(dto.getTotalWorkDays() + count);
                }
                case INSUFFICIENT -> {
                    dto.setInsufficientCount(count);
                    double partialDays = hoursVal / stdHours.doubleValue();
                    dto.setTotalWorkDays(dto.getTotalWorkDays() + partialDays);
                }
                case ABSENT -> dto.setAbsentCount(count);
                case APPROVED -> {
                    dto.setApprovedCount(count);
                    dto.setTotalWorkDays(dto.getTotalWorkDays() + count);
                }
                case DAY_OFF -> dto.setDayOffCount(count);
            }
        }

        return new ArrayList<>(summaryMap.values());
    }
    private void normalizeStatus(Attendance attendance, CompanyConfig config, LocalDate today) {
        if (attendance.getStatus() == AttendanceStatus.APPROVED || attendance.getStatus() == AttendanceStatus.DAY_OFF) {
            return;
        }

        // Case: No check-in and no check-out
        if (attendance.getCheckIn() == null && attendance.getCheckOut() == null) {
            if (attendance.getDate().isBefore(today)) {
                // If it's a weekend (Saturday or Sunday), mark as DAY_OFF
                DayOfWeek dow = attendance.getDate().getDayOfWeek();
                if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
                    attendance.setStatus(AttendanceStatus.DAY_OFF);
                } else {
                    attendance.setStatus(AttendanceStatus.ABSENT);
                }
            } else {
                attendance.setStatus(AttendanceStatus.PENDING);
            }
            attendance.setTotalHours(null);
            return;
        }

        // Case: Only check-in, no check-out yet (Today or in-progress)
        if (attendance.getCheckIn() != null && attendance.getCheckOut() == null) {
            // D27: Safe null-check for work start time
            boolean isLate = config.getWorkStartTime() != null
                    ? attendance.getCheckIn().toLocalTime().isAfter(config.getWorkStartTime())
                    : false;
            attendance.setStatus(isLate ? AttendanceStatus.LATE : AttendanceStatus.PENDING);
            attendance.setTotalHours(null);
            return;
        }

        // Case: Both check-in and check-out exist
        BigDecimal totalHours = computeWorkHours(attendance.getCheckIn(), attendance.getCheckOut(), config);
        attendance.setTotalHours(totalHours);

        // D27: Safe null-check for work start time
        boolean isLate = config.getWorkStartTime() != null
                ? attendance.getCheckIn().toLocalTime().isAfter(config.getWorkStartTime())
                : false;
        BigDecimal standardHours = config.getStandardHours() == null
                ? BigDecimal.valueOf(8)
                : config.getStandardHours();

        if (totalHours.compareTo(standardHours) < 0) {
            // Note: If it's today and they checked out but it's not actually "end of day"
            // yet,
            // we still mark it insufficient if they actually punched out.
            attendance.setStatus(AttendanceStatus.INSUFFICIENT);
        } else {
            attendance.setStatus(isLate ? AttendanceStatus.LATE : AttendanceStatus.ON_TIME);
        }
    }

    private BigDecimal computeWorkHours(LocalDateTime checkIn, LocalDateTime checkOut, CompanyConfig config) {
        // Defensive check for null parameters
        if (checkIn == null || checkOut == null) {
            return BigDecimal.ZERO;
        }

        Duration total = Duration.between(checkIn, checkOut);
        if (total.isNegative()) {
            return BigDecimal.ZERO;
        }

        LocalDate date = checkIn.toLocalDate();
        // D26: Safe null-check for lunch break times
        Duration overlap = Duration.ZERO;
        if (config.getLunchBreakStart() != null && config.getLunchBreakEnd() != null) {
            LocalDateTime lunchStart = LocalDateTime.of(date, config.getLunchBreakStart());
            LocalDateTime lunchEnd = LocalDateTime.of(date, config.getLunchBreakEnd());
            overlap = overlap(checkIn, checkOut, lunchStart, lunchEnd);
        }

        Duration actual = total.minus(overlap);
        if (actual.isNegative()) {
            actual = Duration.ZERO;
        }

        BigDecimal minutes = BigDecimal.valueOf(actual.toMinutes());
        return minutes.divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }

    private Duration overlap(LocalDateTime aStart, LocalDateTime aEnd, LocalDateTime bStart, LocalDateTime bEnd) {
        LocalDateTime start = aStart.isAfter(bStart) ? aStart : bStart;
        LocalDateTime end = aEnd.isBefore(bEnd) ? aEnd : bEnd;
        if (end.isAfter(start)) {
            return Duration.between(start, end);
        }
        return Duration.ZERO;
    }

    private CompanyConfig getCompanyConfig() {
        return companyConfigRepository.findById(DEFAULT_CONFIG_ID)
                .orElseThrow(() -> new IllegalStateException("Cấu hình công ty không tìm thấy"));
    }

    private Employee resolveCurrentEmployee(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản đăng nhập."));
        return employeeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản chưa được gán hồ sơ nhân viên."));
    }

    private boolean hasAuthority(Authentication authentication, String authority) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(authority));
    }

    public ImportResultResponse<AttendanceDTO> importMachineAttendance(MultipartFile file) throws Exception {
        final int chunkSize = Math.max(100, importChunkSize);
        CompanyConfig config = getCompanyConfig();
        List<ImportErrorResponse> processErrors = new ArrayList<>();
        int[] successCount = { 0 };
        int[] dbErrorCount = { 0 };
        int[] chunkIndex = { 0 };
        long importStartNs = System.nanoTime();

        ImportResultResponse<AttendanceDTO> parsed = importExportService.parseAndProcessMachineAttendanceExcel(
                file,
                chunkSize,
                chunk -> transactionTemplate.executeWithoutResult(status -> {
                    long chunkStartNs = System.nanoTime();
                    int currentChunk = ++chunkIndex[0];
                    ChunkImportResult chunkResult = upsertChunk(chunk, config);
                    successCount[0] += chunkResult.successCount();
                    processErrors.addAll(chunkResult.errors());
                    dbErrorCount[0] += chunkResult.errors().size();
                    long chunkMs = (System.nanoTime() - chunkStartNs) / 1_000_000;
                    log.info("attendance-import chunk={} size={} success={} dbErrors={} dbTimeMs={}",
                            currentChunk,
                            chunk.size(),
                            chunkResult.successCount(),
                            chunkResult.errors().size(),
                            chunkMs);
                }));

        long totalMs = (System.nanoTime() - importStartNs) / 1_000_000;
        int parseErrors = parsed.getFailureCount();

        parsed.setSuccessCount(successCount[0]);
        parsed.setFailureCount(parseErrors + processErrors.size());
        if (parsed.getErrors() == null) {
            parsed.setErrors(new ArrayList<>());
        }
        parsed.getErrors().addAll(processErrors);
        parsed.setData(new ArrayList<>());
        parsed.setMessage("Đã xử lý xong dữ liệu máy chấm công. Thành công: " + successCount[0]
                + ", Lỗi parse: " + parseErrors
                + ", Lỗi ghi DB: " + processErrors.size());
        log.info(
                "attendance-import completed totalRows={} success={} parseErrors={} dbErrors={} chunks={} chunkSize={} totalTimeMs={}",
                parsed.getTotalRows(),
                successCount[0],
                parseErrors,
                dbErrorCount[0],
                chunkIndex[0],
                chunkSize,
                totalMs);
        return parsed;
    }

    private ChunkImportResult upsertChunk(List<AttendanceDTO> chunk, CompanyConfig config) {
        if (chunk == null || chunk.isEmpty()) {
            return new ChunkImportResult(0, List.of());
        }

        List<ImportErrorResponse> processErrors = new ArrayList<>();
        int successCount = 0;

        // UPSERT semantics: keep last row for same employeeId+date in a chunk.
        Map<String, AttendanceDTO> uniqueByKey = new LinkedHashMap<>();
        for (AttendanceDTO dto : chunk) {
            if (dto.getEmployeeId() == null || dto.getDate() == null) {
                processErrors.add(new ImportErrorResponse(0,
                        dto.getEmployeeId() != null ? dto.getEmployeeId().toString() : "N/A",
                        "Thiếu employeeId hoặc date."));
                continue;
            }
            uniqueByKey.put(dto.getEmployeeId() + "|" + dto.getDate(), dto);
        }

        if (uniqueByKey.isEmpty()) {
            return new ChunkImportResult(0, processErrors);
        }

        List<AttendanceDTO> deduped = new ArrayList<>(uniqueByKey.values());
        Set<UUID> employeeIds = deduped.stream().map(AttendanceDTO::getEmployeeId).collect(Collectors.toSet());
        Map<UUID, Employee> employeeById = employeeRepository.findAllById(employeeIds).stream()
                .collect(Collectors.toMap(Employee::getId, e -> e));

        LocalDate today = LocalDate.now(APP_ZONE);
        List<Attendance> pendingSave = new ArrayList<>(deduped.size());
        for (AttendanceDTO dto : deduped) {
            try {
                Employee employee = employeeById.get(dto.getEmployeeId());
                if (employee == null) {
                    processErrors.add(new ImportErrorResponse(0, dto.getEmployeeId().toString(),
                            "Nhân viên " + dto.getEmployeeId() + " không tồn tại."));
                    continue;
                }

                Attendance attendance = Attendance.builder()
                        .employee(employee)
                        .date(dto.getDate())
                        .build();

                if (dto.getCheckIn() != null)
                    attendance.setCheckIn(dto.getCheckIn());
                if (dto.getCheckOut() != null)
                    attendance.setCheckOut(dto.getCheckOut());
                normalizeStatus(attendance, config, today);
                pendingSave.add(attendance);
                successCount++;
            } catch (Exception e) {
                processErrors.add(new ImportErrorResponse(0, dto.getEmployeeId().toString(), e.getMessage()));
            }
        }

        if (!pendingSave.isEmpty()) {
            batchUpsertAttendances(pendingSave);
        }
        return new ChunkImportResult(successCount, processErrors);
    }

    /**
     * PostgreSQL: multi-row
     * {@code INSERT ... VALUES (...),(...) ON CONFLICT DO UPDATE}
     * — ít round-trip hơn {@code batchUpdate} từng dòng; vẫn merge +
     * normalizeStatus ở Java.
     */
    private void batchUpsertAttendances(List<Attendance> rows) {
        if (rows.isEmpty()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        for (Attendance a : rows) {
            if (a.getId() == null) {
                a.setId(UUID.randomUUID());
            }
            if (a.getCreatedAt() == null) {
                a.setCreatedAt(now);
            }
            a.setUpdatedAt(now);
            if (a.getStatus() == null) {
                a.setStatus(AttendanceStatus.PENDING);
            }
        }
        int perStmt = Math.min(2000, Math.max(50, jdbcMultiRowsPerStatement));
        for (int from = 0; from < rows.size(); from += perStmt) {
            int to = Math.min(from + perStmt, rows.size());
            List<Attendance> slice = rows.subList(from, to);
            String sql = buildMultiRowAttendanceUpsertSql(slice.size());
            jdbcTemplate.update(sql, ps -> bindAttendanceUpsertSlice(ps, slice));
        }
    }

    private static String buildMultiRowAttendanceUpsertSql(int rowCount) {
        StringBuilder sb = new StringBuilder(384 + rowCount * (UPSERT_VALUE_ROW.length() + 2));
        sb.append(
                """
                        INSERT INTO hrm.attendances AS t (id, employee_id, date, check_in, check_out, total_hours, status, note, created_at, updated_at)
                        VALUES """);
        for (int i = 0; i < rowCount; i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(UPSERT_VALUE_ROW);
        }
        sb.append(' ');
        sb.append(UPSERT_ON_CONFLICT);
        return sb.toString();
    }

    private static void bindAttendanceUpsertSlice(PreparedStatement ps, List<Attendance> slice) throws SQLException {
        int idx = 1;
        for (Attendance a : slice) {
            ps.setObject(idx++, a.getId());
            ps.setObject(idx++, a.getEmployee().getId());
            ps.setDate(idx++, java.sql.Date.valueOf(a.getDate()));
            if (a.getCheckIn() != null) {
                ps.setTimestamp(idx++, Timestamp.valueOf(a.getCheckIn()));
            } else {
                ps.setNull(idx++, Types.TIMESTAMP);
            }
            if (a.getCheckOut() != null) {
                ps.setTimestamp(idx++, Timestamp.valueOf(a.getCheckOut()));
            } else {
                ps.setNull(idx++, Types.TIMESTAMP);
            }
            if (a.getTotalHours() != null) {
                ps.setBigDecimal(idx++, a.getTotalHours());
            } else {
                ps.setNull(idx++, Types.NUMERIC);
            }
            ps.setString(idx++, a.getStatus().name());
            if (a.getNote() != null) {
                ps.setString(idx++, a.getNote());
            } else {
                ps.setNull(idx++, Types.VARCHAR);
            }
            ps.setTimestamp(idx++, Timestamp.valueOf(a.getCreatedAt()));
            ps.setTimestamp(idx++, Timestamp.valueOf(a.getUpdatedAt()));
        }
    }

    private record ChunkImportResult(int successCount, List<ImportErrorResponse> errors) {
    }

    @Transactional
    @CacheEvict(value = "employee_stats", allEntries = true)
    public void recalculateMonthlyAttendance(Integer month, Integer year, Authentication authentication) {
        if (!hasAuthority(authentication, "ATT_IMPORT")) {
            throw new AccessDeniedException("Bạn không có quyền tính toán lại dữ liệu chuyên cần.");
        }

        int resolvedYear = year == null ? LocalDate.now(APP_ZONE).getYear() : year;
        int resolvedMonth = month == null ? LocalDate.now(APP_ZONE).getMonthValue() : month;

        LocalDate fromDate = LocalDate.of(resolvedYear, resolvedMonth, 1);
        LocalDate toDate = fromDate.withDayOfMonth(fromDate.lengthOfMonth());

        CompanyConfig config = getCompanyConfig();
        LocalDate today = LocalDate.now(APP_ZONE);

        // Fetch all attendances for the month
        List<Attendance> allAttendances = attendanceRepository.findByDateBetween(fromDate, toDate);

        log.info("Recalculating attendance for {}/{} - {} records", resolvedMonth, resolvedYear, allAttendances.size());

        for (Attendance attendance : allAttendances) {
            normalizeStatus(attendance, config, today);
        }

        batchUpsertAttendances(allAttendances);

        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user != null) {
            auditService.log(
                user.getId(),
                user.getEmail(),
                "RECALCULATE_ATTENDANCE",
                "attendances",
                resolvedMonth + "-" + resolvedYear,
                null,
                "Recalculated " + allAttendances.size() + " records"
            );
        }
    }

    @Transactional
    @CacheEvict(value = "employee_stats", allEntries = true)
    public AttendanceDTO updateManualAttendance(com.hrm.dto.ManualAttendanceRequest request, Authentication authentication) {
        if (!hasAuthority(authentication, "ATT_IMPORT")) {
            throw new AccessDeniedException("Bạn không có quyền chỉnh sửa chấm công thủ công.");
        }

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên."));
        
        LocalDate date = request.getDate();
        Attendance attendance = attendanceRepository.findByEmployeeAndDate(employee, date)
                .orElseGet(() -> Attendance.builder()
                        .employee(employee)
                        .date(date)
                        .createdAt(LocalDateTime.now(APP_ZONE))
                        .build());

        String oldData = String.format("In: %s, Out: %s, Status: %s", 
                attendance.getCheckIn(), attendance.getCheckOut(), attendance.getStatus());

        attendance.setCheckIn(request.getCheckIn());
        attendance.setCheckOut(request.getCheckOut());
        attendance.setNote(request.getNote());
        attendance.setUpdatedAt(LocalDateTime.now(APP_ZONE));

        normalizeStatus(attendance, getCompanyConfig(), LocalDate.now(APP_ZONE));
        
        Attendance saved = attendanceRepository.save(attendance);

        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user != null) {
            String newData = String.format("In: %s, Out: %s, Status: %s, Note: %s", 
                    saved.getCheckIn(), saved.getCheckOut(), saved.getStatus(), saved.getNote());
            
            auditService.log(
                user.getId(),
                user.getEmail(),
                "MANUAL_ATTENDANCE_UPDATE",
                "attendances",
                saved.getId().toString(),
                oldData,
                "Updated by HR/Admin: " + newData
            );
        }

        return toDto(saved);
    }

    private AttendanceDTO toDto(Attendance attendance) {
        AttendanceDTO dto = new AttendanceDTO();
        dto.setId(attendance.getId());
        // D25: Safe null-check for lazy-loaded employee relationship
        if (attendance.getEmployee() != null) {
            dto.setEmployeeId(attendance.getEmployee().getId());
            dto.setEmployeeName(attendance.getEmployee().getFullName());
        }
        dto.setDate(attendance.getDate());
        dto.setCheckIn(attendance.getCheckIn());
        dto.setCheckOut(attendance.getCheckOut());
        dto.setTotalHours(attendance.getTotalHours());
        dto.setStatus(attendance.getStatus());
        dto.setNote(attendance.getNote());
        return dto;
    }
    @Transactional
    public ResponseEntity<byte[]> exportAttendanceMatrix(Integer month, Integer year, Authentication authentication) throws Exception {
        int m = (month != null) ? month : LocalDate.now().getMonthValue();
        int y = (year != null) ? year : LocalDate.now().getYear();

        CompanyConfig config = getCompanyConfig();
        double stdHours = config.getStandardHours() != null ? config.getStandardHours().doubleValue() : 8.0;

        List<com.hrm.dto.TeamMatrixDTO> data = getTeamMatrix(m, y, authentication);
        byte[] bytes = importExportService.exportAttendanceMatrixToExcel(m, y, data, stdHours);

        String filename = "Bang_cham_cong_" + m + "_" + y + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(bytes);
    }
}
