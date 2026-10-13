package com.campustrack.service;

import com.campustrack.dto.*;
import com.campustrack.entity.Message;
import com.campustrack.entity.User;
import com.campustrack.entity.UserBlock;
import com.campustrack.exception.CustomExceptions.*;
import com.campustrack.mapper.MessageMapper;
import com.campustrack.repository.MessageRepository;
import com.campustrack.repository.UserBlockRepository;
import com.campustrack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final UserBlockRepository userBlockRepository;
    private final MessageMapper messageMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public MessageResponse sendMessage(SendMessageRequest request, User sender) {
        Long receiverId = request.getReceiverId();

        if (sender.getId().equals(receiverId)) {
            throw new BadRequestException("You cannot send messages to yourself");
        }

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient user not found"));

        if (userBlockRepository.isBlockedBetween(sender.getId(), receiverId)) {
            throw new ForbiddenException("Cannot send message: This conversation has been blocked");
        }

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(request.getContent().trim())
                .timestamp(LocalDateTime.now())
                .isRead(false)
                .build();

        Message savedMessage = messageRepository.save(message);
        MessageResponse response = messageMapper.toResponse(savedMessage, sender.getId());

        broadcastMessage(response, sender.getId(), receiverId);

        return response;
    }

    @Transactional
    public List<MessageResponse> getConversation(Long targetUserId, User currentUser) {
        userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        messageRepository.markAsRead(targetUserId, currentUser.getId());

        List<Message> messages = messageRepository.findConversation(currentUser.getId(), targetUserId);
        return messages.stream()
                .map(m -> messageMapper.toResponse(m, currentUser.getId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatPartnerSummary> getChatPartners(User currentUser) {
        List<Long> partnerIds = messageRepository.findDistinctChatPartnerIds(currentUser.getId());
        List<ChatPartnerSummary> summaries = new ArrayList<>();

        for (Long partnerId : partnerIds) {
            User partner = userRepository.findById(partnerId).orElse(null);
            if (partner == null) continue;

            List<Message> convo = messageRepository.findConversation(currentUser.getId(), partnerId);
            if (convo.isEmpty()) continue;

            Message lastMsg = convo.get(convo.size() - 1);
            long unreadCount = convo.stream()
                    .filter(m -> m.getSender().getId().equals(partnerId) && !Boolean.TRUE.equals(m.getIsRead()))
                    .count();

            summaries.add(ChatPartnerSummary.builder()
                    .userId(partner.getId())
                    .userName(partner.getName())
                    .role(partner.getRole())
                    .lastMessage(lastMsg.getContent())
                    .lastMessageTime(lastMsg.getTimestamp())
                    .unreadCount(unreadCount)
                    .build());
        }

        summaries.sort((a, b) -> b.getLastMessageTime().compareTo(a.getLastMessageTime()));
        return summaries;
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(User currentUser) {
        return messageRepository.countByReceiverIdAndIsReadFalse(currentUser.getId());
    }

    @Transactional
    public void blockUser(Long targetUserId, User currentUser) {
        if (currentUser.getId().equals(targetUserId)) {
            throw new BadRequestException("You cannot block yourself");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (userBlockRepository.findByBlockerIdAndBlockedId(currentUser.getId(), targetUserId).isEmpty()) {
            UserBlock block = UserBlock.builder()
                    .blocker(currentUser)
                    .blocked(targetUser)
                    .createdAt(LocalDateTime.now())
                    .build();
            userBlockRepository.save(block);
            log.info("User {} blocked user {}", currentUser.getId(), targetUserId);
        }
    }

    @Transactional
    public void unblockUser(Long targetUserId, User currentUser) {
        userBlockRepository.findByBlockerIdAndBlockedId(currentUser.getId(), targetUserId)
                .ifPresent(userBlockRepository::delete);
    }

    public static String getConversationChannelId(Long u1, Long u2) {
        return u1 < u2 ? u1 + "_" + u2 : u2 + "_" + u1;
    }

    private void broadcastMessage(MessageResponse response, Long senderId, Long receiverId) {
        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/messages/" + receiverId, response);
                messagingTemplate.convertAndSend("/topic/messages/" + senderId, response);

                String conversationChannel = getConversationChannelId(senderId, receiverId);
                messagingTemplate.convertAndSend("/topic/chat/" + conversationChannel, response);
            } catch (Exception e) {
                log.warn("Failed to broadcast message over WebSocket: {}", e.getMessage());
            }
        }
    }
}
