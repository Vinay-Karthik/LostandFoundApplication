package com.campustrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EngagementStatsResponse {
    private long activeUsers;
    private long totalMessages;
    private long recentMessages;
    private List<DateCount> postsOverTime;
    private List<DateCount> matchesOverTime;
}
