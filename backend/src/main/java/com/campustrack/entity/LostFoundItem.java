package com.campustrack.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "lost_found_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LostFoundItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String type; // 'LOST' | 'FOUND'

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_reported")
    private LocalDate dateReported;

    private String location;

    @Column(name = "image_url")
    private String imageUrl;

    private String category;

    @Column(columnDefinition = "TEXT")
    private String tags; // comma-separated lowercase tags

    @Builder.Default
    @Column(nullable = false)
    private String status = "OPEN"; // 'OPEN' | 'MATCHED' | 'RESOLVED' | 'REMOVED'

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Lob
    @Column(name = "embedding_json", columnDefinition = "LONGTEXT")
    private String embeddingJson;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(name = "embedding_model_version", length = 160)
    private String embeddingModelVersion;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.dateReported == null) {
            this.dateReported = LocalDate.now();
        }
        if (this.status == null) {
            this.status = "OPEN";
        }
    }

    public String toEmbeddingText() {
        return "Item: " + safe(title)
                + ". Description: " + safe(description)
                + ". Category: " + safe(category)
                + ". Tags: " + safe(tags)
                + ". Location: " + safe(location);
    }

    private static String safe(String value) {
        return value == null || value.isBlank()
                ? "not specified"
                : value.trim();
    }
}
