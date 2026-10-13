package com.campustrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFlagRequest {
    @NotNull(message = "Item ID is required")
    private Long itemId;

    @NotBlank(message = "Reason is required")
    private String reason;
}
