package com.campustrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlagResponse {
    private Long id;
    private Long itemId;
    private String itemTitle;
    private String itemType;
    private String itemImageUrl;
    private Long reportedById;
    private String reportedByName;
    private String reason;
    private boolean reviewed;
    private LocalDateTime createdAt;
}
