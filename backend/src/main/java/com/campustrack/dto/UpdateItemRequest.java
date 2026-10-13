package com.campustrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateItemRequest {
    private String title;
    private String description;
    private LocalDate dateReported;
    private String location;
    private String category;
    private String tags;
    private String imageUrl;
    private String status; // 'OPEN' | 'MATCHED' | 'RESOLVED' | 'REMOVED'
}
