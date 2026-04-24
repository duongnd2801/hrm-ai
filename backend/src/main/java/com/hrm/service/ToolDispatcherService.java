package com.hrm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hrm.dto.ChatRequestDto;
import com.hrm.entity.User;
import com.hrm.service.ToolPlannerService.PlanDecision;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.Arrays;

/**
 * Xử lý heuristic fallback, parse tool params và điều phối gọi ChatToolService.
 */
@Service
@RequiredArgsConstructor
public class ToolDispatcherService {

    private static final String NON_HRM_FALLBACK = "Mình ưu tiên hỗ trợ nghiệp vụ HRM. Nếu bạn cần, mình có thể trả lời ngắn rồi quay lại lương, công, phép, OT hoặc chính sách.";
    private static final Pattern SIMPLE_MATH_PATTERN = Pattern.compile("^\\s*(-?\\d+)\\s*([+\\-*/xX])\\s*(-?\\d+)\\s*$");

    private final ChatToolService chatToolService;
    private final ObjectMapper objectMapper;

    @Value("${chatbot.interaction.mode:BALANCED}")
    private String interactionModeRaw;

    public Map<String, Object> executeTool(String toolName, JsonNode arguments, User user, Authentication authentication, Integer month, Integer year) {
        return chatToolService.executeTool(toolName, arguments, user, authentication, month, year);
    }

    public String localSummary(String toolName, Map<String, Object> toolResult) {
        if (toolResult == null) {
            return "Mình chưa lấy được dữ liệu phù hợp. Bạn thử hỏi lại cụ thể hơn..";
        }
        return switch (toolName) {
            case "getMyPayroll", "getEmployeePayroll" -> summarizePayroll(toolResult);
            case "getMyAttendance" -> summarizeAttendance(toolResult);
            case "getMyLeaveBalance" -> summarizeLeave(toolResult);
            case "getCompanyHeadcount" -> String.valueOf(toolResult.getOrDefault("message", "Đã lấy thông tin nhân sự công ty."));
            case "getCompanyPolicy", "getUpcomingPublicHolidays" ->
                    String.valueOf(toolResult.getOrDefault("message", "Đã lấy thông tin."));
            case "getTeamStats" -> summarizeTeam(toolResult);
            case "getPendingRequests" -> summarizePending(toolResult);
            case "getProjects" -> summarizeProjects(toolResult);
            case "getProjectMembers" -> summarizeProjectMembers(toolResult);
            case "approveRequest" -> String.valueOf(toolResult.getOrDefault("message", "Đã xử lý yêu cầu."));
            default -> String.valueOf(toolResult.getOrDefault("message", "Đã xử lý yêu cầu thành công."));
        };
    }

    public PlanDecision forcedToolDecision(String userMessage, ChatRequestDto request) {
        String text = normalizeText(userMessage);
        ObjectNode args = baseArgs(request, userMessage);
        ChatIntent recentIntent = deriveRecentIntent(request.getHistory());

        if (text.contains("duyet") || text.contains("tu choi") || text.contains("approve") || text.contains("reject")) {
            String type = text.contains("ot") ? "OT" : text.contains("giai trinh") ? "APOLOGY" : "LEAVE";
            String action = (text.contains("tu choi") || text.contains("reject")) ? "REJECT" : "APPROVE";
            args.put("type", type);
            args.put("action", action);
            UUID id = extractUuid(userMessage);
            if (id != null) {
                args.put("id", id.toString());
            }
            return new PlanDecision(true, "approveRequest", args, null);
        }

        if (containsAny(text, "sap toi co ngay le gi", "sap toi co ngay le nao", "ngay le sap toi",
                "next holiday", "upcoming holiday", "upcoming holidays", "public holiday next")) {
            args.put("countryCode", "VN");
            return new PlanDecision(true, "getUpcomingPublicHolidays", args, null);
        }

        if (containsAnyApprox(text, "so thanh vien cong ty", "so nhan vien cong ty", "tong so nhan vien",
                "bao nhieu nhan vien", "bao nhieu thanh vien", "company headcount", "headcount")) {
            return new PlanDecision(true, "getCompanyHeadcount", args, null);
        }

        if (containsAnyApprox(text, "ngay le la ngay nao", "ngay le nao", "cac ngay le", "danh sach ngay le",
                "holiday list", "public holiday")) {
            args.put("countryCode", "VN");
            return new PlanDecision(true, "getUpcomingPublicHolidays", args, null);
        }

        if (text.equals("ngay le") || text.equals("le tet") || text.equals("holiday")) {
            args.put("countryCode", "VN");
            return new PlanDecision(true, "getUpcomingPublicHolidays", args, null);
        }

        if (containsAny(text, "gio lam", "gio vao", "gio ra", "nghi trua", "ot rate", "tang ca",
                "chinh sach", "quy dinh", "config", "cau hinh", "ngay cong chuan",
                "nua ngay", "nua ngay sang", "nua ngay chieu", "half day",
                "bao nhieu cong", "tinh cong", "he so", "tham so",
                "ot ngay le", "chinh sach ngay le", "quy dinh ngay le")) {
            return new PlanDecision(true, "getCompanyPolicy", args, null);
        }

        if (containsAny(text, "don cho duyet", "cho duyet", "pending", "pending request", "waiting approval", "requests to approve")) {
            return new PlanDecision(true, "getPendingRequests", args, null);
        }

        if (containsAny(text, "thong ke team", "team", "di muon", "luong tb", "nhom toi", "team stats", "team summary")) {
            return new PlanDecision(true, "getTeamStats", args, null);
        }

        if (containsAny(text, "luong", "payroll", "thuc nhan", "gross", "net", "salary", "payslip")) {
            if (containsAny(text, "tinh luong the nao", "cach tinh luong", "cong thuc tinh luong",
                    "luong tinh nhu the nao", "salary formula", "how calculate salary")) {
                return null;
            }
            String targetKeyword = extractPayrollTargetKeyword(text);
            if (targetKeyword != null) {
                args.put("employeeKeyword", targetKeyword);
                return new PlanDecision(true, "getEmployeePayroll", args, null);
            }
            return new PlanDecision(true, "getMyPayroll", args, null);
        }

        if (isLikelyEmployeeKeywordOnly(text)
                && !looksLikePolicyQuestion(text)
                && !looksLikeAttendanceQuestion(text)
                && hasRecentPayrollIntent(request.getHistory())) {
            args.put("employeeKeyword", text);
            return new PlanDecision(true, "getEmployeePayroll", args, null);
        }

        if (containsAnyApprox(text, "cham cong", "ngay cong", "di muon", "check in", "check out", "attendance", "timesheet", "work hours")) {
            return new PlanDecision(true, "getMyAttendance", args, null);
        }

        if (containsAnyApprox(text, "nghi phep", "phep", "don nghi", "giai trinh", "leave", "apology", "leave request")) {
            if (containsAny(text, "nhu nao", "the nao", "lam sao", "ra sao", "huong dan", "cach", "how", "guide", "steps")) {
                return null;
            }
            return new PlanDecision(true, "getMyLeaveBalance", args, null);
        }

        if (isGenericFollowUp(text) && recentIntent != ChatIntent.UNKNOWN) {
            return switch (recentIntent) {
                case PAYROLL, EMPLOYEE_PAYROLL -> new PlanDecision(true, "getMyPayroll", args, null);
                case ATTENDANCE -> new PlanDecision(true, "getMyAttendance", args, null);
                case POLICY -> new PlanDecision(true, "getCompanyPolicy", args, null);
                case TEAM -> new PlanDecision(true, "getTeamStats", args, null);
                case LEAVE -> new PlanDecision(true, "getMyLeaveBalance", args, null);
                case PROJECT -> new PlanDecision(true, "getProjects", args, null);
                default -> null;
            };
        }

        if (containsAny(text, "co bao nhieu nguoi", "bao nhieu nguoi", "co bao nhieu thanh vien", "bao nhieu thanh vien", 
                        "co ai trong", "nhung ai lam", "co nhung ai", "nhung ai", "co ai", "co so", "so nguoi")) {
            String projKey = extractProjectKeywordWithMembers(text);
            if (projKey != null) {
                args.put("projectKeyword", projKey);
                if (containsAny(text, "co bao nhieu", "bao nhieu", "mấy", "co so", "so nguoi")) {
                    args.put("isCountQuery", true);
                }
                return new PlanDecision(true, "getProjectMembers", args, null);
            }
        }

        if (isContextualFollowUp(text, request.getHistory())) {
            return new PlanDecision(true, "getMySummary", args, null);
        }

        return null;
    }

