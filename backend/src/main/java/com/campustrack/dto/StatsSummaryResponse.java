package com.campustrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsSummaryResponse {
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
