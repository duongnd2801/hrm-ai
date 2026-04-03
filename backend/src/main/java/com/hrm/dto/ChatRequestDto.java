package com.hrm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class ChatRequestDto {
    @NotBlank(message = "Tin nhắn không được để trống")
    private String message;
    private Integer month;
    private Integer year;
    private List<HistoryMessage> history;

    @Data
    public static class HistoryMessage {
        @NotBlank
        private String role;
        @NotBlank
        private String content;
    }
}
