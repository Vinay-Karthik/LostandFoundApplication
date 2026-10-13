package com.campustrack.matching;

import com.campustrack.entity.LostFoundItem;
import com.campustrack.service.NemotronEmbeddingService;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Scores semantic similarity only when both items have compatible, persisted vectors.
 * Missing vectors leave the existing heuristic rules fully active.
 */
@Component
@Order(0)
public class NemotronSemanticMatchingRule implements MatchingRule {
    private final NemotronEmbeddingService embeddings;

    public NemotronSemanticMatchingRule(NemotronEmbeddingService embeddings) {
        this.embeddings = embeddings;
    }

    @Override
    public double getWeight() {
        // Existing rules sum to 1.0; 0.50 gives semantic similarity about one third
        // of the combined score. Calibrate using reviewed matches before production.
        return 0.50;
    }

    @Override
    public String getRuleName() {
        return "NemotronSemanticSimilarity";
    }

    @Override
    public boolean isApplicable(LostFoundItem a, LostFoundItem b) {
        return compatibleEmbedding(a) && compatibleEmbedding(b)
                && a.getEmbeddingModelVersion().equals(b.getEmbeddingModelVersion())
                && a.getEmbeddingModelVersion().equals(embeddings.getModel());
    }

    private boolean compatibleEmbedding(LostFoundItem item) {
        return item != null
                && item.getEmbeddingJson() != null
                && !item.getEmbeddingJson().isBlank()
                && item.getEmbeddingModelVersion() != null
                && !item.getEmbeddingModelVersion().isBlank();
    }

    @Override
    public double computeScore(LostFoundItem item1, LostFoundItem item2) {
        if (!isApplicable(item1, item2)) {
            return 0.0;
        }

        float[] a = embeddings.deserialize(item1.getEmbeddingJson());
        float[] b = embeddings.deserialize(item2.getEmbeddingJson());
        if (a == null || b == null) {
            return 0.0;
        }

        // Existing rules use a [0,1] score. Preserve positive cosine similarity
        // directly; negative similarity contributes zero rather than appearing
        // moderately relevant just because cosine's theoretical minimum is -1.
        double cosine = embeddings.cosineSimilarity(a, b);
        return Math.max(0.0, Math.min(1.0, cosine));
    }
}
