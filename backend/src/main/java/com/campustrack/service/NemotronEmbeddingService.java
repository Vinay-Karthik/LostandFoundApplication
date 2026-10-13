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
import java.util.List;
import java.util.Map;

/**
 * Creates asymmetric query/passage embeddings through NVIDIA's OpenAI-compatible API.
 * Keep credentials in environment variables and never log authorization headers.
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
        return embed(text, "query");
    }

    public float[] embedPassage(String text) {
        return embed(text, "passage");
    }

    private float[] embed(String text, String inputType) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new EmbeddingUnavailableException(
                    "NVIDIA API key is not configured. Set NVIDIA_API_KEY.", null);
        }
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Text to embed must not be blank");
        }

        Map<String, Object> body = Map.of(
                "input", List.of(text),
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

            JsonNode embedding = mapper.readTree(json).path("data").path(0).path("embedding");
            if (!embedding.isArray() || embedding.isEmpty()) {
                throw new EmbeddingUnavailableException(
                        "NVIDIA returned an empty embedding vector.", null);
            }

            float[] vector = new float[embedding.size()];
            for (int i = 0; i < embedding.size(); i++) {
                JsonNode value = embedding.get(i);
                if (!value.isNumber()) {
                    throw new EmbeddingUnavailableException(
                            "NVIDIA returned a malformed embedding vector.", null);
                }
                vector[i] = (float) value.asDouble();
                if (!Float.isFinite(vector[i])) {
                    throw new EmbeddingUnavailableException(
                            "NVIDIA returned a non-finite embedding value.", null);
                }
            }
            return vector;
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
