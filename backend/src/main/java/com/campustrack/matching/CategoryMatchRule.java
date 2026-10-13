package com.campustrack.matching;

import com.campustrack.entity.LostFoundItem;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(3)
public class CategoryMatchRule implements MatchingRule {

    @Override
    public double getWeight() {
        return 0.20;
    }

    @Override
    public String getRuleName() {
        return "CategoryMatch";
    }

    @Override
    public double computeScore(LostFoundItem item1, LostFoundItem item2) {
        if (item1 == null || item2 == null) return 0.0;
        String cat1 = item1.getCategory();
        String cat2 = item2.getCategory();

        if (cat1 == null || cat2 == null || cat1.isBlank() || cat2.isBlank()) {
            return 0.0;
        }

        String c1 = cat1.trim().toLowerCase();
        String c2 = cat2.trim().toLowerCase();

        if (c1.equals(c2)) {
            return 1.0;
        } else if (c1.contains(c2) || c2.contains(c1)) {
            return 0.5;
        }

        return 0.0;
    }
}
