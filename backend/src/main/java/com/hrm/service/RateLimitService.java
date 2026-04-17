package com.hrm.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RateLimitService {

    private final StringRedisTemplate redisTemplate;

    private static final String FAIL_COUNT_PREFIX = "login_fail_count:";
    private static final String BLOCK_PREFIX = "login_block:";
    private static final int MAX_ATTEMPTS = 10;
    private static final int BLOCK_DURATION_MINUTES = 10;

    public void recordFailure(String key) {
        String failKey = FAIL_COUNT_PREFIX + key;
        Long attempts = redisTemplate.opsForValue().increment(failKey);
        
        // Cài đặt TTL cho counter (VD: sau 1 tiếng tự reset nếu không đạt ngưỡng block)
        if (attempts != null && attempts == 1) {
            redisTemplate.expire(failKey, 1, TimeUnit.HOURS);
        }

        if (attempts != null && attempts >= MAX_ATTEMPTS) {
            log.warn("Rate limit reached for key: {}. Blocking for {} minutes.", key, BLOCK_DURATION_MINUTES);
            redisTemplate.opsForValue().set(BLOCK_PREFIX + key, "blocked", Duration.ofMinutes(BLOCK_DURATION_MINUTES));
            redisTemplate.delete(failKey); // Reset counter after blocking
        }
    }

    public void recordSuccess(String key) {
        redisTemplate.delete(FAIL_COUNT_PREFIX + key);
        redisTemplate.delete(BLOCK_PREFIX + key);
    }

    public boolean isBlocked(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLOCK_PREFIX + key));
    }

    public Long getRemainingBlockTime(String key) {
        return redisTemplate.getExpire(BLOCK_PREFIX + key, TimeUnit.SECONDS);
    }
}
