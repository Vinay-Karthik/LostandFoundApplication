package com.campustrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

public class StatsDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatsSummaryResponse {
        private long totalItems;
        private long totalLost;
        private long totalFound;
        private long totalMatched;
        private long totalResolved;
        private double recoveryRate;
        private long totalUsers;
        private long unverifiedUsers;
        private long openFlags;
        private Map<String, Long> categoryBreakdown;
        private List<DateCount> recentActivity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DateCount {
        private String date;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EngagementStatsResponse {
        private long activeUsers;
        private long totalMessages;
        private long recentMessages;
        private List<DateCount> postsOverTime;
        private List<DateCount> matchesOverTime;
    }
}