    public PlanDecision fallbackDecision(User user, String userMessage, ChatRequestDto request) {
        PlanDecision forced = forcedToolDecision(userMessage, request);
        if (forced != null) {
            return forced;
        }

        String text = normalizeText(userMessage);
        ObjectNode args = baseArgs(request, userMessage);

        if (containsAny(text, "luong", "payroll", "thuc nhan", "gross", "net", "payslip")) {
            String targetKeyword = extractPayrollTargetKeyword(text);
            if (targetKeyword != null) {
                args.put("employeeKeyword", targetKeyword);
                return new PlanDecision(true, "getEmployeePayroll", args, null);
            }
            return new PlanDecision(true, "getMyPayroll", args, null);
        }
        
        boolean hasMemberKeywords = containsAnyApprox(text, "thanh vien", "nhan su", "ai lam", "ai trong", 
                                                      "project members", "doi ngu", "so nguoi", "co bao nhieu", "bao nhieu",
                                                      "co nhung ai", "nhung ai", "co ai");
        boolean hasProjectKeywords = containsAnyApprox(text, "du an", "projects", "danh sach du an", "project cua toi");
        
        if (hasMemberKeywords && hasProjectKeywords) {
            String projKey = extractProjectKeywordWithMembers(text);
            if (projKey != null) args.put("projectKeyword", projKey);
            return new PlanDecision(true, "getProjectMembers", args, null);
        }
        
        if (hasProjectKeywords) {
            String projKey = extractProjectKeyword(text);
            if (projKey != null) args.put("projectKeyword", projKey);
            return new PlanDecision(true, "getProjects", args, null);
        }
        
        if (hasMemberKeywords) {
            String projKey = extractProjectKeywordWithMembers(text);
            if (projKey != null) args.put("projectKeyword", projKey);
            return new PlanDecision(true, "getProjectMembers", args, null);
        }

        if (containsAnyApprox(text, "cham cong", "ngay cong", "di muon", "check in", "check out", "attendance", "work hours")) {
            return new PlanDecision(true, "getMyAttendance", args, null);
        }

        if (containsAnyApprox(text, "nghi phep", "phep", "don nghi", "giai trinh", "leave", "apology")) {
            return new PlanDecision(true, "getMyLeaveBalance", args, null);
        }

        String guide = tryHandleSystemGuide(userMessage, user.getRole().getName()); 
        if (guide != null) {
            return new PlanDecision(false, "none", args, guide);
        }

        if (isHrmRelated(text) || isContextualFollowUp(text, request.getHistory())) {
            return new PlanDecision(true, "getMySummary", args, null);
        }

        return new PlanDecision(false, "none", args, NON_HRM_FALLBACK);
    }

