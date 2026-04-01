package com.hrm.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiration;

    private SecretKey key() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(String email, String role) {
        return generate(email, role, "access", expiration);
    }

    public String generateRefreshToken(String email, String role) {
        return generate(email, role, "refresh", refreshExpiration);
    }

    public String generate(String email, String role) {
        return generateAccessToken(email, role);
    }

    private String generate(String email, String role, String tokenType, long ttlMillis) {
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .claim("type", tokenType)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + ttlMillis))
                .signWith(key())
                .compact();
    }

    public String getEmail(String token) {
        return claims(token).getSubject();
    }

    public String getRole(String token) {
        return claims(token).get("role", String.class);
    }

    public String getTokenType(String token) {
        return claims(token).get("type", String.class);
    }

    public boolean isValid(String token) {
        try {
            claims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isValidAccessToken(String token) {
        return isValid(token) && "access".equals(getTokenType(token));
    }

    public boolean isValidRefreshToken(String token) {
        return isValid(token) && "refresh".equals(getTokenType(token));
    }

    private Claims claims(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
