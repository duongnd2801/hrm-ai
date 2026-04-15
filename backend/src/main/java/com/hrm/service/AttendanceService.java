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

    private static final String UPSERT_VALUE_ROW = "(?, ?, ?, ?, ?, ?, CAST(? AS hrm.attendance_status), ?, ?, ?)";

    private static final String UPSERT_ON_CONFLICT = """
            ON CONFLICT (employee_id, date)
            DO UPDATE SET
              check_in = EXCLUDED.check_in,
              check_out = EXCLUDED.check_out,
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
        normalizeStatus(attendance, config);
        try {
            return toDto(attendanceRepository.saveAndFlush(attendance));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Bạn đã check-in hoặc thao tác đang được xử lý.");
        }
    }

    @Transactional
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
        normalizeStatus(attendance, getCompanyConfig());
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
        List<Attendance> records = attendanceRepository.findByEmployeeAndDateBetweenOrderByDateAsc(target, fromDate,
                toDate);
        records.forEach(record -> normalizeStatus(record, config));
        return records.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
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

        for (Object[] row : stats) {
            UUID empId = (UUID) row[0];
            String name = (String) row[1];
            String dept = (String) row[2];
            AttendanceStatus status = (AttendanceStatus) row[3];
            long count = (long) row[4];

            com.hrm.dto.AttendanceSummaryDTO dto = summaryMap.computeIfAbsent(empId,
                    id -> com.hrm.dto.AttendanceSummaryDTO.builder()
                            .employeeId(id)
                            .employeeName(name)
                            .departmentName(dept != null ? dept : "N/A")
                            .build());

            switch (status) {
                case ON_TIME -> dto.setOnTimeCount(count);
                case LATE -> dto.setLateCount(count);
                case INSUFFICIENT -> dto.setInsufficientCount(count);
                case ABSENT -> dto.setAbsentCount(count);
                case APPROVED -> dto.setApprovedCount(count);
                case DAY_OFF -> dto.setDayOffCount(count);
            }
        }

        // Compute total work days
        for (com.hrm.dto.AttendanceSummaryDTO dto : summaryMap.values()) {
            dto.setTotalWorkDays(
                    dto.getOnTimeCount() + dto.getLateCount() + dto.getInsufficientCount() + dto.getApprovedCount());
        }

        return new ArrayList<>(summaryMap.values());
    }

    private void normalizeStatus(Attendance attendance, CompanyConfig config) {
        if (attendance.getStatus() == AttendanceStatus.APPROVED || attendance.getStatus() == AttendanceStatus.DAY_OFF) {
            return;
        }

        LocalDate today = LocalDate.now(APP_ZONE);

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

    @Transactional
    public ImportResultResponse<AttendanceDTO> importMachineAttendance(ImportResultResponse<AttendanceDTO> result) {
        List<AttendanceDTO> data = result.getData();
        if (data == null || data.isEmpty())
            return result;

        int successCount = 0;
        List<ImportErrorResponse> processErrors = new ArrayList<>();
        CompanyConfig config = getCompanyConfig();

        // Prefetch employees (avoid N queries)
        Set<UUID> employeeIds = data.stream()
                .map(AttendanceDTO::getEmployeeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (employeeIds.isEmpty()) {
            processErrors.add(new ImportErrorResponse(0, "N/A", "Không có mã nhân viên hợp lệ trong dữ liệu import."));
            result.setSuccessCount(0);
            result.setFailureCount(result.getFailureCount() + processErrors.size());
            if (result.getErrors() == null)
                result.setErrors(new ArrayList<>());
            result.getErrors().addAll(processErrors);
            result.setMessage("Không có dữ liệu hợp lệ để import.");
            return result;
        }

        Map<UUID, Employee> employeeById = employeeRepository.findAllById(employeeIds).stream()
                .collect(Collectors.toMap(Employee::getId, e -> e));

        // Compute date range to prefetch existing attendance rows
        LocalDate minDate = null;
        LocalDate maxDate = null;
        for (AttendanceDTO dto : data) {
            LocalDate d = dto.getDate();
            if (d == null)
                continue;
            if (minDate == null || d.isBefore(minDate))
                minDate = d;
            if (maxDate == null || d.isAfter(maxDate))
                maxDate = d;
        }

        Map<String, Attendance> existingByKey = new HashMap<>();
        if (minDate != null && maxDate != null) {
            List<Attendance> existing = attendanceRepository.findByEmployeeIdInAndDateBetween(employeeIds, minDate,
                    maxDate);
            for (Attendance a : existing) {
                if (a.getEmployee() == null || a.getEmployee().getId() == null || a.getDate() == null)
                    continue;
                existingByKey.put(a.getEmployee().getId().toString() + "|" + a.getDate(), a);
            }
        }

        // Build + save in chunks (avoid per-row save overhead)
        final int CHUNK_SIZE = 500;
        List<Attendance> pendingSave = new ArrayList<>(Math.min(CHUNK_SIZE, data.size()));

        for (AttendanceDTO dto : data) {
            try {
                if (dto.getEmployeeId() == null) {
                    processErrors.add(new ImportErrorResponse(0, "N/A", "Mã nhân viên (UUID) bị thiếu."));
                    continue;
                }
                if (dto.getDate() == null) {
                    processErrors.add(
                            new ImportErrorResponse(0, dto.getEmployeeId().toString(), "Ngày chấm công bị thiếu."));
                    continue;
                }

                Employee employee = employeeById.get(dto.getEmployeeId());
                if (employee == null) {
                    processErrors.add(new ImportErrorResponse(0, dto.getEmployeeId().toString(),
                            "Nhân viên " + dto.getEmployeeId() + " không tồn tại."));
                    continue;
                }

                String key = dto.getEmployeeId().toString() + "|" + dto.getDate();
                Attendance attendance = existingByKey.get(key);
                if (attendance == null) {
                    attendance = Attendance.builder()
                            .employee(employee)
                            .date(dto.getDate())
                            .build();
                    existingByKey.put(key, attendance);
                } else {
                    // Ensure attached employee reference is consistent (avoid extra lazy-load)
                    attendance.setEmployee(employee);
                }

                if (dto.getCheckIn() != null)
                    attendance.setCheckIn(dto.getCheckIn());
                if (dto.getCheckOut() != null)
                    attendance.setCheckOut(dto.getCheckOut());

                normalizeStatus(attendance, config);
                pendingSave.add(attendance);
                successCount++;

                if (pendingSave.size() >= CHUNK_SIZE) {
                    batchUpsertAttendances(pendingSave);
                    pendingSave.clear();
                }
            } catch (Exception e) {
                processErrors.add(new ImportErrorResponse(0,
                        dto.getEmployeeId() != null ? dto.getEmployeeId().toString() : "Unknown", e.getMessage()));
            }
        }

        if (!pendingSave.isEmpty()) {
            batchUpsertAttendances(pendingSave);
        }

        result.setSuccessCount(successCount);
        result.setFailureCount(result.getFailureCount() + processErrors.size());
        if (result.getErrors() == null) {
            result.setErrors(new java.util.ArrayList<>());
        }
        result.getErrors().addAll(processErrors);
        result.setMessage("Đã xử lý xong dữ liệu máy chấm công. Thành công: " + successCount + ", Lỗi mới: "
                + processErrors.size());
        return result;
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

        LocalDate minDate = deduped.stream().map(AttendanceDTO::getDate).min(LocalDate::compareTo).orElse(null);
        LocalDate maxDate = deduped.stream().map(AttendanceDTO::getDate).max(LocalDate::compareTo).orElse(null);

        Map<String, Attendance> existingByKey = new HashMap<>();
        if (minDate != null && maxDate != null) {
            List<Attendance> existing = attendanceRepository.findByEmployeeIdInAndDateBetween(employeeIds, minDate,
                    maxDate);
            for (Attendance a : existing) {
                if (a.getEmployee() == null || a.getEmployee().getId() == null || a.getDate() == null)
                    continue;
                existingByKey.put(a.getEmployee().getId() + "|" + a.getDate(), a);
            }
        }

        List<Attendance> pendingSave = new ArrayList<>(deduped.size());
        for (AttendanceDTO dto : deduped) {
            try {
                Employee employee = employeeById.get(dto.getEmployeeId());
                if (employee == null) {
                    processErrors.add(new ImportErrorResponse(0, dto.getEmployeeId().toString(),
                            "Nhân viên " + dto.getEmployeeId() + " không tồn tại."));
                    continue;
                }

                String key = dto.getEmployeeId() + "|" + dto.getDate();
                Attendance attendance = existingByKey.get(key);
                if (attendance == null) {
                    attendance = Attendance.builder()
                            .employee(employee)
                            .date(dto.getDate())
                            .build();
                } else {
                    attendance.setEmployee(employee);
                }

                if (dto.getCheckIn() != null)
                    attendance.setCheckIn(dto.getCheckIn());
                if (dto.getCheckOut() != null)
                    attendance.setCheckOut(dto.getCheckOut());
                normalizeStatus(attendance, config);
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
        LocalDateTime now = LocalDateTime.now();
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
}