    public String tryHandleSimpleSanity(String message) {
        String text = normalizeText(message);
        if (text.equals("test") || text.equals("ping")) {
            return "Mình đang hoạt động bình thường.";
        }

        Matcher matcher = SIMPLE_MATH_PATTERN.matcher(text);
        if (!matcher.matches()) {
            return null;
        }

        long a = Long.parseLong(matcher.group(1));
        long b = Long.parseLong(matcher.group(3));
        String op = matcher.group(2);

        return switch (op) {
            case "+" -> String.valueOf(a + b);
            case "-" -> String.valueOf(a - b);
            case "*", "x" -> String.valueOf(a * b);
            case "/" -> b == 0 ? "Không thể chia cho 0." : String.valueOf((double) a / b);
            default -> null;
        };
    }

    public String tryHandleDateTime(String message) {
        String text = normalizeText(message);

        if (containsAny(text, "nay la ngay nao", "nay la ngay bao nhieu", "nay la ngay gi",
                             "hom nay la ngay nao", "hom nay la ngay gi", "hom nay ngay nao",
                             "ngay bao nhieu roi", "ngay may roi")) {
            LocalDateTime now = LocalDateTime.now();
            int dayOfWeek = now.getDayOfWeek().getValue();
            String thu = dayOfWeek == 7 ? "Chủ Nhật" : "Thứ " + (dayOfWeek + 1);
            return String.format("Hôm nay là %s, ngày %02d/%02d/%d. Bây giờ là %02d:%02d.",
                    thu, now.getDayOfMonth(), now.getMonthValue(), now.getYear(),
                    now.getHour(), now.getMinute());
        }

        if (containsAny(text, "thu may", "ngay may", "may gio", "bao nhieu", "la gi", "nhu nao") 
                && containsAny(text, "nay", "hom nay", "bay gio", "hien tai", "thoi gian", "ngay")) {
            if (containsAny(text, "thu may", "may gio", "ngay may", "ngay bao nhieu", "ngay gi")) {
                LocalDateTime now = LocalDateTime.now();
                int dayOfWeek = now.getDayOfWeek().getValue();
                String thu = switch (dayOfWeek) {
                    case 7 -> "Chủ Nhật";
                    default -> "Thứ " + (dayOfWeek + 1);
                };
                
                if (text.contains("may gio") || text.contains("gio hien tai")) {
                    return String.format("Bây giờ là %02d:%02d. Hôm nay là %s, ngày %02d/%02d/%d.",
                            now.getHour(), now.getMinute(), thu, now.getDayOfMonth(), now.getMonthValue(), now.getYear());
                }
                
                return String.format("Hôm nay là %s, ngày %02d/%02d/%d. Bây giờ là %02d:%02d.",
                        thu, now.getDayOfMonth(), now.getMonthValue(), now.getYear(), now.getHour(), now.getMinute());
            }
        }
        return null;
    }

    public String tryHandleLightweightSocial(String message) {
        String text = normalizeText(message);
        if (text.matches(".*\\b(xin chao|chao|hello|helo|hi|hey)\\b.*")) {
            return "Chào bạn. Mình có thể hỗ trợ lương, công, phép và chính sách HRM.";
        }
        if (text.matches(".*\\b(cam on|thank|thanks)\\b.*")) {
            return "Rất vui được hỗ trợ bạn.";
        }
        if (containsAny(text, "ban la ai", "may la ai", "em la ai", "bot la ai",
                             "you are", "who are you", "what are you")) {
            return "Mình là trợ lý HRM nội bộ. Mình hỗ trợ các vấn đề về lương, chấm công, nghỉ phép, OT và chính sách công ty.";
        }
        if (text.contains("dung") || text.contains("huong dan") || text.contains("hoi gi") || text.contains("how to use")) {
            return "Bạn có thể hỏi về lương, chấm công, nghỉ phép, OT hoặc chính sách công ty.";
        }
        return null;
    }

    public String tryHandleShortAck(String message, List<ChatRequestDto.HistoryMessage> history) {
        String text = normalizeText(message);

        // Bắt các tin nhắn cực ngắn (1-2 ký tự) hoặc chỉ gồm chữ đơn lẻ không có nghĩa
        if (text.length() <= 2 || text.matches("[a-z]{1,3}")) {
            ChatIntent intent = deriveRecentIntent(history);
            if (intent != ChatIntent.UNKNOWN) {
                return switch (intent) {
                    case PAYROLL, EMPLOYEE_PAYROLL -> "Bạn muốn xem lương tháng nào? Hoặc hỏi thêm về ai?";
                    case ATTENDANCE -> "Bạn muốn xem chấm công theo tháng nào?";
                    case POLICY -> "Bạn muốn biết thêm về mục nào trong chính sách?";
                    case TEAM -> "Bạn muốn xem thêm thống kê nào của team?";
                    case LEAVE -> "Bạn muốn xem số dư phép hay hướng dẫn tạo đơn?";
                    default -> "Bạn muốn mình hỗ trợ thêm gì không?";
                };
            }
            return "Bạn muốn hỏi thêm gì không?";
        }

        if (!containsAny(text, "ok", "oke", "uh", "uhm", "um", "vay a", "ro i", "duoc", "got it")) {
            return null;
        }

        ChatIntent intent = deriveRecentIntent(history);
        return switch (intent) {
            case PAYROLL, EMPLOYEE_PAYROLL -> "OK. Bạn muốn xem lương tháng nào hoặc so sánh với tháng trước?";
            case ATTENDANCE -> "OK. Bạn muốn xem chấm công theo tháng nào?";
            case POLICY -> "OK. Bạn muốn xem thêm mục nào trong chính sách công ty?";
            case TEAM -> "OK. Bạn muốn xem thêm thống kê nào của team?";
            case LEAVE -> "OK. Bạn muốn xem số dư phép hay hướng dẫn tạo đơn?";
            default -> "OK. Bạn muốn mình hỗ trợ gì tiếp theo trong hệ thống HRM?";
        };
    }

