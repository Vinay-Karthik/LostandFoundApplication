package com.campustrack.mapper;

import com.campustrack.dto.MessageResponse;
import com.campustrack.entity.Message;
import org.springframework.stereotype.Component;

/**
 * Mapper component for Message entity to MessageResponse DTO.
 */
@Component
public class MessageMapper {

    public MessageResponse toResponse(Message message, Long currentUserId) {
        if (message == null) {
            return null;
        }

        boolean isMine = currentUserId != null 
                && message.getSender() != null 
                && message.getSender().getId().equals(currentUserId);

        return MessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderName(message.getSender() != null ? message.getSender().getName() : "Anonymous")
                .receiverId(message.getReceiver() != null ? message.getReceiver().getId() : null)
                .receiverName(message.getReceiver() != null ? message.getReceiver().getName() : "Anonymous")
                .content(message.getContent())
                .timestamp(message.getTimestamp())
                .isRead(Boolean.TRUE.equals(message.getIsRead()))
                .isMine(isMine)
                .build();
    }
}
