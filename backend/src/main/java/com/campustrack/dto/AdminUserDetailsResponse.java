package com.campustrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDetailsResponse {
    private UserDTO user;
    private List<ItemResponse> items;
    private long totalItems;
    private long lostCount;
    private long foundCount;
    private long resolvedCount;
}
