package com.hrm.repository;

import com.hrm.entity.Notification;
import com.hrm.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    Page<Notification> findByUserAndReadFalseOrderByCreatedAtDesc(User user, Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user = :user AND n.read = false")
    long countUnreadByUser(User user);

    void deleteByUserAndRead(User user, boolean read);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE Notification n SET n.read = :read, n.readAt = :readAt WHERE n.id = :id")
    void updateReadStatus(java.util.UUID id, boolean read, java.time.LocalDateTime readAt);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE Notification n SET n.read = true, n.readAt = :readAt WHERE n.user = :user AND n.read = false")
    void markAllAsReadForUser(User user, java.time.LocalDateTime readAt);
}
