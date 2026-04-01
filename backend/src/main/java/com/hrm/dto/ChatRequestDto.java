package com.hrm.dto;

import lombok.Data;

import java.util.List;

@Data
public class ChatRequestDto {
    private String message;
    private Integer month;
    private Integer year;
    private List<HistoryMessage> history;

    @Data
    public static class HistoryMessage {
        private String role;
        private String content;
    }
}
