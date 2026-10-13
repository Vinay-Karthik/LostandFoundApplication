package com.campustrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class MatchDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchResponse {
        private Long id;
        private Long lostItemId;
        private String lostItemTitle;
        private String lostItemCategory;
        private String lostItemLocation;
        private String lostItemImageUrl;
        private Long lostItemOwnerId;
        private String lostItemOwnerName;

        private Long foundItemId;
        private String foundItemTitle;
        private String foundItemCategory;
        private String foundItemLocation;
        private String foundItemImageUrl;
        private Long foundItemOwnerId;
        private String foundItemOwnerName;

        private Float matchScore;
        private int matchPercentage;
        private String status; // 'SUGGESTED' | 'CONFIRMED' | 'REJECTED'
        private LocalDateTime createdAt;
        private boolean isUserInvolved;
    }
}
