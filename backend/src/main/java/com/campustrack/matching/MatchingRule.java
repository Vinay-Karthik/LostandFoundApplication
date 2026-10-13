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

    /**
     * Rules can opt out when their required data is unavailable. The scorer
     * excludes their weight too, so legacy items without vectors still use
     * the existing heuristic score without an artificial penalty.
     */
    default boolean isApplicable(LostFoundItem item1, LostFoundItem item2) {
        return true;
    }
}
