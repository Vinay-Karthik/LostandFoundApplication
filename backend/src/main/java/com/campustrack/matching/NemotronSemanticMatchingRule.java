package com.campustrack.matching;

import com.campustrack.entity.LostFoundItem;
import com.campustrack.service.NemotronEmbeddingService;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(0)
public class NemotronSemanticMatchingRule implements MatchingRule {

    private final NemotronEmbeddingService embeddings;

    public NemotronSemanticMatchingRule(NemotronEmbeddingService embeddings) {
        this.embeddings = embeddings;
    }

    @Override
    public String getRuleName() {
        return "NemotronSemanticSimilarity";
    }

    @Override
    public double getWeight() {
        return 0.50;
    }

    @Override
    public boolean isApplicable(LostFoundItem a, LostFoundItem b) {
        if (a == null || b == null) {
            return false;
        }

        boolean validTypes = ("LOST".equalsIgnoreCase(a.getType()) && "FOUND".equalsIgnoreCase(b.getType()))
                || ("FOUND".equalsIgnoreCase(a.getType()) && "LOST".equalsIgnoreCase(b.getType()));

        return validTypes
                && a.getEmbeddingJson() != null
                && b.getEmbeddingJson() != null
                && embeddings.getModel().equals(a.getEmbeddingModelVersion())
                && embeddings.getModel().equals(b.getEmbeddingModelVersion());
    }

    @Override
    public double computeScore(LostFoundItem a, LostFoundItem b) {
        if (!isApplicable(a, b)) {
            return 0.0;
        }

        float[] vectorA = embeddings.deserialize(a.getEmbeddingJson());
        float[] vectorB = embeddings.deserialize(b.getEmbeddingJson());

        double cosine = embeddings.cosineSimilarity(vectorA, vectorB);

        return Math.max(0.0, Math.min(1.0, cosine));
    }
}
