package com.hrm.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("service", "hrm-backend");
        body.put("status", "UP");
        body.put("timestamp", OffsetDateTime.now().toString());
        body.put("database", checkDatabase());
        return ResponseEntity.ok(body);
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, Object>> readiness() {
        boolean databaseUp = isDatabaseUp();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("service", "hrm-backend");
        body.put("status", databaseUp ? "READY" : "NOT_READY");
        body.put("timestamp", OffsetDateTime.now().toString());
        body.put("database", databaseUp ? "UP" : "DOWN");

        return ResponseEntity.status(databaseUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }

    private String checkDatabase() {
        return isDatabaseUp() ? "UP" : "DOWN";
    }

    private boolean isDatabaseUp() {
        try {
            Integer result = jdbcTemplate.queryForObject("select 1", Integer.class);
            return result != null && result == 1;
        } catch (Exception ignored) {
            return false;
        }
    }
}
