package com.campustrack.matching;

import com.campustrack.entity.LostFoundItem;

/**
 * Interface defining a matching heuristic rule.
 * Implementing classes adhere to the Strategy Pattern, allowing matching algorithms
 * to be extended, weighted, or replaced without altering the core MatchingService.
 */
public interface MatchingRule {
    double computeScore(LostFoundItem item1, LostFoundItem item2);
    double getWeight();
    String getRuleName();

    default boolean isApplicable(LostFoundItem item1, LostFoundItem item2) {
        return true;
    }
}