    public String tryHandleSystemGuide(String message, String role) {
        String text = normalizeText(message);

        if (containsAny(text, "he thong co gi", "co nhung chuc nang", "cac chuc nang", "module", "menu nao")) {
            return "Hệ thống HRM hỗ trợ: nhân viên, chấm công, giải trình, nghỉ phép, tăng ca, bảng lương (Excel/PDF), cấu hình, thông báo và chatbot nội bộ..";
        }

        if (containsAny(text, "phan quyen", "quyen", "role")) {
            return switch (role) {
                case "ADMIN" -> "Bạn đang là ADMIN: được quản lý user, cấu hình, nhân viên và theo dõi toàn bộ dữ liệu.";
                case "HR" -> "Bạn đang là HR: được quản lý nhân sự, tính lương, xuất báo cáo và xử lý nghiệp vụ HR.";
                case "MANAGER" -> "Bạn đang là MANAGER: được duyệt đơn của team và xem thống kê team theo phạm vi được giao.";
                case "EMPLOYEE" -> "Bạn đang là EMPLOYEE: xem dữ liệu cá nhân, gửi đơn nghỉ/giải trình/OT và theo dõi bảng lương của mình.";
                default -> "Bạn đang đăng nhập với quyền " + role + ".";
            };
        }

        if (containsAny(text, "import excel", "nhap excel", "template", "preview excel")) {
            return "Import Excel: tải template, điền dữ liệu theo mẫu, upload file xlsx và xác nhận preview trước khi ghi vào hệ thống.";
        }

        if (containsAny(text, "xuat excel", "xuat pdf", "phieu luong", "bao cao")) {
            return "Export: bạn có thể xuất danh sách nhân viên, bảng lương Excel và phiếu lương PDF cá nhân theo tháng.";
        }

        if (containsAny(text, "doi mat khau", "change password", "reset mat khau")) {
            return "Đổi mật khẩu: bấm avatar/header -> Đổi mật khẩu, nhập mật khẩu hiện tại và mật khẩu mới.";
        }

        if (containsAny(text, "tinh luong the nao", "cach tinh luong", "cong thuc tinh luong", "luong tinh nhu the nao")) {
            return "Lương được tính theo công thức cơ bản: lương thực tế + tiền OT + phụ cấp - bảo hiểm - thuế TNCN. Lương thực tế phụ thuộc ngày công, OT phụ thuộc số giờ tăng ca và hệ số OT trong cấu hình công ty.";
        }

        if (containsAnyApprox(text,
                "muc giam tru gia canh",
                "giam tru gia canh",
                "giam tru ban than",
                "muc giam tru ban than",
                "giam tru nguoi phu thuoc",
                "muc giam tru nguoi phu thuoc")) {
            return "Theo m\u1ee9c \u00e1p d\u1ee5ng t\u1eeb ng\u00e0y 01/01/2026, gi\u1ea3m tr\u1eeb gia c\u1ea3nh cho b\u1ea3n th\u00e2n l\u00e0 15,5 tri\u1ec7u \u0111\u1ed3ng/th\u00e1ng v\u00e0 cho m\u1ed7i ng\u01b0\u1eddi ph\u1ee5 thu\u1ed9c l\u00e0 6,2 tri\u1ec7u \u0111\u1ed3ng/th\u00e1ng.";
        }

        if (containsAny(text, "thong bao", "notification", "chuong")) {
            return "Thông báo hiển thị đơn chờ duyệt và kết quả duyệt/từ chối. Bạn có thể mở panel chuông trên header để xem nhanh.";
        }

        if (containsAny(text, "chatbot ho tro gi", "chatbot lam duoc gi", "tro ly ai la gi", "hoi gi duoc", "what can you do", "help", "features")) {
            return "Chatbot hỗ trợ hỏi về lương, chấm công, nghỉ phép, OT, chính sách và duyệt đơn theo quyền. Bạn có thể hỏi tự nhiên, không cần dùng mẫu cố định.";
        }

        if (containsAny(text, "giai trinh", "don giai trinh")
                && containsAny(text, "nhu nao", "the nao", "lam sao", "ra sao", "huong dan", "cach")) {
            return "Giải trình: vào menu Giải trình, chọn ngày chấm công cần giải trình, nhập lý do và gửi đơn. Manager/HR sẽ duyệt hoặc từ chối.";
        }

        if (containsAny(text, "xin nghi phep", "nghi phep", "don nghi")
                && containsAny(text, "nhu nao", "the nao", "lam sao", "ra sao", "huong dan", "cach")) {
            return "Xin nghỉ phép: vào menu Nghỉ phép, chọn loại nghỉ, ngày bắt đầu-kết thúc, nhập lý do rồi gửi đơn. Đơn sẽ chuyển đến cấp duyệt theo quyền.";
        }

        if (containsAny(text, "ngay le", "le tet", "holiday")
                && containsAny(text, "nhu nao", "the nao", "lam sao", "ra sao", "chinh sach", "quy dinh")) {
            return "Ngày lễ được quản lý trong module Ngày lễ. OT ngày lễ áp dụng hệ số otRateHoliday theo cấu hình công ty.";
        }

        return null;
    }

    public boolean shouldHardReject(String message, List<ChatRequestDto.HistoryMessage> history) {
        String text = normalizeText(message);
        InteractionMode mode = getInteractionMode();

        if (mode == InteractionMode.FRIENDLY) {
            return false;
        }

        if (mode == InteractionMode.STRICT) {
            if (isHrmRelated(text) || isContextualFollowUp(text, history)) return false;
            if (tryHandleSimpleSanity(text) != null) return false;
            if (tryHandleLightweightSocial(text) != null) return false;
            return true;
        }

        if (isHrmRelated(text) || isContextualFollowUp(text, history)) return false;
        if (tryHandleSimpleSanity(text) != null) return false;
        if (tryHandleLightweightSocial(text) != null) return false;
        if (tryHandleSystemGuide(text, "EMPLOYEE") != null) return false;
        return isClearlyOutOfScope(text);
    }

