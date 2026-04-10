package com.hrm.service;

import com.hrm.dto.AuthRequest;
import com.hrm.dto.AuthResponse;
import com.hrm.dto.ChangePasswordRequest;
import com.hrm.dto.ChangePasswordResponse;
import com.hrm.dto.RefreshTokenRequest;
import com.hrm.entity.Employee;
import com.hrm.entity.User;
import com.hrm.repository.EmployeeRepository;
import com.hrm.repository.UserRepository;
import com.hrm.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.hrm.service.JwtSessionService jwtSessionService;

    public AuthResponse login(AuthRequest request, String deviceId, String userAgent, String ipAddress) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return buildAuthResponseAndSession(user, deviceId, userAgent, ipAddress);
    }

    public AuthResponse refresh(RefreshTokenRequest request, String deviceId) {
        String refreshToken = request.getRefreshToken();
        if (!jwtTokenProvider.isValidRefreshToken(refreshToken)) {
            throw new org.springframework.security.authentication.BadCredentialsException("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        String email = jwtTokenProvider.getEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate session device ID mapping in Redis
        if (deviceId != null && !jwtSessionService.validateRefreshToken(user.getId(), deviceId, refreshToken)) {
            throw new org.springframework.security.authentication.BadCredentialsException("Refresh token không tồn tại cho thiết bị này hoặc đã bị thu hồi");
        }

        // Generate new tokens (rotating refresh token is a best practice)
        return buildAuthResponseAndSession(user, deviceId, "Unknown/Rotated", "Unknown/Rotated");
    }

    public void removeDeviceSession(String email, String deviceId) {
        userRepository.findByEmail(email).ifPresent(user -> {
            jwtSessionService.revokeSession(user.getId(), deviceId);
        });
    }

    public java.util.List<com.hrm.dto.DeviceSession> getActiveSessions(String email) {
        return userRepository.findByEmail(email)
                .map(user -> jwtSessionService.getActiveSessions(user.getId()))
                .orElse(java.util.Collections.emptyList());
    }

    public void removeSession(String email, String targetDeviceId) {
        userRepository.findByEmail(email).ifPresent(user -> {
            jwtSessionService.revokeSession(user.getId(), targetDeviceId);
        });
    }

    private boolean isProfileCompleted(Employee employee) {
        return employee.getPhone() != null && !employee.getPhone().isBlank()
                && employee.getAddress() != null && !employee.getAddress().isBlank()
                && employee.getBirthDate() != null;
    }

    public ChangePasswordResponse changePassword(ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }
        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new RuntimeException("Mật khẩu mới phải khác mật khẩu hiện tại");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return new ChangePasswordResponse("Password changed successfully", true);
    }

    private AuthResponse buildAuthResponseAndSession(User user, String deviceId, String userAgent, String ipAddress) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getEmail(), user.getRole().getName());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail(), user.getRole().getName());
        
        if (deviceId != null) {
            com.hrm.dto.DeviceSession session = com.hrm.dto.DeviceSession.builder()
                .deviceId(deviceId)
                .userAgent(userAgent)
                .ipAddress(ipAddress)
                .refreshToken(refreshToken)
                .loginAt(java.time.LocalDateTime.now())
                .build();
            
            // Assuming refresh expiration is 7 days (defined in JwtTokenProvider but we can get it from application.yml)
            java.time.Duration ttl = java.time.Duration.ofDays(7); 
            jwtSessionService.createSession(user.getId(), session, ttl);
        }

        Employee employee = employeeRepository.findByUserId(user.getId()).orElse(null);
        boolean profileCompleted = employee == null || isProfileCompleted(employee);

        java.util.List<String> permissions = user.getRole().getPermissions().stream()
                .map(com.hrm.entity.Permission::getCode)
                .collect(java.util.stream.Collectors.toList());

        return new AuthResponse(
                accessToken,
                refreshToken,
                user.getEmail(),
                user.getRole().getName(),
                employee != null ? employee.getId() : null,
                profileCompleted,
                permissions
        );
    }
}
