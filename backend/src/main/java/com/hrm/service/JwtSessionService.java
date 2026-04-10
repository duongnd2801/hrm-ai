package com.hrm.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hrm.dto.DeviceSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class JwtSessionService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private static final String REFRESH_KEY_PREFIX = "refresh:";

    public void createSession(UUID userId, DeviceSession session, Duration ttl) {
        try {
            String key = generateKey(userId, session.getDeviceId());
            String jsonValue = objectMapper.writeValueAsString(session);
            redisTemplate.opsForValue().set(key, jsonValue, ttl);
        } catch (JsonProcessingException e) {
            log.error("Error serializing device session", e);
        }
    }

    public boolean validateRefreshToken(UUID userId, String deviceId, String refreshToken) {
        try {
            String key = generateKey(userId, deviceId);
            String jsonValue = redisTemplate.opsForValue().get(key);
            if (jsonValue == null) {
                return false;
            }
            DeviceSession session = objectMapper.readValue(jsonValue, DeviceSession.class);
            return refreshToken.equals(session.getRefreshToken());
        } catch (JsonProcessingException e) {
            log.error("Error deserializing device session", e);
            return false;
        }
    }

    public void revokeSession(UUID userId, String deviceId) {
        String key = generateKey(userId, deviceId);
        redisTemplate.delete(key);
    }

    public void revokeAllSessions(UUID userId) {
        String pattern = REFRESH_KEY_PREFIX + userId.toString() + ":*";
        Set<String> keys = redisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    public List<DeviceSession> getActiveSessions(UUID userId) {
        List<DeviceSession> sessions = new ArrayList<>();
        String pattern = REFRESH_KEY_PREFIX + userId.toString() + ":*";
        Set<String> keys = redisTemplate.keys(pattern);
        
        if (keys != null) {
            for (String key : keys) {
                try {
                    String jsonValue = redisTemplate.opsForValue().get(key);
                    if (jsonValue != null) {
                        sessions.add(objectMapper.readValue(jsonValue, DeviceSession.class));
                    }
                } catch (JsonProcessingException e) {
                    log.error("Error parsing session data for key: " + key, e);
                }
            }
        }
        return sessions;
    }

    private String generateKey(UUID userId, String deviceId) {
        return REFRESH_KEY_PREFIX + userId.toString() + ":" + deviceId;
    }
}
