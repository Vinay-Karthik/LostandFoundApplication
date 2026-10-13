package com.campustrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatPartnerSummary {
    private Long userId;
    private String userName;
    private String role;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private long unreadCount;
}
