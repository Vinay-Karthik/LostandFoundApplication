package com.campustrack.matching;

import com.campustrack.entity.LostFoundItem;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Order(4)
public class TagOverlapRule implements MatchingRule {

    @Override
    public double getWeight() {
        return 0.10;
    }

    @Override
    public String getRuleName() {
        return "TagOverlap";
    }

    @Override
    public double computeScore(LostFoundItem item1, LostFoundItem item2) {
        if (item1 == null || item2 == null) return 0.0;
        String tags1 = item1.getTags();
        String tags2 = item2.getTags();

        if (tags1 == null || tags2 == null || tags1.isBlank() || tags2.isBlank()) {
            return 0.0;
        }

        Set<String> set1 = Arrays.stream(tags1.toLowerCase().split("[\\s,#,]+"))
                .map(String::trim)
                .filter(t -> !t.isEmpty())
                .collect(Collectors.toSet());

        Set<String> set2 = Arrays.stream(tags2.toLowerCase().split("[\\s,#,]+"))
                .map(String::trim)
                .filter(t -> !t.isEmpty())
                .collect(Collectors.toSet());

        if (set1.isEmpty() || set2.isEmpty()) {
            return 0.0;
        }

        long intersectionCount = set1.stream().filter(set2::contains).count();
        if (intersectionCount == 0) {
            return 0.0;
        }

        Set<String> union = new java.util.HashSet<>(set1);
        union.addAll(set2);

        return (double) intersectionCount / union.size();
    }
}
