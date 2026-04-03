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

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return buildAuthResponse(user);
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        if (!jwtTokenProvider.isValidRefreshToken(refreshToken)) {
            throw new RuntimeException("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        String email = jwtTokenProvider.getEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return buildAuthResponse(user);
    }

    private boolean isProfileCompleted(Employee employee) {
        return employee.getPhone() != null && !employee.getPhone().isBlank()
                && employee.getAddress() != null && !employee.getAddress().isBlank()
                && employee.getBirthDate() != null;
    }

    public ChangePasswordResponse changePassword(ChangePasswordRequest request) {
        // Get current authenticated user email
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        // Find user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác");
        }

        // Check if new password and confirm password match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }

        // Check if new password is the same as current password
        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new RuntimeException("Mật khẩu mới phải khác mật khẩu hiện tại");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return new ChangePasswordResponse("Password changed successfully", true);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail(), user.getRole().name());
        Employee employee = employeeRepository.findByUserId(user.getId()).orElse(null);
        boolean profileCompleted = employee == null || isProfileCompleted(employee);

        return new AuthResponse(
                accessToken,
                refreshToken,
                user.getEmail(),
                user.getRole().name(),
                employee != null ? employee.getId() : null,
                profileCompleted
        );
    }
}
