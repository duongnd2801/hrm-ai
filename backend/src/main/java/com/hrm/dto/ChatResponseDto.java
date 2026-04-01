package com.hrm.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class ChatResponseDto {
    private String message;
    private String toolName;
    private Map<String, Object> toolResult;
    private LocalDateTime timestamp;
}
