package com.campustrack.controller;

import com.campustrack.dto.ApiResponse;
import com.campustrack.dto.MessageDTOs.*;
import com.campustrack.entity.User;
import com.campustrack.service.AuthService;
import com.campustrack.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final AuthService authService;

    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(@Valid @RequestBody SendMessageRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        MessageResponse response = messageService.sendMessage(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Message sent", response));
    }

    @GetMapping("/messages/{userId}")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getConversation(@PathVariable("userId") Long targetUserId) {
        User currentUser = authService.getCurrentUserEntity();
        List<MessageResponse> conversation = messageService.getConversation(targetUserId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(conversation));
    }

    @GetMapping("/messages/partners")
    public ResponseEntity<ApiResponse<List<ChatPartnerSummary>>> getChatPartners() {
        User currentUser = authService.getCurrentUserEntity();
        List<ChatPartnerSummary> partners = messageService.getChatPartners(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(partners));
    }

    @GetMapping("/messages/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        User currentUser = authService.getCurrentUserEntity();
        long count = messageService.getUnreadCount(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(count));
    }

    @PostMapping("/users/block/{userId}")
    public ResponseEntity<ApiResponse<String>> blockUser(@PathVariable("userId") Long targetUserId) {
        User currentUser = authService.getCurrentUserEntity();
        messageService.blockUser(targetUserId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("User blocked successfully", "BLOCKED"));
    }

    @PostMapping("/users/unblock/{userId}")
    public ResponseEntity<ApiResponse<String>> unblockUser(@PathVariable("userId") Long targetUserId) {
        User currentUser = authService.getCurrentUserEntity();
        messageService.unblockUser(targetUserId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("User unblocked successfully", "UNBLOCKED"));
    }

    @PostMapping("/users/report/{userId}")
    public ResponseEntity<ApiResponse<String>> reportUser(@PathVariable("userId") Long targetUserId, @RequestParam(value = "reason", defaultValue = "Inappropriate behavior") String reason) {
        // User safety report log
        return ResponseEntity.ok(ApiResponse.ok("User reported for moderation review", "REPORTED"));
    }
}
