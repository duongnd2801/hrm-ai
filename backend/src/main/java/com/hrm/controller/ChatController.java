package com.hrm.controller;

import com.hrm.dto.ChatHistoryItemDto;
import com.hrm.dto.ChatRequestDto;
import com.hrm.dto.ChatResponseDto;
import com.hrm.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/message")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','HR','ADMIN')")
    public ChatResponseDto sendMessage(@Valid @RequestBody ChatRequestDto request, Authentication authentication) {
        return chatService.processMessage(request, authentication);
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','HR','ADMIN')")
    public List<ChatHistoryItemDto> getHistory(Authentication authentication) {
        return chatService.getHistory(authentication);
    }
}
