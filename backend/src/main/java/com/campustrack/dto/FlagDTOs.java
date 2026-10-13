package com.campustrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class FlagDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateFlagRequest {
        @NotNull(message = "Item ID is required")
        private Long itemId;

        @NotBlank(message = "Reason is required")
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResolveFlagRequest {
        private boolean removeItem;
        private String note;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FlagResponse {
        private Long id;
        private Long itemId;
        private String itemTitle;
        private String itemType;
        private String itemImageUrl;
        private Long reportedById;
        private String reportedByName;
        private String reason;
        private boolean reviewed;
        private LocalDateTime createdAt;
    }
}
