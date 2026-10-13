
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
        if (item1 == null || item2 == null) {
            return false;
        }
        if (item1.getId() != null && item1.getId().equals(item2.getId())) {
            return false;
        }
        if (item1.getType() != null && item2.getType() != null && item1.getType().equalsIgnoreCase(item2.getType())) {
            return false;
        }
        return true;
    }
}
