package com.campustrack.matching;

import com.campustrack.entity.LostFoundItem;
import org.apache.commons.text.similarity.JaroWinklerSimilarity;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Order(1)
public class TitleSimilarityRule implements MatchingRule {

    private final JaroWinklerSimilarity jaroWinkler = new JaroWinklerSimilarity();

    @Override
    public double getWeight() {
        return 0.40;
    }

    @Override
    public String getRuleName() {
        return "TitleSimilarity";
    }

    @Override
    public double computeScore(LostFoundItem item1, LostFoundItem item2) {
        if (item1 == null || item2 == null) return 0.0;
        return computeFuzzyTextSimilarity(item1.getTitle(), item2.getTitle());
    }

    private double computeFuzzyTextSimilarity(String text1, String text2) {
        if (text1 == null || text2 == null || text1.isBlank() || text2.isBlank()) {
            return 0.0;
        }

        String s1 = text1.trim().toLowerCase();
        String s2 = text2.trim().toLowerCase();

        if (s1.equals(s2)) {
            return 1.0;
        }

        Set<String> words1 = Arrays.stream(s1.split("[\\s,\\-_.]+")).filter(w -> w.length() > 1).collect(Collectors.toSet());
        Set<String> words2 = Arrays.stream(s2.split("[\\s,\\-_.]+")).filter(w -> w.length() > 1).collect(Collectors.toSet());

        if (!words1.isEmpty() && !words2.isEmpty()) {
            Set<String> intersection = words1.stream().filter(words2::contains).collect(Collectors.toSet());
            Set<String> union = words1.stream().collect(Collectors.toSet());
            union.addAll(words2);

            double jaccard = (double) intersection.size() / union.size();
            if (jaccard > 0.4) {
                return Math.max(jaccard, jaroWinkler.apply(s1, s2));
            }
        }

        return jaroWinkler.apply(s1, s2);
    }
}
