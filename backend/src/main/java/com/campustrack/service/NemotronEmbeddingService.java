package com.campustrack.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * NVIDIA's OpenAI-compatible, asymmetric text embedding client.
 * Passage vectors are for indexing; query vectors are for retrieval.
 */
@Service
public class NemotronEmbeddingService {
    private final RestClient client;
    private final ObjectMapper mapper;
    private final String apiUrl;
    private final String apiKey;
    private final String model;

    public NemotronEmbeddingService(
            ObjectMapper mapper,
            @Value("${nvidia.api.url:https://integrate.api.nvidia.com/v1/embeddings}") String apiUrl,
            @Value("${nvidia.api.key:}") String apiKey,
            @Value("${nvidia.embedding.model:nvidia/nemotron-3-embed-1b}") String model,
            @Value("${nvidia.embedding.connect-timeout-ms:5000}") int connectTimeoutMs,
            @Value("${nvidia.embedding.read-timeout-ms:30000}") int readTimeoutMs) {
        this.mapper = mapper;
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.model = model;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(Math.max(1, connectTimeoutMs)));
        factory.setReadTimeout(Duration.ofMillis(Math.max(1, readTimeoutMs)));
        this.client = RestClient.builder().requestFactory(factory).build();
    }

    public float[] embedQuery(String text) {
        return embedBatch(List.of(requireText(text)), "query").get(0);
    }

    public float[] embedPassage(String text) {
        return embedBatch(List.of(requireText(text)), "passage").get(0);
    }

    /** Batch query embeddings for LOST reports. */
    public List<float[]> embedQueries(List<String> texts) {
        if (texts == null || texts.isEmpty()) return List.of();
        return embedBatch(texts.stream().map(this::requireText).toList(), "query");
    }

    /** Batch passage embeddings for FOUND reports. */
    public List<float[]> embedPassages(List<String> texts) {
        if (texts == null || texts.isEmpty()) return List.of();
        return embedBatch(texts.stream().map(this::requireText).toList(), "passage");
    }

    private String requireText(String text) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Text to embed must not be blank");
        }
        return text;
    }

    private List<float[]> embedBatch(List<String> texts, String inputType) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new EmbeddingUnavailableException(
                    "NVIDIA API key is not configured. Set NVIDIA_API_KEY.", null);
        }

        Map<String, Object> body = Map.of(
                "input", texts,
                "model", model,
                "input_type", inputType,
                "encoding_format", "float"
        );

        try {
            String json = client.post()
                    .uri(apiUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            if (json == null || json.isBlank()) {
                throw new EmbeddingUnavailableException(
                        "NVIDIA returned an empty response.", null);
            }

            JsonNode data = mapper.readTree(json).path("data");
            if (!data.isArray() || data.size() != texts.size()) {
                throw new EmbeddingUnavailableException(
                        "NVIDIA returned an unexpected number of embeddings.", null);
            }

            List<float[]> vectors = new ArrayList<>(
                    Collections.nCopies(texts.size(), null));

            for (int i = 0; i < data.size(); i++) {
                JsonNode row = data.get(i);
                int index = row.path("index").asInt(i);
                JsonNode embedding = row.path("embedding");

                if (index < 0 || index >= texts.size()
                        || vectors.get(index) != null
                        || !embedding.isArray() || embedding.isEmpty()) {
                    throw new EmbeddingUnavailableException(
                            "NVIDIA returned malformed embedding data.", null);
                }

                float[] vector = new float[embedding.size()];
                for (int j = 0; j < embedding.size(); j++) {
                    JsonNode value = embedding.get(j);
                    if (!value.isNumber()) {
                        throw new EmbeddingUnavailableException(
                                "NVIDIA returned a non-numeric embedding value.", null);
                    }
                    vector[j] = (float) value.asDouble();
                    if (!Float.isFinite(vector[j])) {
                        throw new EmbeddingUnavailableException(
                                "NVIDIA returned a non-finite embedding value.", null);
                    }
                }
                vectors.set(index, vector);
            }

            if (vectors.stream().anyMatch(v -> v == null)) {
                throw new EmbeddingUnavailableException(
                        "NVIDIA response omitted one or more embeddings.", null);
            }
            return List.copyOf(vectors);
        } catch (RestClientException | JsonProcessingException ex) {
            throw new EmbeddingUnavailableException(
                    "NVIDIA embedding request failed. Check the API key, model access, and service status.", ex);
        }
    }

    public double cosineSimilarity(float[] a, float[] b) {
        if (a == null || b == null || a.length == 0 || a.length != b.length) {
            return 0.0;
        }
        double dot = 0.0, normA = 0.0, normB = 0.0;
        for (int i = 0; i < a.length; i++) {
            dot += (double) a[i] * b[i];
            normA += (double) a[i] * a[i];
            normB += (double) b[i] * b[i];
        }
        if (normA == 0 || normB == 0) return 0.0;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    public String serialize(float[] vector) {
        try {
            return mapper.writeValueAsString(vector);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize embedding vector", ex);
        }
    }

    public float[] deserialize(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            List<Float> values = mapper.readValue(json, new TypeReference<List<Float>>() {});
            if (values.isEmpty()) return null;
            float[] vector = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                Float value = values.get(i);
                if (value == null || !Float.isFinite(value)) return null;
                vector[i] = value;
            }
            return vector;
        } catch (JsonProcessingException | IllegalArgumentException ex) {
            return null;
        }
    }

    public String getModel() {
        return model;
    }

    public static class EmbeddingUnavailableException extends RuntimeException {
        public EmbeddingUnavailableException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
