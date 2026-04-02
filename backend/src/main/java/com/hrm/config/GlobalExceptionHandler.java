package com.hrm.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * D29: Handle BadCredentialsException - wrong username or password
     * Status: 401 (Unauthorized)
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(
            BadCredentialsException ex,
            WebRequest request) {
        log.warn("BadCredentialsException: {}", ex.getMessage());
        
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Unauthorized");
        body.put("message", "Email hoặc mật khẩu không chính xác");
        body.put("status", HttpStatus.UNAUTHORIZED.value());
        
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }

    /**
     * D29: Handle InternalAuthenticationServiceException - user not found
     * Status: 401 (Unauthorized)
     */
    @ExceptionHandler(InternalAuthenticationServiceException.class)
    public ResponseEntity<Map<String, Object>> handleInternalAuthenticationService(
            InternalAuthenticationServiceException ex,
            WebRequest request) {
        log.warn("InternalAuthenticationServiceException: {}", ex.getMessage());
        
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Unauthorized");
        body.put("message", "Email hoặc mật khẩu không chính xác");
        body.put("status", HttpStatus.UNAUTHORIZED.value());
        
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }

    /**
     * D29: Handle general AuthenticationException
     * Status: 401 (Unauthorized)
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(
            AuthenticationException ex,
            WebRequest request) {
        log.warn("AuthenticationException: {}", ex.getMessage());
        
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Unauthorized");
        body.put("message", "Email hoặc mật khẩu không chính xác");
        body.put("status", HttpStatus.UNAUTHORIZED.value());
        
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }

    /**
     * D29: Handle validation errors - invalid JSON structure or missing required fields
     * Status: 400 (Bad Request)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        log.warn("MethodArgumentNotValidException: {}", ex.getMessage());
        
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Bad Request");
        body.put("message", "Dữ liệu xác thực không hợp lệ");
        body.put("status", HttpStatus.BAD_REQUEST.value());
        
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    /**
     * D29: Handle AccessDeniedException - insufficient permissions
     * Status: 403 (Forbidden)
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(
            AccessDeniedException ex) {
        log.warn("AccessDeniedException: {}", ex.getMessage());

        Map<String, Object> body = new HashMap<>();
        body.put("error", "Forbidden");
        body.put("message", ex.getMessage() != null ? ex.getMessage() : "Bạn không có quyền thực hiện chức năng này.");
        body.put("status", HttpStatus.FORBIDDEN.value());

        return new ResponseEntity<>(body, HttpStatus.FORBIDDEN);
    }
    /**
     * D29: Handle general RuntimeException
     * Status: 500 (Internal Server Error)
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(
            RuntimeException ex) {
        log.error("RuntimeException: {}", ex.getMessage(), ex);
        
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Internal Server Error");
        body.put("message", ex.getMessage() != null ? ex.getMessage() : "Lỗi máy chủ nội bộ");
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * D29: Handle general Exception
     * Status: 500 (Internal Server Error)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobalException(
            Exception ex) {
        log.error("Unexpected Exception: {}", ex.getMessage(), ex);
        
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Internal Server Error");
        body.put("message", "Lỗi máy chủ nội bộ");
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
