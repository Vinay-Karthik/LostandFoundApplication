package com.campustrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class MessageDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SendMessageRequest {
        @NotNull(message = "Receiver ID is required")
        private Long receiverId;

        @NotBlank(message = "Content cannot be empty")
        private String content;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageResponse {
        private Long id;
        private Long senderId;
        private String senderName;
        private Long receiverId;
        private String receiverName;
        private String content;
        private LocalDateTime timestamp;
        private boolean isRead;
        private boolean isMine;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatPartnerSummary {
        private Long userId;
        private String userName;
        private String role;
        private String lastMessage;
        private LocalDateTime lastMessageTime;
        private long unreadCount;
    }
}
