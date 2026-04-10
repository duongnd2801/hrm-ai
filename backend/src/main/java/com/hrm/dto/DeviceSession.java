package com.hrm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceSession {
    private String deviceId;
    private String userAgent;
    private String ipAddress;
    private String refreshToken;
    private LocalDateTime loginAt;
}
