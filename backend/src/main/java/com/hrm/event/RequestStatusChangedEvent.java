package com.hrm.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.UUID;

/**
 * Event publicado quando um request de permissão/OT é criado ou atualizado
 * Dispara criação automática de notificações
 */
@Data
@AllArgsConstructor
public class RequestStatusChangedEvent {
    private UUID requestId;
    private String requestType; // "APOLOGY", "LEAVE_REQUEST", "OT_REQUEST"
    private String status; // "PENDING", "APPROVED", "REJECTED"
    private UUID affectedUserId; // User que será notificado
    private String reason; // Motivo da rejeição (se aplicável)
}
