package com.hrm.repository;

import com.hrm.entity.ChatMessage;
import com.hrm.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findTop20ByUserOrderByCreatedAtDesc(User user);
    List<ChatMessage> findTop80ByUserOrderByCreatedAtDesc(User user);
}
