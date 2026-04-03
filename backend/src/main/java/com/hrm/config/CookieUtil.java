package com.hrm.config;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

/**
 * Utility class for managing HttpOnly auth cookies.
 * Centralises cookie creation/clearing to avoid duplication.
 */
public final class CookieUtil {

    public static final String ACCESS_COOKIE  = "hrm_access";
    public static final String REFRESH_COOKIE = "hrm_refresh";

    // Access token TTL: 24 hours
    private static final long ACCESS_MAX_AGE  = 24 * 60 * 60;
    // Refresh token TTL: 7 days
    private static final long REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

    private CookieUtil() {}

    /**
     * Set both access and refresh token cookies as HttpOnly, SameSite=Lax.
     */
    public static void setAuthCookies(HttpServletResponse response,
                                      String accessToken,
                                      String refreshToken) {
        if (accessToken != null) {
            ResponseCookie access = ResponseCookie.from(ACCESS_COOKIE, accessToken)
                    .httpOnly(true)
                    .secure(false)   // TODO: set true in production (HTTPS)
                    .path("/")
                    .maxAge(ACCESS_MAX_AGE)
                    .sameSite("Lax")
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, access.toString());
        }

        if (refreshToken != null) {
            ResponseCookie refresh = ResponseCookie.from(REFRESH_COOKIE, refreshToken)
                    .httpOnly(true)
                    .secure(false)   // TODO: set true in production (HTTPS)
                    .path("/")   // changed from /api/auth to / for consistency and visibility
                    .maxAge(REFRESH_MAX_AGE)
                    .sameSite("Lax")
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, refresh.toString());
        }
    }

    /**
     * Clear both auth cookies by setting max-age=0.
     */
    public static void clearAuthCookies(HttpServletResponse response) {
        ResponseCookie clearAccess = ResponseCookie.from(ACCESS_COOKIE, "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        ResponseCookie clearRefresh = ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true)
                .secure(false)
                .path("/api/auth")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, clearAccess.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, clearRefresh.toString());
    }

    /**
     * Extract a named cookie value from the request cookies array.
     */
    public static String extractCookie(Cookie[] cookies, String name) {
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) {
                return c.getValue();
            }
        }
        return null;
    }
}
