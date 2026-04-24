package com.hrm.service;

import com.hrm.dto.ChatHistoryItemDto;
import com.hrm.entity.ChatMessage;
import com.hrm.entity.User;
import com.hrm.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatHistoryService {

    private final ChatMessageRepository chatMessageRepository;

    @Transactional
    public void saveMessage(User user, String role, String content, boolean isUserMessage, String toolName) {
        chatMessageRepository.save(ChatMessage.builder()
                .user(user)
                .role(role)
                .content(content)
                .userMessage(isUserMessage)
                .toolName(toolName)
                .build());
    }

    @Transactional(readOnly = true)
    public List<ChatHistoryItemDto> getHistory(User user) {
        List<ChatMessage> rows = chatMessageRepository.findTop80ByUserOrderByCreatedAtDesc(user);
        rows.sort(Comparator.comparing(ChatMessage::getCreatedAt));

        List<ChatHistoryItemDto> result = new ArrayList<>();
        for (ChatMessage row : rows) {
            result.add(ChatHistoryItemDto.builder()
                    .role(row.isUserMessage() ? "user" : "assistant")
                    .content(row.getContent())
                    .timestamp(row.getCreatedAt())
                    .build());
        }
        return result;
    }
}
