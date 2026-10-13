package com.campustrack.mapper;

import com.campustrack.dto.MatchDTOs.MatchResponse;
import com.campustrack.entity.LostFoundItem;
import com.campustrack.entity.Match;
import org.springframework.stereotype.Component;

/**
 * Mapper component for Match entity to MatchResponse DTO.
 */
@Component
public class MatchMapper {

    public MatchResponse toResponse(Match match, Long currentUserId) {
        if (match == null) {
            return null;
        }

        LostFoundItem lostItem = match.getLostItem();
        LostFoundItem foundItem = match.getFoundItem();

        boolean isInvolved = currentUserId != null && (
                (lostItem != null && lostItem.getUser() != null && lostItem.getUser().getId().equals(currentUserId)) ||
                (foundItem != null && foundItem.getUser() != null && foundItem.getUser().getId().equals(currentUserId))
        );

        float score = match.getMatchScore() != null ? match.getMatchScore() : 0.0f;
        int percentage = Math.round(score * 100);

        return MatchResponse.builder()
                .id(match.getId())
                .lostItemId(lostItem != null ? lostItem.getId() : null)
                .lostItemTitle(lostItem != null ? lostItem.getTitle() : "Unknown")
                .lostItemCategory(lostItem != null ? lostItem.getCategory() : "General")
                .lostItemLocation(lostItem != null ? lostItem.getLocation() : null)
                .lostItemImageUrl(lostItem != null ? lostItem.getImageUrl() : null)
                .lostItemOwnerId(lostItem != null && lostItem.getUser() != null ? lostItem.getUser().getId() : null)
                .lostItemOwnerName(lostItem != null && lostItem.getUser() != null ? lostItem.getUser().getName() : "Anonymous")
                .foundItemId(foundItem != null ? foundItem.getId() : null)
                .foundItemTitle(foundItem != null ? foundItem.getTitle() : "Unknown")
                .foundItemCategory(foundItem != null ? foundItem.getCategory() : "General")
                .foundItemLocation(foundItem != null ? foundItem.getLocation() : null)
                .foundItemImageUrl(foundItem != null ? foundItem.getImageUrl() : null)
                .foundItemOwnerId(foundItem != null && foundItem.getUser() != null ? foundItem.getUser().getId() : null)
                .foundItemOwnerName(foundItem != null && foundItem.getUser() != null ? foundItem.getUser().getName() : "Anonymous")
                .matchScore(score)
                .matchPercentage(percentage)
                .status(match.getStatus())
                .createdAt(match.getCreatedAt())
                .isUserInvolved(isInvolved)
                .build();
    }
}
