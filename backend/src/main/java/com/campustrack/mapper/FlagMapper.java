package com.campustrack.mapper;

import com.campustrack.dto.FlagDTOs.FlagResponse;
import com.campustrack.entity.Flag;
import org.springframework.stereotype.Component;

/**
 * Mapper component for Flag entity to FlagResponse DTO.
 */
@Component
public class FlagMapper {

    public FlagResponse toResponse(Flag flag) {
        if (flag == null) {
            return null;
        }

        return FlagResponse.builder()
                .id(flag.getId())
                .itemId(flag.getItem() != null ? flag.getItem().getId() : null)
                .itemTitle(flag.getItem() != null ? flag.getItem().getTitle() : "[Deleted Item]")
                .itemType(flag.getItem() != null ? flag.getItem().getType() : "")
                .itemImageUrl(flag.getItem() != null ? flag.getItem().getImageUrl() : null)
                .reportedById(flag.getReportedBy() != null ? flag.getReportedBy().getId() : null)
                .reportedByName(flag.getReportedBy() != null ? flag.getReportedBy().getName() : "Anonymous")
                .reason(flag.getReason())
                .reviewed(Boolean.TRUE.equals(flag.getReviewed()))
                .createdAt(flag.getCreatedAt())
                .build();
    }
}
