package com.campustrack.service;

import com.campustrack.dto.StatsDTOs.*;
import com.campustrack.repository.FlagRepository;
import com.campustrack.repository.ItemRepository;
import com.campustrack.repository.MatchRepository;
import com.campustrack.repository.MessageRepository;
import com.campustrack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatsService {

    private final ItemRepository itemRepository;
    private final MatchRepository matchRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final FlagRepository flagRepository;

    @Transactional(readOnly = true)
    public StatsSummaryResponse getSummaryStats(LocalDate from, LocalDate to) {
        long totalItems = itemRepository.count();
        long totalLost = itemRepository.countByType("LOST");
        long totalFound = itemRepository.countByType("FOUND");
        long totalMatched = itemRepository.countByStatus("MATCHED");
        long totalResolved = itemRepository.countByStatus("RESOLVED");
        long totalUsers = userRepository.count();
        long unverifiedUsers = userRepository.countByVerifiedFalse();
        long openFlags = flagRepository.countByReviewedFalse();

        double recoveryRate = 0.0;
        if (totalLost > 0) {
            recoveryRate = Math.round(((double) (totalMatched + totalResolved) / totalLost * 100.0) * 10.0) / 10.0;
        }

        // Category breakdown
        Map<String, Long> categoryMap = new HashMap<>();
        List<Object[]> categoryCounts = itemRepository.countGroupByCategory();
        for (Object[] row : categoryCounts) {
            String cat = row[0] != null ? row[0].toString() : "Other";
            Long count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            categoryMap.put(cat, count);
        }

        // Recent activity over last 14 days
        LocalDate startDate = from != null ? from : LocalDate.now().minusDays(14);
        List<Object[]> dateCounts = itemRepository.countGroupByDateReported(startDate);
        List<DateCount> recentActivity = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");

        for (Object[] row : dateCounts) {
            if (row[0] instanceof LocalDate date) {
                Long count = ((Number) row[1]).longValue();
                recentActivity.add(new DateCount(date.format(formatter), count));
            }
        }

        return StatsSummaryResponse.builder()
                .totalItems(totalItems)
                .totalLost(totalLost)
                .totalFound(totalFound)
                .totalMatched(totalMatched)
                .totalResolved(totalResolved)
                .recoveryRate(recoveryRate)
                .totalUsers(totalUsers)
                .unverifiedUsers(unverifiedUsers)
                .openFlags(openFlags)
                .categoryBreakdown(categoryMap)
                .recentActivity(recentActivity)
                .build();
    }

    @Transactional(readOnly = true)
    public EngagementStatsResponse getEngagementStats() {
        long totalUsers = userRepository.count();
        long totalMessages = messageRepository.count();
        long recentMessages = messageRepository.countMessagesSince(LocalDateTime.now().minusDays(7));

        LocalDate startDate = LocalDate.now().minusDays(7);
        List<Object[]> dateCounts = itemRepository.countGroupByDateReported(startDate);
        List<DateCount> postsOverTime = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");

        for (Object[] row : dateCounts) {
            if (row[0] instanceof LocalDate date) {
                Long count = ((Number) row[1]).longValue();
                postsOverTime.add(new DateCount(date.format(formatter), count));
            }
        }

        return EngagementStatsResponse.builder()
                .activeUsers(totalUsers)
                .totalMessages(totalMessages)
                .recentMessages(recentMessages)
                .postsOverTime(postsOverTime)
                .matchesOverTime(new ArrayList<>())
                .build();
    }
}
