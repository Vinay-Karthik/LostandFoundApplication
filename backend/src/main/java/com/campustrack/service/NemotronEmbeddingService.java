package com.campustrack.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class NemotronEmbeddingService {

    private final RestClient client = RestClient.create();
    private final ObjectMapper mapper;
    private final String apiUrl;
    private final String apiKey;
    private final String model;

    public NemotronEmbeddingService(
            ObjectMapper mapper,
            @Value("${nvidia.api.url:https://integrate.api.nvidia.com/v1/embeddings}") String apiUrl,
            @Value("${nvidia.api.key:}") String apiKey,
            @Value("${nvidia.embedding.model:nvidia/nemotron-3-embed-1b}") String model) {
        this.mapper = mapper;
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.model = model;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public float[] embedQuery(String text) {
        return embed(text, "query");
    }

    public float[] embedPassage(String text) {
        return embed(text, "passage");
    }

    private float[] embed(String text, String inputType) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "Set the NVIDIA_API_KEY environment variable");
        }

        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException(
                    "Text to embed must not be blank");
        }

        Map<String, Object> request = Map.of(
                "input", List.of(text),
                "model", model,
                "input_type", inputType,
                "encoding_format", "float"
        );

        try {
            String response = client.post()
                    .uri(apiUrl)
                    .headers(headers -> headers.setBearerAuth(apiKey))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(String.class);

            JsonNode embedding = mapper.readTree(response)
                    .path("data").path(0).path("embedding");

            if (!embedding.isArray() || embedding.isEmpty()) {
                throw new IllegalStateException(
                        "NVIDIA returned an invalid embedding");
            }

            float[] vector = new float[embedding.size()];

            for (int i = 0; i < embedding.size(); i++) {
                if (!embedding.get(i).isNumber()) {
                    throw new IllegalStateException(
                            "Invalid embedding value");
                }

                vector[i] = embedding.get(i).floatValue();

                if (!Float.isFinite(vector[i])) {
                    throw new IllegalStateException(
                            "Non-finite embedding value");
                }
            }

            return vector;

        } catch (Exception e) {
            log.warn("NVIDIA embedding API error: {}", e.getMessage());
            throw new IllegalStateException(
                    "Failed to generate NVIDIA embedding", e);
        }
    }

    public double cosineSimilarity(float[] a, float[] b) {
        if (a == null || b == null ||
                a.length == 0 || a.length != b.length) {
            return 0.0;
        }

        double dot = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < a.length; i++) {
            dot += (double) a[i] * b[i];
            normA += (double) a[i] * a[i];
            normB += (double) b[i] * b[i];
        }

        if (normA == 0 || normB == 0) {
            return 0.0;
        }

        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    public String serialize(float[] vector) {
        try {
            return mapper.writeValueAsString(vector);
        } catch (Exception e) {
            throw new IllegalStateException(
                    "Could not serialize embedding", e);
        }
    }

    public float[] deserialize(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }

        try {
            JsonNode array = mapper.readTree(json);

            if (!array.isArray() || array.isEmpty()) {
                return null;
            }

            float[] vector = new float[array.size()];

            for (int i = 0; i < array.size(); i++) {
                if (!array.get(i).isNumber()) {
                    return null;
                }

                vector[i] = array.get(i).floatValue();

                if (!Float.isFinite(vector[i])) {
                    return null;
                }
            }

            return vector;

        } catch (Exception e) {
            return null;
        }
    }

    public String getModel() {
        return model;
    }
}
