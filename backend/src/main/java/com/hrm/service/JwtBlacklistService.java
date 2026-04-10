package com.hrm.service;

import com.hrm.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class JwtBlacklistService {

    private final RedisService redisService;
    private final JwtTokenProvider jwtTokenProvider;

    private static final String BLACKLIST_KEY_PREFIX = "blacklist:token:";

    /**
     * Thêm token vào blacklist với TTL dựa trên thời gian hết hạn còn lại
     */
    public void blacklistToken(String token) {
        if (!jwtTokenProvider.isValid(token)) {
            log.warn("Token không hợp lệ, không thể thêm vào blacklist");
            return;
        }

        long remainingTimeMs = jwtTokenProvider.getExpirationDate(token).getTime() - System.currentTimeMillis();

        if (remainingTimeMs > 0) {
            String key = BLACKLIST_KEY_PREFIX + token;
            redisService.set(key, "revoked", Duration.ofMillis(remainingTimeMs));
            log.info("Đã thêm token vào blacklist, thời gian tồn tại (TTL): {} ms", remainingTimeMs);
        }
    }

    /**
     * Kiểm tra xem token có nằm trong blacklist không
     */
    public boolean isBlacklisted(String token) {
        return redisService.exists(BLACKLIST_KEY_PREFIX + token);
    }
}