    private ObjectNode baseArgs(ChatRequestDto request, String userMessage) {
        ObjectNode args = objectMapper.createObjectNode();
        Integer month = request.getMonth();
        Integer year = request.getYear();

        YearMonth inferred = inferMonthYear(userMessage);
        if (month == null && inferred != null) {
            month = inferred.getMonthValue();
        }
        if (year == null && inferred != null) {
            year = inferred.getYear();
        }

        YearMonth inferredFromHistory = inferMonthYearFromHistory(request.getHistory());
        if (month == null && inferredFromHistory != null) {
            month = inferredFromHistory.getMonthValue();
        }
        if (year == null && inferredFromHistory != null) {
            year = inferredFromHistory.getYear();
        }

        if (month != null) args.put("month", month);
        if (year != null) args.put("year", year);
        return args;
    }

    private String summarizePayroll(Map<String, Object> data) {
        String employeeName = String.valueOf(data.getOrDefault("employeeName", "Nhan vien"));
        Object month = data.get("month");
        Object year = data.get("year");
        Object net = data.get("netSalary");
        Object gross = data.get("grossSalary");
        if (net == null && gross == null) {
            return String.valueOf(data.getOrDefault("message", "Hiện chưa có bảng lương cho kỳ này."));
        }
        return String.format(
                Locale.ROOT,
                "Lương tháng %s/%s của %s:%n- Tổng lương (Gross): %s%n- Thực nhận (Net): %s",
                month, year, employeeName, formatCurrency(gross), formatCurrency(net)
        );
    }

    private String summarizeAttendance(Map<String, Object> data) {
        return String.format(
                Locale.ROOT,
                "Chấm công tháng %s/%s:%n- Số bản ghi: %s%n- Đúng giờ: %s ngày%n- Đi muộn: %s ngày%n- Tổng giờ làm: %s",
                data.getOrDefault("month", "?"),
                data.getOrDefault("year", "?"),
                data.getOrDefault("records", 0),
                data.getOrDefault("onTimeDays", 0),
                data.getOrDefault("lateDays", 0),
                data.getOrDefault("totalWorkedHours", 0)
        );
    }

    private String summarizeLeave(Map<String, Object> data) {
        return String.format(
                Locale.ROOT,
                "Số dư phép năm %s:%n- Quota: %s ngày%n- Đã dùng: %s ngày%n- Còn lại: %s ngày",
                data.getOrDefault("year", LocalDateTime.now().getYear()),
                data.getOrDefault("annualLeaveQuota", 12),
                data.getOrDefault("usedAnnualLeaveDays", 0),
                data.getOrDefault("remainingAnnualLeaveDays", 0)
        );
    }

    private String summarizeTeam(Map<String, Object> data) {
        return String.format(
                Locale.ROOT,
                "Thống kê team tháng %s/%s:%n- Quy mô team: %s%n- Tổng ngày đi muộn: %s%n- Tổng giờ OT: %s",
                data.getOrDefault("month", "?"),
                data.getOrDefault("year", "?"),
                data.getOrDefault("teamSize", 0),
                data.getOrDefault("totalLateDays", 0),
                data.getOrDefault("totalOtHours", 0)
        );
    }

    private String summarizePending(Map<String, Object> data) {
        int leave = listSize(data.get("pendingLeaveRequests"));
        int apology = listSize(data.get("pendingApologyRequests"));
        int ot = listSize(data.get("pendingOtRequests"));
        return String.format(
                Locale.ROOT,
                "Đơn chờ duyệt hiện tại:%n- Nghỉ phép: %d%n- Giải trình: %d%n- OT: %d",
                leave, apology, ot
        );
    }

    private String summarizeProjects(Map<String, Object> data) {
        List<?> projects = (List<?>) data.get("projects");
        if (projects == null || projects.isEmpty()) {
            return String.valueOf(data.getOrDefault("message", "Không tìm thấy dự án nào."));
        }
        StringBuilder sb = new StringBuilder("Danh sách dự án của bạn (tối đa 15):\n");
        for (Object obj : projects) {
            Map<?, ?> p = (Map<?, ?>) obj;
            sb.append(String.format(Locale.ROOT, "- [%s] %s (Trạng thái: %s)%n",
                    p.get("code"), p.get("name"), p.get("status")));
        }
        return sb.toString().trim();
    }

    private String summarizeProjectMembers(Map<String, Object> data) {
        if (data.containsKey("projectSummaries")) {
            List<?> summaries = (List<?>) data.get("projectSummaries");
            if (summaries == null || summaries.isEmpty()) return "Không tìm thấy dự án nào.";
            StringBuilder sb = new StringBuilder("Thống kê nhân sự các dự án:\n");
            for (Object obj : summaries) {
                Map<?, ?> m = (Map<?, ?>) obj;
                sb.append(String.format("- [%s] %s: %s người (%s)%n", 
                    m.get("code"), m.get("name"), m.get("memberCount"), m.get("status")));
            }
            return sb.toString().trim();
        }

        List<?> members = (List<?>) data.get("members");
        Integer count = null;
        try {
            Object countObj = data.get("count");
            if (countObj instanceof Integer) {
                count = (Integer) countObj;
            } else if (countObj instanceof Number) {
                count = ((Number) countObj).intValue();
            }
        } catch (Exception ignored) {}

        if (members == null || members.isEmpty()) {
            return String.valueOf(data.getOrDefault("message", "Không tìm thấy thành viên."));
        }
        
        String projName = String.valueOf(data.get("projectName"));
        
        boolean isCountQuery = false;
        try {
            Object countQueryObj = data.get("isCountQuery");
            if (countQueryObj instanceof Boolean) {
                isCountQuery = (Boolean) countQueryObj;
            }
        } catch (Exception ignored) {}
        
        if (isCountQuery) {
            return String.format("Dự án %s có %d người.", projName, count != null ? count : 0);
        }
        
        if (count != null && count > 5) {
            return String.format("Dự án %s có %d người.", projName, count);
        }
        
        StringBuilder sb = new StringBuilder("Thành viên dự án ").append(projName).append(":\n");
        for (Object obj : members) {
            Map<?, ?> m = (Map<?, ?>) obj;
            sb.append(String.format(Locale.ROOT, "- %s (%s)%n",
                    m.get("employeeName"), m.get("role")));
        }
        return sb.toString().trim();
    }

