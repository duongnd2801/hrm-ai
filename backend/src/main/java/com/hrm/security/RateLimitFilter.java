package com.hrm.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrm.service.RateLimitService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;
    private final ObjectMapper objectMapper;

    private static final List<String> LIMITED_PATHS = List.of("/api/auth/login");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        
        if (LIMITED_PATHS.contains(path) && "POST".equalsIgnoreCase(request.getMethod())) {
            // Wrap request to read body twice
            CachedBodyHttpServletRequest cachedRequest = new CachedBodyHttpServletRequest(request);
            String clientIp = getClientIp(cachedRequest);
            String username = getUsernameFromBody(cachedRequest);
            
            String key = clientIp + (username != null ? ":" + username : "");

            if (rateLimitService.isBlocked(key)) {
                sendErrorResponse(response, key);
                return;
            }
            
            filterChain.doFilter(cachedRequest, response);
        } else {
            filterChain.doFilter(request, response);
        }
    }

    private void sendErrorResponse(HttpServletResponse response, String key) throws IOException {
        long remaining = rateLimitService.getRemainingBlockTime(key);
        long minutes = remaining / 60;
        long seconds = remaining % 60;

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        String message = String.format("Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau %d phút %d giây.", minutes, seconds);
        String json = String.format("{\"error\":\"Too Many Requests\",\"message\":\"%s\",\"status\":429}", message);
        
        response.getWriter().write(json);
    }

    private String getUsernameFromBody(CachedBodyHttpServletRequest request) {
        try {
            JsonNode node = objectMapper.readTree(request.getCachedBody());
            if (node.has("email")) return node.get("email").asText();
            if (node.has("username")) return node.get("username").asText();
        } catch (Exception e) {
            log.error("Failed to parse username from request body for rate limiting");
        }
        return null;
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
