package com.campustrack.service;

import com.campustrack.entity.LostFoundItem;
import com.campustrack.matching.NemotronSemanticMatchingRule;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class NemotronSemanticMatchingTest {

    private NemotronEmbeddingService embeddingService;
    private NemotronSemanticMatchingRule semanticRule;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        embeddingService = new NemotronEmbeddingService(
                objectMapper,
                "https://integrate.api.nvidia.com/v1/embeddings",
                "", // empty key for offline mock tests
                "nvidia/nemotron-3-embed-1b"
        );
        semanticRule = new NemotronSemanticMatchingRule(embeddingService);
    }

    @Test
    @DisplayName("Cosine similarity with identical vectors should be 1.0")
    void testCosineSimilarityIdentical() {
        float[] v1 = new float[]{1.0f, 0.5f, -0.2f, 0.8f};
        float[] v2 = new float[]{1.0f, 0.5f, -0.2f, 0.8f};
        double similarity = embeddingService.cosineSimilarity(v1, v2);
        assertEquals(1.0, similarity, 0.0001);
    }

    @Test
    @DisplayName("Cosine similarity with orthogonal vectors should be 0.0")
    void testCosineSimilarityOrthogonal() {
        float[] v1 = new float[]{1.0f, 0.0f};
        float[] v2 = new float[]{0.0f, 1.0f};
        double similarity = embeddingService.cosineSimilarity(v1, v2);
        assertEquals(0.0, similarity, 0.0001);
    }

    @Test
    @DisplayName("Serialization and deserialization should preserve float values")
    void testSerializationDeserialization() {
        float[] original = new float[]{0.123f, -0.456f, 0.789f};
        String json = embeddingService.serialize(original);
        assertNotNull(json);

        float[] restored = embeddingService.deserialize(json);
        assertNotNull(restored);
        assertEquals(original.length, restored.length);
        for (int i = 0; i < original.length; i++) {
            assertEquals(original[i], restored[i], 0.0001f);
        }
    }

    @Test
    @DisplayName("Nemotron rule is applicable only when both items have embeddings with matching model")
    void testRuleApplicability() {
        LostFoundItem lostItem = LostFoundItem.builder()
                .type("LOST")
                .title("Black laptop")
                .build();

        LostFoundItem foundItem = LostFoundItem.builder()
                .type("FOUND")
                .title("Black Dell laptop")
                .build();

        // Without embeddings -> not applicable
        assertFalse(semanticRule.isApplicable(lostItem, foundItem));

        float[] v1 = new float[]{0.5f, 0.5f};
        float[] v2 = new float[]{0.5f, 0.5f};

        lostItem.setEmbeddingJson(embeddingService.serialize(v1));
        lostItem.setEmbeddingModelVersion(embeddingService.getModel());

        foundItem.setEmbeddingJson(embeddingService.serialize(v2));
        foundItem.setEmbeddingModelVersion(embeddingService.getModel());

        // With embeddings and matching model -> applicable
        assertTrue(semanticRule.isApplicable(lostItem, foundItem));
        assertTrue(semanticRule.isApplicable(foundItem, lostItem)); // symmetric

        // Score should be 1.0 for identical vectors
        double score = semanticRule.computeScore(lostItem, foundItem);
        assertEquals(1.0, score, 0.0001);
    }

    @Test
    @DisplayName("toEmbeddingText should produce standardized string format")
    void testToEmbeddingText() {
        LostFoundItem item = LostFoundItem.builder()
                .title("Sony Headphones")
                .description("Over-ear noise cancelling")
                .category("Electronics")
                .tags("sony, audio")
                .location("Library")
                .build();

        String embeddingText = item.toEmbeddingText();
        assertTrue(embeddingText.contains("Item: Sony Headphones"));
        assertTrue(embeddingText.contains("Description: Over-ear noise cancelling"));
        assertTrue(embeddingText.contains("Category: Electronics"));
        assertTrue(embeddingText.contains("Tags: sony, audio"));
        assertTrue(embeddingText.contains("Location: Library"));
    }
}
