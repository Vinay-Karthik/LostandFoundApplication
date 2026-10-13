package com.campustrack.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class ItemDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateItemRequest {
        @NotBlank(message = "Type (LOST or FOUND) is required")
        private String type; // 'LOST' | 'FOUND'

        @NotBlank(message = "Title is required")
        private String title;

        private String description;
        private LocalDate dateReported;
        private String location;
        private String category;
        private String tags;
        private String imageUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateItemRequest {
        private String title;
        private String description;
        private LocalDate dateReported;
        private String location;
        private String category;
        private String tags;
        private String imageUrl;
        private String status; // 'OPEN' | 'MATCHED' | 'RESOLVED' | 'REMOVED'
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemResponse {
        private Long id;
        private String type;
        private String title;
        private String description;
        private LocalDate dateReported;
        private String location;
        private String imageUrl;
        private String category;
        private String tags;
        private String status;
        private LocalDateTime createdAt;
        private Long userId;
        private String userName;
        private boolean isOwner;
        private int matchCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PagedResponse<T> {
        private List<T> content;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean last;
    }
}
