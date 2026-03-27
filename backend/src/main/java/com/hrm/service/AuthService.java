package com.hrm.service;

import com.hrm.dto.AuthRequest;
import com.hrm.dto.AuthResponse;
import com.hrm.entity.Employee;
import com.hrm.entity.User;
import com.hrm.repository.EmployeeRepository;
import com.hrm.repository.UserRepository;
import com.hrm.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtTokenProvider.generate(user.getEmail(), user.getRole().name());
        Employee employee = employeeRepository.findByUserId(user.getId()).orElse(null);
        boolean profileCompleted = employee == null || isProfileCompleted(employee);
        return new AuthResponse(
                token,
                user.getEmail(),
                user.getRole().name(),
                employee != null ? employee.getId() : null,
                profileCompleted
        );
    }

    private boolean isProfileCompleted(Employee employee) {
        return employee.getPhone() != null && !employee.getPhone().isBlank()
                && employee.getAddress() != null && !employee.getAddress().isBlank()
                && employee.getBirthDate() != null;
    }
}
