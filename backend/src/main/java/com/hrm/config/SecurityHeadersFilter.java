package com.hrm.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Security Headers Filter — defence-in-depth HTTP response headers.
 * <ul>
 *   <li>X-Content-Type-Options — prevent MIME-sniffing</li>
 *   <li>X-Frame-Options — prevent click-jacking</li>
 *   <li>X-XSS-Protection — legacy XSS filter hint</li>
 *   <li>Referrer-Policy — limit referrer leakage</li>
 *   <li>Permissions-Policy — restrict browser features</li>
 *   <li>Cache-Control — prevent caching of authenticated responses</li>
 *   <li>Content-Security-Policy — restrict resource origins</li>
 * </ul>
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        // Prevent MIME-type sniffing
        response.setHeader("X-Content-Type-Options", "nosniff");

        // Prevent click-jacking — deny all framing
        response.setHeader("X-Frame-Options", "DENY");

        // Legacy XSS protection (modern browsers ignore, but doesn't hurt)
        response.setHeader("X-XSS-Protection", "1; mode=block");

        // Limit referrer information leakage
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // Restrict powerful browser features
        response.setHeader("Permissions-Policy",
                "camera=(), microphone=(), geolocation=(), payment=()");

        // Prevent caching of API responses (sensitive data)
        String path = request.getRequestURI();
        if (path.startsWith("/api/")) {
            response.setHeader("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
            response.setHeader("Pragma", "no-cache");
        }

        // Content-Security-Policy — restrict resource loading
        // Relaxed for dev (allow localhost, inline styles for Swagger)
        response.setHeader("Content-Security-Policy",
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "font-src 'self' data:; " +
                "connect-src 'self' http://localhost:* http://127.0.0.1:* http://192.168.*.*:* http://10.*.*.*:* http://172.*.*.*:* https://api.open-meteo.com https://*.googleapis.com; " +
                "frame-ancestors 'none'");

        filterChain.doFilter(request, response);
    }
}
