package com.campustrack.mapper;

import com.campustrack.dto.ItemResponse;
import com.campustrack.entity.LostFoundItem;
import org.springframework.stereotype.Component;

/**
 * Mapper component responsible for converting LostFoundItem entities to ItemResponse DTOs.
 * Adheres to Single Responsibility Principle (SRP) by decoupling domain entity transformation
 * from business service logic.
 */
@Component
public class ItemMapper {

    public ItemResponse toResponse(LostFoundItem item, Long currentUserId, int matchCount) {
        if (item == null) {
            return null;
        }

        boolean isOwner = currentUserId != null 
                && item.getUser() != null 
                && item.getUser().getId().equals(currentUserId);

        return ItemResponse.builder()
                .id(item.getId())
                .type(item.getType())
                .title(item.getTitle())
                .description(item.getDescription())
                .dateReported(item.getDateReported())
                .location(item.getLocation())
                .imageUrl(item.getImageUrl())
                .category(item.getCategory())
                .tags(item.getTags())
                .status(item.getStatus())
                .createdAt(item.getCreatedAt())
                .userId(item.getUser() != null ? item.getUser().getId() : null)
                .userName(item.getUser() != null ? item.getUser().getName() : "Anonymous")
                .isOwner(isOwner)
                .matchCount(matchCount)
                .build();
    }
}