    private int listSize(Object obj) {
        if (obj instanceof List<?> list) return list.size();
        return 0;
    }

    private String formatCurrency(Object value) {
        if (value == null) return "N/A";
        try {
            long amount = Long.parseLong(String.valueOf(value));
            return String.format(Locale.ROOT, "%,d VND", amount);
        } catch (Exception ignored) {
            return String.valueOf(value);
        }
    }

    private YearMonth inferMonthYear(String userMessage) {
        String text = normalizeText(userMessage);
        YearMonth now = YearMonth.now();

        if (text.contains("thang truoc")) {
            return now.minusMonths(1);
        }
        if (text.contains("thang nay")) {
            return now;
        }

        Matcher monthYearMatcher = Pattern.compile("thang\\s*(\\d{1,2})(?:\\s*(?:nam|/)\\s*(\\d{4}))?").matcher(text);
        if (monthYearMatcher.find()) {
            int month = Integer.parseInt(monthYearMatcher.group(1));
            if (month < 1 || month > 12) {
                return null;
            }
            int year = monthYearMatcher.group(2) != null ? Integer.parseInt(monthYearMatcher.group(2)) : now.getYear();
            return YearMonth.of(year, month);
        }

        return null;
    }

    private YearMonth inferMonthYearFromHistory(List<ChatRequestDto.HistoryMessage> history) {
        if (history == null || history.isEmpty()) {
            return null;
        }
        for (int i = history.size() - 1; i >= 0; i--) {
            ChatRequestDto.HistoryMessage h = history.get(i);
            if (h == null || h.getContent() == null || h.getContent().isBlank()) {
                continue;
            }
            YearMonth ym = inferMonthYear(h.getContent());
            if (ym != null) {
                return ym;
            }
        }
        return null;
    }

    private String extractPayrollTargetKeyword(String normalizedText) {
        if (normalizedText.contains("cua toi") || normalizedText.contains("luong toi")) {
            return null;
        }

        int index = normalizedText.indexOf("cua ");
        if (index < 0) {
            return null;
        }

        String candidate = normalizedText.substring(index + 4).trim();
        candidate = candidate.replaceAll("^(nhan vien|ban|anh|chi|em)\\s+", "").trim();
        candidate = candidate.replaceAll("^(ten\\s+la|la)\\s+", "").trim();
        candidate = candidate.replaceAll("^nhan vien\\s+ten\\s+la\\s+", "").trim();
        candidate = candidate.replaceAll("\\b(la\\s+bao\\s+nhieu|bao\\s+nhieu|la\\s+may|la\\s+gi|la\\s+ai)\\b.*$", "").trim();
        candidate = candidate.replaceAll("[^a-z0-9@._\\s]", " ").replaceAll("\\s+", " ").trim();
        if (candidate.isBlank() || "toi".equals(candidate)) {
            return null;
        }
        return candidate;
    }

    private boolean isLikelyEmployeeKeywordOnly(String text) {
        if (text == null || text.isBlank()) return false;
        if (isHrmRelated(text)) return false;
        if (looksLikePolicyQuestion(text) || looksLikeAttendanceQuestion(text)) return false;
        if (text.length() > 64) return false;
        if (!text.matches("[a-z0-9@._\\s]+")) return false;
        // Yêu cầu có ít nhất 1 token có nghĩa (dài >= 3 ký tự) để tránh false-positive với 'a', 'ok', etc.
        boolean hasSubstantiveToken = Arrays.stream(text.split("\\s+"))
                .anyMatch(token -> token.length() >= 3);
        if (!hasSubstantiveToken) return false;
        if (containsAny(text, "bao nhieu", "la gi", "the nao", "nhu nao", "sao", "ra sao", "lam sao",
                "tinh", "cong", "ot", "nua ngay", "gio lam", "ngay le", "giai trinh", "nghi phep",
                "ban la ai", "may la ai", "la ai", "em la ai",
                "nay la", "hom nay", "bay gio",
                "ngay nao", "ngay gi", "ngay may", "ngay bao nhieu",
                "thu may", "may gio", "bao gio")) {
            return false;
        }
        return true;
    }

    private boolean hasRecentPayrollIntent(List<ChatRequestDto.HistoryMessage> history) {
        if (history == null || history.isEmpty()) return false;
        int start = Math.max(0, history.size() - 6);
        for (ChatRequestDto.HistoryMessage h : history.subList(start, history.size())) {
            if (h == null || h.getContent() == null) continue;
            String content = normalizeText(h.getContent());
            if (containsAny(content, "luong", "payroll", "thuc nhan", "gross", "net", "khong tim thay nhan vien")) {
                return true;
            }
        }
        return false;
    }

    private ChatIntent deriveRecentIntent(List<ChatRequestDto.HistoryMessage> history) {
        if (history == null || history.isEmpty()) return ChatIntent.UNKNOWN;
        int start = Math.max(0, history.size() - 8);
        for (int i = history.size() - 1; i >= start; i--) {
            ChatRequestDto.HistoryMessage h = history.get(i);
            if (h == null || h.getContent() == null) continue;
            String content = normalizeText(h.getContent());
            if (containsAny(content, "salary", "payroll", "luong", "gross", "net", "payslip")) return ChatIntent.PAYROLL;
            if (containsAny(content, "attendance", "cham cong", "check in", "check out", "timesheet")) return ChatIntent.ATTENDANCE;
            if (containsAny(content, "policy", "chinh sach", "config", "ot rate", "ngay le", "holiday")) return ChatIntent.POLICY;
            if (containsAny(content, "team stats", "thong ke team", "pending request", "don cho duyet")) return ChatIntent.TEAM;
            if (containsAny(content, "leave", "nghi phep", "giai trinh", "apology")) return ChatIntent.LEAVE;
        }
        return ChatIntent.UNKNOWN;
    }

