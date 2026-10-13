package com.campustrack.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateItemRequest {
    @NotBlank(message = "Type (LOST or FOUND) is required")
    private String type; // 'LOST' | 'FOUND'

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private LocalDate dateReported;
    private String location;
    private String category;
    private String tags;
    private String imageUrl;
}
