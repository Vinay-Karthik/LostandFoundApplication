package com.campustrack.matching;

import com.campustrack.entity.LostFoundItem;
import org.apache.commons.text.similarity.JaroWinklerSimilarity;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Order(5)
public class LocationSimilarityRule implements MatchingRule {

    private final JaroWinklerSimilarity jaroWinkler = new JaroWinklerSimilarity();

    @Override
    public double getWeight() {
        return 0.10;
    }

    @Override
    public String getRuleName() {
        return "LocationSimilarity";
    }

    @Override
    public double computeScore(LostFoundItem item1, LostFoundItem item2) {
        if (item1 == null || item2 == null) return 0.0;
        String loc1 = item1.getLocation();
        String loc2 = item2.getLocation();

        if (loc1 == null || loc2 == null || loc1.isBlank() || loc2.isBlank()) {
            return 0.0;
        }

        String l1 = loc1.trim().toLowerCase();
        String l2 = loc2.trim().toLowerCase();

        if (l1.equals(l2)) {
            return 1.0;
        }

        if (l1.contains(l2) || l2.contains(l1)) {
            return 0.8;
        }

        Set<String> words1 = Arrays.stream(l1.split("[\\s,\\-_.]+")).filter(w -> w.length() > 2).collect(Collectors.toSet());
        Set<String> words2 = Arrays.stream(l2.split("[\\s,\\-_.]+")).filter(w -> w.length() > 2).collect(Collectors.toSet());

        if (!words1.isEmpty() && !words2.isEmpty()) {
            long matches = words1.stream().filter(words2::contains).count();
            if (matches > 0) {
                return (double) matches / Math.min(words1.size(), words2.size());
            }
        }

        return jaroWinkler.apply(l1, l2);
    }
}
