package com.hrm.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChatHistoryItemDto {
    private String role;
    private String content;
    private LocalDateTime timestamp;
}
