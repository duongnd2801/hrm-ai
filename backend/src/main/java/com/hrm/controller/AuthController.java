package com.hrm.controller;

import com.hrm.config.CookieUtil;
import com.hrm.dto.AuthRequest;
import com.hrm.dto.AuthResponse;
import com.hrm.dto.ChangePasswordRequest;
import com.hrm.dto.ChangePasswordResponse;
import com.hrm.dto.RefreshTokenRequest;
import com.hrm.entity.Employee;
import com.hrm.repository.EmployeeRepository;
import com.hrm.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Đăng nhập, làm mới token, quản lý session")
public class AuthController {

    private final AuthService authService;
    private final EmployeeRepository employeeRepository;
    private final com.hrm.service.JwtBlacklistService jwtBlacklistService;
    private final com.hrm.service.RateLimitService rateLimitService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập", description = "Trả về JWT token qua HttpOnly cookie + session metadata trong body")
    public ResponseEntity<Map<String, Object>> login(
            @Valid @RequestBody AuthRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse response) {

        String ipAddress = servletRequest.getRemoteAddr();
        String key = ipAddress + ":" + request.getEmail();

        try {
            String deviceId = CookieUtil.extractCookie(servletRequest.getCookies(), CookieUtil.DEVICE_COOKIE);
            if (deviceId == null || deviceId.isBlank()) {
                deviceId = java.util.UUID.randomUUID().toString();
            }

            String userAgent = servletRequest.getHeader("User-Agent");

            AuthResponse authResponse = authService.login(request, deviceId, userAgent, ipAddress);

            // Record success
            rateLimitService.recordSuccess(key);

            // Set HttpOnly cookies
            CookieUtil.setAuthCookies(response, authResponse.getToken(), authResponse.getRefreshToken());
            CookieUtil.setDeviceCookie(response, deviceId);

            // Return only non-sensitive metadata in response body
            Map<String, Object> body = new HashMap<>();
            body.put("email", authResponse.getEmail());
            body.put("role", authResponse.getRole());
            body.put("employeeId", authResponse.getEmployeeId());
            body.put("profileCompleted", authResponse.isProfileCompleted());
            body.put("permissions", authResponse.getPermissions());
            body.put("message", "Đăng nhập thành công");

            return ResponseEntity.ok(body);
        } catch (org.springframework.security.core.AuthenticationException e) {
            rateLimitService.recordFailure(key);
            throw e; // Rethrow to let global handler handle it (or handle it here)
        } catch (Exception e) {
            rateLimitService.recordFailure(key);
            throw e;
        }
    }

    @PostMapping("/refresh")
    @Operation(summary = "Làm mới access token", description = "Đọc refresh token từ cookie, cấp lại access token mới")
    public ResponseEntity<Map<String, Object>> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {

        // Read refresh token from HttpOnly cookie
        String refreshToken = CookieUtil.extractCookie(request.getCookies(), CookieUtil.REFRESH_COOKIE);
        String deviceId = CookieUtil.extractCookie(request.getCookies(), CookieUtil.DEVICE_COOKIE);

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "Unauthorized",
                    "message", "Refresh token không tồn tại"
            ));
        }

        try {
            RefreshTokenRequest refreshRequest = new RefreshTokenRequest();
            refreshRequest.setRefreshToken(refreshToken);
            AuthResponse authResponse = authService.refresh(refreshRequest, deviceId);

            // Set new HttpOnly cookies
            CookieUtil.setAuthCookies(response, authResponse.getToken(), authResponse.getRefreshToken());

            Map<String, Object> body = new HashMap<>();
            body.put("email", authResponse.getEmail());
            body.put("role", authResponse.getRole());
            body.put("employeeId", authResponse.getEmployeeId());
            body.put("profileCompleted", authResponse.isProfileCompleted());
            body.put("permissions", authResponse.getPermissions());

            return ResponseEntity.ok(body);
        } catch (Exception e) {
            CookieUtil.clearAuthCookies(response);
            return ResponseEntity.status(401).body(Map.of(
                    "error", "Unauthorized",
                    "message", e.getMessage() != null ? e.getMessage() : "Refresh token không hợp lệ hoặc đã hết hạn"
            ));
        }
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy thông tin session", description = "Trả về email, role, employeeId từ cookie token")
    public ResponseEntity<Map<String, Object>> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "Unauthorized",
                    "message", "Chưa đăng nhập"
            ));
        }

        String email = auth.getName();
        java.util.Set<String> roleAuthorities = java.util.Set.of(
                "ROLE_ADMIN",
                "ROLE_HR",
                "ROLE_MANAGER",
                "ROLE_EMPLOYEE"
        );

        String role = auth.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .filter(roleAuthorities::contains)
                .findFirst()
                .map(a -> a.replace("ROLE_", ""))
                .orElse("EMPLOYEE");

        java.util.List<String> permissionsList = auth.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .filter(a -> !roleAuthorities.contains(a))
                .collect(java.util.stream.Collectors.toList());

        Employee employee = employeeRepository.findByEmail(email).orElse(null);

        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        body.put("role", role);
        body.put("employeeId", employee != null ? employee.getId() : null);
        body.put("profileCompleted", employee == null || isProfileCompleted(employee));
        body.put("permissions", permissionsList);

        return ResponseEntity.ok(body);
    }


    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đăng xuất", description = "Xóa cookie và đưa access token vào blacklist, kèm thu hồi session device")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request, HttpServletResponse response) {
        String token = CookieUtil.extractCookie(request.getCookies(), CookieUtil.ACCESS_COOKIE);
        if (token != null && !token.isBlank()) {
            jwtBlacklistService.blacklistToken(token);
        }

        String deviceId = CookieUtil.extractCookie(request.getCookies(), CookieUtil.DEVICE_COOKIE);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (deviceId != null && auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String email = auth.getName();
            authService.removeDeviceSession(email, deviceId);
        }

        CookieUtil.clearAuthCookies(response);
        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công"));
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đổi mật khẩu", description = "Cho phép user authenticated đổi mật khẩu của mình")
    public ResponseEntity<ChangePasswordResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(authService.changePassword(request));
    }

    @GetMapping("/sessions")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy danh sách phiên đăng nhập", description = "Danh sách các thiết bị đang đăng nhập")
    public ResponseEntity<java.util.List<com.hrm.dto.DeviceSession>> getSessions() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return ResponseEntity.ok(authService.getActiveSessions(email));
    }

    @DeleteMapping("/sessions/{deviceId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đăng xuất thiết bị khác", description = "Thu hồi session của một thiết bị cụ thể")
    public ResponseEntity<Map<String, String>> revokeSession(@PathVariable String deviceId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        authService.removeDeviceSession(email, deviceId);
        return ResponseEntity.ok(Map.of("message", "Đã thu hồi phiên làm việc"));
    }

    private boolean isProfileCompleted(Employee employee) {
        return employee.getPhone() != null && !employee.getPhone().isBlank()
                && employee.getAddress() != null && !employee.getAddress().isBlank()
                && employee.getBirthDate() != null;
    }
}
