package com.campustrack.matching;

import com.campustrack.entity.LostFoundItem;
import com.campustrack.service.NemotronEmbeddingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class NemotronSemanticMatchingRuleTest {
    private final NemotronEmbeddingService embeddings =
            new NemotronEmbeddingService(
                    new ObjectMapper(),
                    "https://example.invalid/v1/embeddings",
                    "test-key",
                    "nvidia/nemotron-3-embed-1b",
                    100,
                    100);
    private final NemotronSemanticMatchingRule rule =
            new NemotronSemanticMatchingRule(embeddings);

    @Test
    void identicalVectorsProducePerfectSemanticScore() {
        LostFoundItem a = item(new float[]{1, 0}, "LOST");
        LostFoundItem b = item(new float[]{1, 0}, "FOUND");

        assertTrue(rule.isApplicable(a, b));
        assertEquals(1.0, rule.computeScore(a, b), 1e-9);
    }

    @Test
    void orthogonalVectorsProduceZeroSemanticScore() {
        LostFoundItem a = item(new float[]{1, 0}, "LOST");
        LostFoundItem b = item(new float[]{0, 1}, "FOUND");

        assertEquals(0.0, rule.computeScore(a, b), 1e-9);
    }

    @Test
    void missingLegacyEmbeddingsMakeRuleInapplicable() {
        LostFoundItem legacy = LostFoundItem.builder().title("Black bottle").build();
        LostFoundItem embedded = item(new float[]{1, 0}, "FOUND");

        assertFalse(rule.isApplicable(legacy, embedded));
    }

    private LostFoundItem item(float[] vector, String type) {
        return LostFoundItem.builder()
                .type(type)
                .title("Test item")
                .embeddingJson(embeddings.serialize(vector))
                .embeddingModelVersion(embeddings.getModel())
                .build();
    }
}