    private boolean isGenericFollowUp(String text) {
        return containsAny(text, "con", "con thi", "vay", "the con", "thang truoc thi sao", "thang nay thi sao",
                "how about", "what about", "and", "then", "ok con", "tiep");
    }

    private boolean looksLikePolicyQuestion(String text) {
        return containsAny(text, "nua ngay", "half day", "tham so", "he so", "bao nhieu cong", "tinh cong",
                "gio lam", "nghi trua", "ot rate", "chinh sach", "cau hinh", "policy", "holiday");
    }

    private boolean looksLikeAttendanceQuestion(String text) {
        return containsAny(text, "cham cong", "check in", "check out", "di muon", "ngay cong", "cong", "attendance", "timesheet");
    }

    private String extractProjectKeyword(String text) {
        Pattern p = Pattern.compile("\\[([a-zA-Z0-9_-]+)\\]");
        Matcher m = p.matcher(text);
        if (m.find()) return m.group(1);
        
        Pattern codePattern = Pattern.compile("\\b([A-Z]+(?:_[A-Z0-9]+)*)\\b");
        Matcher codeMatcher = codePattern.matcher(text);
        String bestCode = null;
        while (codeMatcher.find()) {
            String code = codeMatcher.group(1);
            if (!isStopWord(code)) {
                if (bestCode == null || code.contains("_") || 
                    (code.length() > bestCode.length() && !bestCode.contains("_"))) {
                    bestCode = code;
                }
            }
        }
        if (bestCode != null) {
            return bestCode;
        }

        String cleaned = removeProjectQuestionPhrases(text);
        cleaned = cleaned.replaceAll("(?i)^(du\\s+an|project)\\s+", "").trim();
        
        if (cleaned.isEmpty()) return null;
        
        return cleaned;
    }

    private String extractProjectKeywordWithMembers(String text) {
        Pattern pBracket = Pattern.compile("\\[([a-zA-Z0-9_-]+)\\]");
        Matcher mBracket = pBracket.matcher(text);
        if (mBracket.find()) return mBracket.group(1);
        
        Pattern codePattern = Pattern.compile("\\b([A-Z]+(?:_[A-Z0-9]+)*)\\b");
        Matcher codeMatcher = codePattern.matcher(text);
        String bestCode = null;
        while (codeMatcher.find()) {
            String code = codeMatcher.group(1);
            if (!isStopWord(code)) {
                if (bestCode == null || code.contains("_") || 
                    (code.length() > bestCode.length() && !bestCode.contains("_"))) {
                    bestCode = code;
                }
            }
        }
        if (bestCode != null) {
            return bestCode;
        }

        String cleaned = removeProjectQuestionPhrases(text);
        cleaned = cleaned.replaceAll("(?i)^(du\\s+an|project)\\s+", "").trim();
        
        if (cleaned.isEmpty()) return null;
        
        return cleaned;
    }
    
    private String removeProjectQuestionPhrases(String text) {
        return text
                .replaceAll("(?i)\\s+co\\s+bao\\s+nhieu\\s+nguoi(\\s|$)", " ")
                .replaceAll("(?i)\\s+bao\\s+nhieu\\s+nguoi(\\s|$)", " ")
                .replaceAll("(?i)\\s+co\\s+bao\\s+nhieu\\s+thanh\\s+vien(\\s|$)", " ")
                .replaceAll("(?i)\\s+bao\\s+nhieu\\s+thanh\\s+vien(\\s|$)", " ")
                .replaceAll("(?i)\\s+thanh\\s+vien(\\s+trong(\\s+du\\s+an)?)?", " ")
                .replaceAll("(?i)\\s+nhan\\s+su(\\s+trong(\\s+du\\s+an)?)?", " ")
                .replaceAll("(?i)\\s+ai\\s+lam(\\s+trong(\\s+du\\s+an)?)?", " ")
                .replaceAll("(?i)\\s+co\\s+nhung\\s+ai(\\s+trong)?", " ")
                .replaceAll("(?i)\\s+nhung\\s+ai(\\s+trong)?", " ")
                .replaceAll("(?i)\\s+co\\s+ai(\\s+trong)?", " ")
                .replaceAll("(?i)\\s+doi\\s+ngu", " ")
                .replaceAll("(?i)\\s+project\\s+members?", " ")
                .replaceAll("(?i)\\s+nguoi(\\s|$)", " ")
                .replaceAll("(?i)\\s+ai(\\s|$)", " ")
                .trim();
    }
    
    private boolean isStopWord(String token) {
        if (token == null || token.isEmpty()) return true;
        String lower = token.toLowerCase(Locale.ROOT).trim();
        return switch (lower) {
            case "co", "la", "cua", "trong", "hien", "tai", "toi", "minh", "ban", "anh", 
                 "chi", "em", "so", "nay", "vua", "roi", "do", "cho", "hoi", "biet", 
                 "gia", "dinh", "nhom", "du", "an", "project", "nguoi", "thanh", "vien", 
                 "nhan", "su", "nao", "gi", "nhung", "may", "lam", "ai", 
                 "bao", "nhieu", "sao" -> true;
            default -> false;
        };
    }

