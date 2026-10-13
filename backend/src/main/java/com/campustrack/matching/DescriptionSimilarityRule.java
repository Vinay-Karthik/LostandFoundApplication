package com.campustrack.matching;

import com.campustrack.entity.LostFoundItem;
import org.apache.commons.text.similarity.JaroWinklerSimilarity;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Order(2)
public class DescriptionSimilarityRule implements MatchingRule {

    private final JaroWinklerSimilarity jaroWinkler = new JaroWinklerSimilarity();

    @Override
    public double getWeight() {
        return 0.20;
    }

    @Override
    public String getRuleName() {
        return "DescriptionSimilarity";
    }

    @Override
    public double computeScore(LostFoundItem item1, LostFoundItem item2) {
        if (item1 == null || item2 == null) return 0.0;
        String desc1 = item1.getDescription();
        String desc2 = item2.getDescription();

        if (desc1 == null || desc2 == null || desc1.isBlank() || desc2.isBlank()) {
            return 0.0;
        }

        String s1 = desc1.trim().toLowerCase();
        String s2 = desc2.trim().toLowerCase();

        Set<String> words1 = Arrays.stream(s1.split("[\\s,\\-_.]+")).filter(w -> w.length() > 2).collect(Collectors.toSet());
        Set<String> words2 = Arrays.stream(s2.split("[\\s,\\-_.]+")).filter(w -> w.length() > 2).collect(Collectors.toSet());

        if (!words1.isEmpty() && !words2.isEmpty()) {
            Set<String> intersection = words1.stream().filter(words2::contains).collect(Collectors.toSet());
            Set<String> union = words1.stream().collect(Collectors.toSet());
            union.addAll(words2);

            return (double) intersection.size() / union.size();
        }

        return jaroWinkler.apply(s1, s2);
    }
}
