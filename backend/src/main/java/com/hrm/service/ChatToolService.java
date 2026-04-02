package com.hrm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.hrm.entity.*;
import com.hrm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatToolService {

    private final EmployeeRepository employeeRepository;
    private final PayrollRepository payrollRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final ApologyRepository apologyRepository;
    private final OTRequestRepository otRequestRepository;
    private final CompanyConfigRepository companyConfigRepository;

    private final LeaveRequestService leaveRequestService;
    private final ApologyService apologyService;
    private final OTRequestService otRequestService;

    public Map<String, Object> executeTool(
            String toolName,
            JsonNode arguments,
            User currentUser,
            Authentication authentication,
            Integer fallbackMonth,
            Integer fallbackYear
    ) {
        return switch (toolName) {
            case "getMyPayroll" -> getMyPayroll(arguments, currentUser, fallbackMonth, fallbackYear);
            case "getEmployeePayroll" -> getEmployeePayroll(arguments, currentUser, fallbackMonth, fallbackYear);
            case "getMyAttendance" -> getMyAttendance(arguments, currentUser, fallbackMonth, fallbackYear);
            case "getMyLeaveBalance" -> getMyLeaveBalance(currentUser, fallbackYear);
            case "getTeamStats" -> getTeamStats(arguments, currentUser, fallbackMonth, fallbackYear);
            case "getCompanyHeadcount" -> getCompanyHeadcount();
            case "getCompanyPolicy" -> getCompanyPolicy();
            case "getUpcomingPublicHolidays" -> getUpcomingPublicHolidays(arguments);
            case "getPendingRequests" -> getPendingRequests(currentUser);
            case "approveRequest" -> approveRequest(arguments, currentUser, authentication);
            case "getMySummary" -> getMySummary(arguments, currentUser, fallbackMonth, fallbackYear);
            default -> Map.of("error", "Tool không hợp lệ: " + toolName);
        };
    }

    private Map<String, Object> getMySummary(JsonNode arguments, User currentUser, Integer fallbackMonth, Integer fallbackYear) {
        Map<String, Object> payroll = getMyPayroll(arguments, currentUser, fallbackMonth, fallbackYear);
        Map<String, Object> attendance = getMyAttendance(arguments, currentUser, fallbackMonth, fallbackYear);
        Map<String, Object> leaveBalance = getMyLeaveBalance(currentUser, fallbackYear);

        Map<String, Object> merged = new LinkedHashMap<>();
        merged.put("payroll", payroll);
        merged.put("attendance", attendance);
        merged.put("leaveBalance", leaveBalance);
        merged.put("message", "Đã lấy tóm tắt lương, chấm công và phép của bạn.");
        return merged;
    }

    private Map<String, Object> getMyPayroll(JsonNode arguments, User currentUser, Integer fallbackMonth, Integer fallbackYear) {
        Employee employee = findEmployeeByUser(currentUser);
        LocalDate now = LocalDate.now();
        int month = getIntArg(arguments, "month", fallbackMonth != null ? fallbackMonth : now.getMonthValue());
        int year = getIntArg(arguments, "year", fallbackYear != null ? fallbackYear : now.getYear());

        Optional<Payroll> payrollOpt = payrollRepository.findByEmployeeAndMonthAndYear(employee, month, year);
        if (payrollOpt.isEmpty()) {
            return Map.of(
                    "employeeName", employee.getFullName(),
                    "month", month,
                    "year", year,
                    "message", "Hiện chưa có bảng lương cho tháng này."
            );
        }

        Payroll p = payrollOpt.get();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("employeeName", employee.getFullName());
        data.put("month", p.getMonth());
        data.put("year", p.getYear());
        data.put("baseSalary", p.getBaseSalary());
        data.put("actualDays", p.getActualDays());
        data.put("otHours", p.getOtHours());
        data.put("otAmount", p.getOtAmount());
        data.put("allowance", p.getAllowance());
        data.put("grossSalary", p.getGrossSalary());
        data.put("bhxh", p.getBhxh());
        data.put("bhyt", p.getBhyt());
        data.put("bhtn", p.getBhtn());
        data.put("incomeTax", p.getIncomeTax());
        data.put("netSalary", p.getNetSalary());
        data.put("message", "Đã lấy bảng lương thực tế từ DB.");
        return data;
    }

    private Map<String, Object> getEmployeePayroll(JsonNode arguments, User currentUser, Integer fallbackMonth, Integer fallbackYear) {
        if (currentUser.getRole() == RoleType.EMPLOYEE) {
            return Map.of("message", "Bạn chỉ có quyền xem lương của chính mình.");
        }

        String keyword = getTextArg(arguments, "employeeKeyword", "").trim();
        if (keyword.isBlank()) {
            return Map.of("message", "Vui lòng nêu rõ nhân viên cần xem lương, ví dụ: lương tháng 3 của Phạm Minh.");
        }

        Optional<Employee> targetOpt = findEmployeeByKeyword(keyword, currentUser);
        if (targetOpt.isEmpty()) {
            return Map.of(
                    "message",
                    "Không tìm thấy nhân viên phù hợp trong phạm vi quyền của bạn. Bạn thử nhập tên đầy đủ hoặc email."
            );
        }

        Employee target = targetOpt.get();
        LocalDate now = LocalDate.now();
        int month = getIntArg(arguments, "month", fallbackMonth != null ? fallbackMonth : now.getMonthValue());
        int year = getIntArg(arguments, "year", fallbackYear != null ? fallbackYear : now.getYear());

        Optional<Payroll> payrollOpt = payrollRepository.findByEmployeeAndMonthAndYear(target, month, year);
        if (payrollOpt.isEmpty()) {
            return Map.of(
                    "employeeName", target.getFullName(),
                    "month", month,
                    "year", year,
                    "message", "Hiện chưa có bảng lương của nhân viên này cho kỳ yêu cầu."
            );
        }

        Payroll p = payrollOpt.get();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("employeeName", target.getFullName());
        data.put("month", p.getMonth());
        data.put("year", p.getYear());
        data.put("baseSalary", p.getBaseSalary());
        data.put("actualDays", p.getActualDays());
        data.put("otHours", p.getOtHours());
        data.put("otAmount", p.getOtAmount());
        data.put("allowance", p.getAllowance());
        data.put("grossSalary", p.getGrossSalary());
        data.put("bhxh", p.getBhxh());
        data.put("bhyt", p.getBhyt());
        data.put("bhtn", p.getBhtn());
        data.put("incomeTax", p.getIncomeTax());
        data.put("netSalary", p.getNetSalary());
        data.put("message", "Đã lấy bảng lương nhân viên theo quyền truy cập hiện tại.");
        return data;
    }

    private Map<String, Object> getMyAttendance(JsonNode arguments, User currentUser, Integer fallbackMonth, Integer fallbackYear) {
        Employee employee = findEmployeeByUser(currentUser);
        LocalDate now = LocalDate.now();
        int month = getIntArg(arguments, "month", fallbackMonth != null ? fallbackMonth : now.getMonthValue());
        int year = getIntArg(arguments, "year", fallbackYear != null ? fallbackYear : now.getYear());

        YearMonth ym = YearMonth.of(year, month);
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();

        List<Attendance> records = attendanceRepository.findByEmployeeIdAndDateBetween(employee.getId(), from, to);
        long onTime = records.stream().filter(a -> a.getStatus() == AttendanceStatus.ON_TIME).count();
        long late = records.stream().filter(a -> a.getStatus() == AttendanceStatus.LATE).count();
        long insufficient = records.stream().filter(a -> a.getStatus() == AttendanceStatus.INSUFFICIENT).count();
        long approved = records.stream().filter(a -> a.getStatus() == AttendanceStatus.APPROVED).count();

        double totalHours = records.stream()
                .map(Attendance::getTotalHours)
                .filter(Objects::nonNull)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("employeeName", employee.getFullName());
        data.put("month", month);
        data.put("year", year);
        data.put("records", records.size());
        data.put("onTimeDays", onTime);
        data.put("lateDays", late);
        data.put("insufficientDays", insufficient);
        data.put("approvedDays", approved);
        data.put("totalWorkedHours", round1(totalHours));
        data.put("message", "Đã lấy dữ liệu chấm công thực tế từ DB.");
        return data;
    }

    private Map<String, Object> getMyLeaveBalance(User currentUser, Integer fallbackYear) {
        Employee employee = findEmployeeByUser(currentUser);
        int year = fallbackYear != null ? fallbackYear : LocalDate.now().getYear();

        int annualLeaveQuota = 12;
        List<LeaveRequest> allLeaves = leaveRequestRepository.findByEmployeeOrderByCreatedAtDesc(employee);

        long usedAnnualLeaveDays = allLeaves.stream()
                .filter(r -> r.getStatus() == ApologyStatus.APPROVED)
                .filter(r -> r.getType() == LeaveType.ANNUAL)
                .mapToLong(r -> overlapDaysInYear(r.getStartDate(), r.getEndDate(), year))
                .sum();

        long pendingLeave = allLeaves.stream().filter(r -> r.getStatus() == ApologyStatus.PENDING).count();
        long approvedLeave = allLeaves.stream().filter(r -> r.getStatus() == ApologyStatus.APPROVED).count();
        long rejectedLeave = allLeaves.stream().filter(r -> r.getStatus() == ApologyStatus.REJECTED).count();
        long pendingApology = apologyRepository.countByEmployeeAndStatus(employee, ApologyStatus.PENDING);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("employeeName", employee.getFullName());
        data.put("year", year);
        data.put("annualLeaveQuota", annualLeaveQuota);
        data.put("usedAnnualLeaveDays", usedAnnualLeaveDays);
        data.put("remainingAnnualLeaveDays", Math.max(0, annualLeaveQuota - usedAnnualLeaveDays));
        data.put("pendingLeaveRequests", pendingLeave);
        data.put("approvedLeaveRequests", approvedLeave);
        data.put("rejectedLeaveRequests", rejectedLeave);
        data.put("pendingApologies", pendingApology);
        data.put("message", "Đã lấy số dư phép và trạng thái đơn thực tế từ DB.");
        return data;
    }

    private Map<String, Object> getTeamStats(JsonNode arguments, User currentUser, Integer fallbackMonth, Integer fallbackYear) {
        ensureManagerHrAdmin(currentUser);

        LocalDate now = LocalDate.now();
        int month = getIntArg(arguments, "month", fallbackMonth != null ? fallbackMonth : now.getMonthValue());
        int year = getIntArg(arguments, "year", fallbackYear != null ? fallbackYear : now.getYear());
        YearMonth ym = YearMonth.of(year, month);
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();

        List<Employee> team = resolveScopedTeam(currentUser);
        if (team.isEmpty()) {
            return Map.of(
                    "month", month,
                    "year", year,
                    "teamSize", 0,
                    "message", "Không có nhân sự trong phạm vi team để thống kê."
            );
        }

        CompanyConfig config = companyConfigRepository.findById("default").orElse(null);
        double standardHours = config != null && config.getStandardHours() != null
                ? config.getStandardHours().doubleValue() : 8.0;

        long totalLate = 0;
        double totalOtHours = 0;
        long totalNetSalary = 0;
        int salaryCount = 0;
        Map<String, Long> lateByEmployee = new HashMap<>();

        for (Employee emp : team) {
            List<Attendance> records = attendanceRepository.findByEmployeeIdAndDateBetween(emp.getId(), from, to);
            long lateDays = records.stream().filter(a -> a.getStatus() == AttendanceStatus.LATE).count();
            lateByEmployee.put(emp.getFullName(), lateDays);
            totalLate += lateDays;

            double otHours = records.stream()
                    .map(Attendance::getTotalHours)
                    .filter(Objects::nonNull)
                    .mapToDouble(h -> Math.max(0, h.doubleValue() - standardHours))
                    .sum();
            totalOtHours += otHours;

            Optional<Payroll> payrollOpt = payrollRepository.findByEmployeeAndMonthAndYear(emp, month, year);
            if (payrollOpt.isPresent() && payrollOpt.get().getNetSalary() != null) {
                totalNetSalary += payrollOpt.get().getNetSalary();
                salaryCount++;
            }
        }

        List<Map<String, Object>> topLateEmployees = lateByEmployee.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(e -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("employeeName", e.getKey());
                    item.put("lateDays", e.getValue());
                    return item;
                })
                .toList();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("month", month);
        data.put("year", year);
        data.put("teamSize", team.size());
        data.put("totalLateDays", totalLate);
        data.put("totalOtHours", round1(totalOtHours));
        data.put("avgNetSalary", salaryCount > 0 ? totalNetSalary / salaryCount : null);
        data.put("topLateEmployees", topLateEmployees);
        data.put("message", "Đã lấy thống kê team thực tế từ DB.");
        return data;
    }

    private Map<String, Object> getCompanyHeadcount() {
        long totalEmployees = employeeRepository.count();
        long activeEmployees = employeeRepository.countByStatusNot(EmpStatus.INACTIVE);
        long nonActiveEmployees = Math.max(0, totalEmployees - activeEmployees);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalEmployees", totalEmployees);
        data.put("activeEmployees", activeEmployees);
        data.put("nonActiveEmployees", nonActiveEmployees);
        data.put(
                "message",
                String.format(
                        Locale.ROOT,
                        "Công ty hiện có %d nhân viên. Trong đó %d nhân viên đang làm việc và %d nhân viên ở trạng thái khác.",
                        totalEmployees,
                        activeEmployees,
                        nonActiveEmployees
                )
        );
        return data;
    }

    private Map<String, Object> getCompanyPolicy() {
        CompanyConfig config = companyConfigRepository.findById("default").orElse(null);
        if (config == null) {
            return Map.of("message", "Không tìm thấy cấu hình công ty.");
        }

        String policyText = String.format(
                Locale.ROOT,
                "Chính sách công ty:\n" +
                        "- Giờ làm việc: %s - %s\n" +
                        "- Nghỉ trưa: %s - %s\n" +
                        "- Check-in sớm tối đa: %d phút\n" +
                        "- Số giờ chuẩn/ngày: %.1f giờ\n" +
                        "- Ngày công chuẩn/tháng: %d ngày\n" +
                        "- Ngày chốt công: %d\n" +
                        "- OT ngày thường: %.1fx\n" +
                        "- OT cuối tuần: %.1fx\n" +
                        "- OT ngày lễ: %.1fx\n" +
                        "- Nửa ngày sáng tính: %.1f công\n" +
                        "- Nửa ngày chiều tính: %.1f công",
                config.getWorkStartTime(),
                config.getWorkEndTime(),
                config.getLunchBreakStart(),
                config.getLunchBreakEnd(),
                safeInt(config.getEarlyCheckinMinutes()),
                safeDecimal(config.getStandardHours()),
                safeInt(config.getStandardDaysPerMonth()),
                safeInt(config.getCutoffDay()),
                safeDecimal(config.getOtRateWeekday()),
                safeDecimal(config.getOtRateWeekend()),
                safeDecimal(config.getOtRateHoliday()),
                safeDecimal(config.getHalfDayMorningRate()),
                safeDecimal(config.getHalfDayAfternoonRate())
        );

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("workStartTime", config.getWorkStartTime());
        data.put("workEndTime", config.getWorkEndTime());
        data.put("lunchBreakStart", config.getLunchBreakStart());
        data.put("lunchBreakEnd", config.getLunchBreakEnd());
        data.put("earlyCheckinMinutes", config.getEarlyCheckinMinutes());
        data.put("standardHours", config.getStandardHours());
        data.put("standardDaysPerMonth", config.getStandardDaysPerMonth());
        data.put("cutoffDay", config.getCutoffDay());
        data.put("otRateWeekday", config.getOtRateWeekday());
        data.put("otRateWeekend", config.getOtRateWeekend());
        data.put("otRateHoliday", config.getOtRateHoliday());
        data.put("halfDayMorningRate", config.getHalfDayMorningRate());
        data.put("halfDayAfternoonRate", config.getHalfDayAfternoonRate());
        data.put("message", policyText);
        return data;
    }

    private Map<String, Object> getUpcomingPublicHolidays(JsonNode arguments) {
        String countryCode = getTextArg(arguments, "countryCode", "VN").trim().toUpperCase(Locale.ROOT);
        if (countryCode.isBlank()) {
            countryCode = "VN";
        }

        String url = "https://date.nager.at/api/v3/NextPublicHolidays/" + countryCode;
        RestTemplate restTemplate = new RestTemplate();
        try {
            HolidayDto[] rows = restTemplate.getForObject(url, HolidayDto[].class);
            if (rows == null || rows.length == 0) {
                return Map.of(
                        "countryCode", countryCode,
                        "message", "Hiện chưa lấy được dữ liệu ngày lễ sắp tới."
                );
            }

            List<Map<String, Object>> items = new ArrayList<>();
            int limit = Math.min(rows.length, 8);
            for (int i = 0; i < limit; i++) {
                HolidayDto h = rows[i];
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("date", h.date);
                item.put("name", h.localName != null && !h.localName.isBlank() ? h.localName : h.name);
                item.put("global", h.global);
                items.add(item);
            }

            StringBuilder sb = new StringBuilder("Các ngày lễ sắp tới");
            if ("VN".equals(countryCode)) {
                sb.append(" tại Việt Nam");
            }
            sb.append(":\n");
            for (Map<String, Object> item : items) {
                sb.append("- ").append(item.get("date")).append(": ").append(item.get("name")).append('\n');
            }

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("countryCode", countryCode);
            data.put("upcomingHolidays", items);
            data.put("message", sb.toString().trim());
            return data;
        } catch (RestClientException ex) {
            return Map.of(
                    "countryCode", countryCode,
                    "message", "Không thể lấy dữ liệu ngày lễ từ internet lúc này. Bạn thử lại sau giúp mình."
            );
        }
    }

    private Map<String, Object> getPendingRequests(User currentUser) {
        ensureManagerHrAdmin(currentUser);

        List<Employee> scopedTeam = resolveScopedTeam(currentUser);
        Set<UUID> scopedIds = scopedTeam.stream().map(Employee::getId).collect(java.util.stream.Collectors.toSet());

        List<Map<String, Object>> pendingLeaves = leaveRequestRepository.findByStatusOrderByCreatedAtAsc(ApologyStatus.PENDING).stream()
                .filter(r -> scopedIds.contains(r.getEmployee().getId()))
                .limit(20)
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", r.getId());
                    m.put("employeeName", r.getEmployee().getFullName());
                    m.put("type", String.valueOf(r.getType()));
                    m.put("startDate", r.getStartDate());
                    m.put("endDate", r.getEndDate());
                    m.put("status", String.valueOf(r.getStatus()));
                    return m;
                })
                .toList();

        List<Map<String, Object>> pendingApologies = apologyRepository.findByStatusOrderByCreatedAtAsc(ApologyStatus.PENDING).stream()
                .filter(a -> scopedIds.contains(a.getEmployee().getId()))
                .limit(20)
                .map(a -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", a.getId());
                    m.put("employeeName", a.getEmployee().getFullName());
                    m.put("type", String.valueOf(a.getType()));
                    m.put("attendanceDate", a.getAttendance() != null ? a.getAttendance().getDate() : null);
                    m.put("status", String.valueOf(a.getStatus()));
                    return m;
                })
                .toList();

        List<Map<String, Object>> pendingOt = otRequestRepository.findByStatusOrderByCreatedAtAsc(OTStatus.PENDING).stream()
                .filter(o -> scopedIds.contains(o.getEmployee().getId()))
                .limit(20)
                .map(o -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", o.getId());
                    m.put("employeeName", o.getEmployee().getFullName());
                    m.put("date", o.getDate());
                    m.put("hours", o.getHours());
                    m.put("status", String.valueOf(o.getStatus()));
                    return m;
                })
                .toList();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("scope", currentUser.getRole().name());
        data.put("pendingLeaveRequests", pendingLeaves);
        data.put("pendingApologyRequests", pendingApologies);
        data.put("pendingOtRequests", pendingOt);
        data.put("message", "Đã lấy danh sách đơn chờ duyệt trong phạm vi quyền của bạn.");
        return data;
    }

    private Map<String, Object> approveRequest(JsonNode arguments, User currentUser, Authentication authentication) {
        ensureManagerHrAdmin(currentUser);

        String type = getTextArg(arguments, "type", "").toUpperCase(Locale.ROOT);
        String action = getTextArg(arguments, "action", "").toUpperCase(Locale.ROOT);
        String idText = getTextArg(arguments, "id", "");

        if (type.isBlank() || action.isBlank() || idText.isBlank()) {
            throw new IllegalArgumentException("Thiếu tham số type/action/id cho approveRequest.");
        }

        boolean approved = switch (action) {
            case "APPROVE", "APPROVED" -> true;
            case "REJECT", "REJECTED" -> false;
            default -> throw new IllegalArgumentException("action phải là APPROVE hoặc REJECT.");
        };

        UUID requestId = UUID.fromString(idText);
        String resultMessage;

        switch (type) {
            case "LEAVE" -> {
                var dto = leaveRequestService.review(requestId, approved, authentication);
                resultMessage = "Đã " + (approved ? "duyệt" : "từ chối") + " đơn LEAVE của " + dto.getEmployeeName() + ".";
            }
            case "APOLOGY" -> {
                var dto = apologyService.review(requestId, approved, "Xử lý qua AI Chatbot", authentication);
                resultMessage = "Đã " + (approved ? "duyệt" : "từ chối") + " đơn APOLOGY của " + dto.getEmployeeName() + ".";
            }
            case "OT" -> {
                otRequestService.review(requestId, currentUser.getId(), approved);
                resultMessage = "Đã " + (approved ? "duyệt" : "từ chối") + " đơn OT.";
            }
            default -> throw new IllegalArgumentException("type phải là LEAVE/APOLOGY/OT.");
        }

        return Map.of(
                "type", type,
                "action", approved ? "APPROVE" : "REJECT",
                "requestId", requestId,
                "message", resultMessage
        );
    }

    private Employee findEmployeeByUser(User currentUser) {
        return employeeRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản chưa được gắn hồ sơ nhân viên."));
    }

    private List<Employee> resolveScopedTeam(User currentUser) {
        if (currentUser.getRole() == RoleType.MANAGER) {
            Employee manager = findEmployeeByUser(currentUser);
            return employeeRepository.findByManagerId(manager.getId());
        }
        return employeeRepository.findAll();
    }

    private Optional<Employee> findEmployeeByKeyword(String keyword, User currentUser) {
        String key = normalize(keyword);
        Optional<RoleType> requestedRole = parseRequestedRole(key);
        if (requestedRole.isPresent() && (currentUser.getRole() == RoleType.ADMIN || currentUser.getRole() == RoleType.HR)) {
            List<Employee> byRole = employeeRepository.findByUserRole(requestedRole.get());
            if (!byRole.isEmpty()) {
                return Optional.of(byRole.get(0));
            }
        }

        List<Employee> scope;
        if (currentUser.getRole() == RoleType.MANAGER) {
            scope = resolveScopedTeam(currentUser);
        } else if (currentUser.getRole() == RoleType.HR || currentUser.getRole() == RoleType.ADMIN) {
            scope = employeeRepository.findAll();
        } else {
            return Optional.empty();
        }

        Optional<Employee> exactPhrase = scope.stream()
                .filter(e -> normalize(e.getFullName()).contains(key) || normalize(e.getEmail()).contains(key))
                .findFirst();
        if (exactPhrase.isPresent()) {
            return exactPhrase;
        }

        List<String> tokens = Arrays.stream(key.split("\\s+"))
                .map(String::trim)
                .filter(t -> t.length() >= 3)
                .distinct()
                .toList();
        if (tokens.isEmpty()) {
            return Optional.empty();
        }

        return scope.stream()
                .map(e -> Map.entry(e, matchScore(e, tokens)))
                .filter(entry -> entry.getValue() > 0)
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .map(Map.Entry::getKey)
                .findFirst();
    }

    private int matchScore(Employee employee, List<String> tokens) {
        String name = normalize(employee.getFullName());
        String email = normalize(employee.getEmail());
        int score = 0;
        for (String token : tokens) {
            if (name.contains(token)) score += 2;
            if (email.contains(token)) score += 1;
        }
        return score;
    }

    private Optional<RoleType> parseRequestedRole(String normalizedKeyword) {
        if (normalizedKeyword == null || normalizedKeyword.isBlank()) {
            return Optional.empty();
        }
        if (normalizedKeyword.equals("hr") || normalizedKeyword.equals("nhan su")) {
            return Optional.of(RoleType.HR);
        }
        if (normalizedKeyword.equals("admin") || normalizedKeyword.equals("quan tri")) {
            return Optional.of(RoleType.ADMIN);
        }
        if (normalizedKeyword.equals("manager") || normalizedKeyword.equals("quan ly")) {
            return Optional.of(RoleType.MANAGER);
        }
        if (normalizedKeyword.equals("nhan vien") || normalizedKeyword.equals("employee")) {
            return Optional.of(RoleType.EMPLOYEE);
        }
        return Optional.empty();
    }

    private void ensureManagerHrAdmin(User user) {
        RoleType role = user.getRole();
        if (role != RoleType.MANAGER && role != RoleType.HR && role != RoleType.ADMIN) {
            throw new AccessDeniedException("Bạn không có quyền sử dụng chức năng này.");
        }
    }

    private int getIntArg(JsonNode args, String name, int defaultValue) {
        if (args != null && args.has(name) && args.get(name).isInt()) {
            return args.get(name).asInt();
        }
        return defaultValue;
    }

    private String getTextArg(JsonNode args, String name, String defaultValue) {
        if (args != null && args.has(name) && args.get(name).isTextual()) {
            return args.get(name).asText();
        }
        return defaultValue;
    }

    private long overlapDaysInYear(LocalDate startDate, LocalDate endDate, int year) {
        LocalDate from = LocalDate.of(year, 1, 1);
        LocalDate to = LocalDate.of(year, 12, 31);
        LocalDate effectiveStart = startDate.isAfter(from) ? startDate : from;
        LocalDate effectiveEnd = endDate.isBefore(to) ? endDate : to;
        if (effectiveEnd.isBefore(effectiveStart)) {
            return 0;
        }
        return ChronoUnit.DAYS.between(effectiveStart, effectiveEnd) + 1;
    }

    private int safeInt(Integer value) {
        return value != null ? value : 0;
    }

    private double safeDecimal(BigDecimal value) {
        return value != null ? value.doubleValue() : 0.0;
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private String normalize(String input) {
        if (input == null) return "";
        String lowered = input.trim().toLowerCase(Locale.ROOT);
        String normalized = Normalizer.normalize(lowered, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return normalized.replace('đ', 'd');
    }

    private static class HolidayDto {
        public String date;
        public String localName;
        public String name;
        public boolean global;
    }
}