    private InteractionMode getInteractionMode() {
        if (interactionModeRaw == null || interactionModeRaw.isBlank()) {
            return InteractionMode.BALANCED;
        }
        try {
            return InteractionMode.valueOf(interactionModeRaw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return InteractionMode.BALANCED;
        }
    }

    private boolean isClearlyOutOfScope(String text) {
        return containsAny(text,
                "soi cau", "keo bong", "chung khoan hom nay", "du doan tran dau",
                "crypto signal", "tai xiu", "game skin", "loto", "xoso");
    }

    private boolean isHrmRelated(String text) {
        String[] keywords = {
                "luong", "thuong", "phu cap", "bao hiem", "thue", "tncn",
                "giam tru gia canh", "giam tru ban than", "nguoi phu thuoc",
                "cham cong", "ngay cong", "gio lam", "ot", "tang ca",
                "nghi phep", "xin nghi", "giai trinh", "chinh sach", "quy dinh",
                "duyet don", "tu choi don", "payroll", "attendance", "leave",
                "apology", "config", "company", "cau hinh", "cong ty",
                "ngay le", "le tet", "holiday",
                "phan quyen", "role", "permission", "dashboard", "menu", "module",
                "import", "export", "excel", "pdf", "template", "preview",
                "thong bao", "notification", "doi mat khau", "user management", "quan ly user",
                "chatbot", "tro ly ai", "salary", "payslip", "timesheet", "policy", "approval", "overtime", "leave request",
                "du an", "project", "thanh vien du an", "thanh vien project", "vai tro du an"
        };
        return containsAnyApprox(text, keywords);
    }

    private boolean isContextualFollowUp(String text, List<ChatRequestDto.HistoryMessage> history) {
        String[] followUpHints = {"so voi", "thang truoc", "chi tiet hon", "tiep", "giai thich them", "con lai", "how about", "what about", "compare", "then"};
        boolean hasHint = false;
        for (String hint : followUpHints) {
            if (text.contains(hint)) {
                hasHint = true;
                break;
            }
        }
        if (!hasHint) return false;
        if (history == null || history.isEmpty()) return false;

        int start = Math.max(0, history.size() - 6);
        for (ChatRequestDto.HistoryMessage h : history.subList(start, history.size())) {
            if (h != null && h.getContent() != null && isHrmRelated(normalizeText(h.getContent()))) {
                return true;
            }
        }
        return false;
    }

    private String normalizeText(String input) {
        if (input == null) return "";
        String lowered = input.trim().toLowerCase(Locale.ROOT);
        String normalized = Normalizer.normalize(lowered, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return normalized.replace("\u0111", "d");
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean containsAnyApprox(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword) || containsApproxPhrase(text, keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean containsApproxPhrase(String text, String phrase) {
        String[] textTokens = tokenizeNormalized(text);
        String[] phraseTokens = tokenizeNormalized(phrase);
        if (textTokens.length == 0 || phraseTokens.length == 0 || phraseTokens.length > textTokens.length) {
            return false;
        }

        for (int start = 0; start <= textTokens.length - phraseTokens.length; start++) {
            boolean matched = true;
            for (int offset = 0; offset < phraseTokens.length; offset++) {
                if (!roughlyMatchesToken(textTokens[start + offset], phraseTokens[offset])) {
                    matched = false;
                    break;
                }
            }
            if (matched) {
                return true;
            }
        }
        return false;
    }

    private String[] tokenizeNormalized(String text) {
        return Arrays.stream(text.split("[^a-z0-9]+"))
                .filter(token -> !token.isBlank())
                .toArray(String[]::new);
    }

    private boolean roughlyMatchesToken(String actual, String expected) {
        if (actual.equals(expected)) {
            return true;
        }
        if (actual.length() <= 2 || expected.length() <= 2) {
            return false;
        }
        if (Math.abs(actual.length() - expected.length()) > 1) {
            return false;
        }
        return isOneEditAway(actual, expected) || isSingleAdjacentTranspose(actual, expected);
    }

    private boolean isSingleAdjacentTranspose(String left, String right) {
        if (left.length() != right.length()) {
            return false;
        }
        int firstDiff = -1;
        int secondDiff = -1;
        for (int i = 0; i < left.length(); i++) {
            if (left.charAt(i) != right.charAt(i)) {
                if (firstDiff == -1) {
                    firstDiff = i;
                } else if (secondDiff == -1) {
                    secondDiff = i;
                } else {
                    return false;
                }
            }
        }
        return firstDiff != -1
                && secondDiff == firstDiff + 1
                && left.charAt(firstDiff) == right.charAt(secondDiff)
                && left.charAt(secondDiff) == right.charAt(firstDiff);
    }

    private boolean isOneEditAway(String left, String right) {
        int leftLen = left.length();
        int rightLen = right.length();
        if (Math.abs(leftLen - rightLen) > 1) {
            return false;
        }

        String shorter = leftLen <= rightLen ? left : right;
        String longer = leftLen <= rightLen ? right : left;
        int i = 0;
        int j = 0;
        int edits = 0;

        while (i < shorter.length() && j < longer.length()) {
            if (shorter.charAt(i) == longer.charAt(j)) {
                i++;
                j++;
                continue;
            }
            edits++;
            if (edits > 1) {
                return false;
            }
            if (shorter.length() == longer.length()) {
                i++;
            }
            j++;
        }

        if (j < longer.length() || i < shorter.length()) {
            edits++;
        }
        return edits <= 1;
    }

    private UUID extractUuid(String text) {
        try {
            Matcher matcher = Pattern.compile("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}").matcher(text);
            if (matcher.find()) {
                return UUID.fromString(matcher.group());
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private enum ChatIntent {
        PAYROLL,
        EMPLOYEE_PAYROLL,
        ATTENDANCE,
        LEAVE,
        TEAM,
        POLICY,
        PROJECT,
        UNKNOWN
    }

    private enum InteractionMode {
        STRICT,
        BALANCED,
        FRIENDLY
    }
}
