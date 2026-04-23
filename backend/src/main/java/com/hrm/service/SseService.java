package com.hrm.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class SseService {

    // Map userId to their active emitter
    private final Map<UUID, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(UUID userId) {
        // Set timeout to 30 minutes
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);
        
        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> {
            emitter.complete();
            emitters.remove(userId);
        });
        emitter.onError((e) -> emitters.remove(userId));

        emitters.put(userId, emitter);
        
        // Send initial connect message
        try {
            emitter.send(SseEmitter.event().name("connected").data("Connected to Notification Stream"));
        } catch (IOException e) {
            log.error("Failed to send initial SSE message", e);
            emitters.remove(userId);
        }
        
        return emitter;
    }

    public void sendNotification(UUID userId, Object notification) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(notification));
            } catch (IOException e) {
                log.error("Failed to push SSE notification for user {}", userId, e);
                emitters.remove(userId);
                emitter.complete();
            }
        }
    }
    
    public void sendUnreadCount(UUID userId, long count) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("unread-count")
                        .data(count));
            } catch (IOException e) {
                emitters.remove(userId);
            }
        }
    }
}
