package com.campustrack.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class NemotronEmbeddingServiceTest {

    private NemotronEmbeddingService service(String key) {
        return new NemotronEmbeddingService(
                new ObjectMapper(),
                "https://example.invalid/v1/embeddings",
                key,
                "nvidia/nemotron-3-embed-1b",
                100,
                100);
    }

    @Test
    void cosineSimilarityReturnsOneForIdenticalVectors() {
        assertEquals(1.0, service("test-key").cosineSimilarity(
                new float[]{1, 2, 3}, new float[]{1, 2, 3}), 1e-9);
    }

    @Test
    void cosineSimilarityReturnsZeroForOrthogonalVectors() {
        assertEquals(0.0, service("test-key").cosineSimilarity(
                new float[]{1, 0}, new float[]{0, 1}), 1e-9);
    }

    @Test
    void cosineSimilaritySafelyHandlesIncompatibleVectors() {
        assertEquals(0.0, service("test-key").cosineSimilarity(
                new float[]{1, 2}, new float[]{1}));
        assertEquals(0.0, service("test-key").cosineSimilarity(
                null, new float[]{1}));
    }

    @Test
    void serializedVectorsRoundTrip() {
        NemotronEmbeddingService service = service("test-key");
        float[] expected = new float[]{0.25f, -0.5f, 1.0f};

        float[] actual = service.deserialize(service.serialize(expected));

        assertArrayEquals(expected, actual, 1e-7f);
    }

    @Test
    void missingApiKeyFailsClearlyWithoutMakingNetworkRequest() {
        NemotronEmbeddingService service = service("");

        assertThrows(
                NemotronEmbeddingService.EmbeddingUnavailableException.class,
                () -> service.embedQuery("black water bottle"));
    }
}
