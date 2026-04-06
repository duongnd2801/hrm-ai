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

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập", description = "Trả về JWT token qua HttpOnly cookie + session metadata trong body")
    public ResponseEntity<Map<String, Object>> login(
            @Valid @RequestBody AuthRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.login(request);

        // Set HttpOnly cookies — JS cannot access these
        CookieUtil.setAuthCookies(response, authResponse.getToken(), authResponse.getRefreshToken());

        // Return only non-sensitive metadata in response body
        Map<String, Object> body = new HashMap<>();
        body.put("email", authResponse.getEmail());
        body.put("role", authResponse.getRole());
        body.put("employeeId", authResponse.getEmployeeId());
        body.put("profileCompleted", authResponse.isProfileCompleted());
        body.put("message", "Đăng nhập thành công");

        return ResponseEntity.ok(body);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Làm mới access token", description = "Đọc refresh token từ cookie, cấp lại access token mới")
    public ResponseEntity<Map<String, Object>> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {

        // Read refresh token from HttpOnly cookie
        String refreshToken = CookieUtil.extractCookie(request.getCookies(), CookieUtil.REFRESH_COOKIE);

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "Unauthorized",
                    "message", "Refresh token không tồn tại"
            ));
        }

        try {
            RefreshTokenRequest refreshRequest = new RefreshTokenRequest();
            refreshRequest.setRefreshToken(refreshToken);
            AuthResponse authResponse = authService.refresh(refreshRequest);

            // Set new HttpOnly cookies
            CookieUtil.setAuthCookies(response, authResponse.getToken(), authResponse.getRefreshToken());

            Map<String, Object> body = new HashMap<>();
            body.put("email", authResponse.getEmail());
            body.put("role", authResponse.getRole());
            body.put("employeeId", authResponse.getEmployeeId());
            body.put("profileCompleted", authResponse.isProfileCompleted());

            return ResponseEntity.ok(body);
        } catch (Exception e) {
            CookieUtil.clearAuthCookies(response);
            return ResponseEntity.status(401).body(Map.of(
                    "error", "Unauthorized",
                    "message", "Refresh token không hợp lệ hoặc đã hết hạn"
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
        String role = auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("EMPLOYEE");

        Employee employee = employeeRepository.findAll().stream()
                .filter(e -> email.equals(e.getEmail()))
                .findFirst()
                .orElse(null);

        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        body.put("role", role);
        body.put("employeeId", employee != null ? employee.getId() : null);
        body.put("profileCompleted", employee == null || isProfileCompleted(employee));

        return ResponseEntity.ok(body);
    }


    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đổi mật khẩu", description = "Cho phép user authenticated đổi mật khẩu của mình")
    public ResponseEntity<ChangePasswordResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(authService.changePassword(request));
    }

    private boolean isProfileCompleted(Employee employee) {
        return employee.getPhone() != null && !employee.getPhone().isBlank()
                && employee.getAddress() != null && !employee.getAddress().isBlank()
                && employee.getBirthDate() != null;
    }
}
