package com.campustrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemResponse {
    private Long id;
    private String type;
    private String title;
    private String description;
    private LocalDate dateReported;
    private String location;
    private String imageUrl;
    private String category;
    private String tags;
    private String status;
    private LocalDateTime createdAt;
    private Long userId;
    private String userName;
    private boolean isOwner;
    private int matchCount;
}
