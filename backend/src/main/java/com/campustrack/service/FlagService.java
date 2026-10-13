package com.campustrack.service;

import com.campustrack.dto.*;
import com.campustrack.entity.Flag;
import com.campustrack.entity.LostFoundItem;
import com.campustrack.entity.User;
import com.campustrack.entity.enums.ItemStatus;
import com.campustrack.exception.CustomExceptions.*;
import com.campustrack.mapper.FlagMapper;
import com.campustrack.repository.FlagRepository;
import com.campustrack.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service managing user reports and moderation flags.
 * Single Responsibility: Handle flag creation, moderation review queue retrieval, and resolution actions.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FlagService {

    private final FlagRepository flagRepository;
    private final ItemRepository itemRepository;
    private final FlagMapper flagMapper;

    @Transactional
    public FlagResponse createFlag(CreateFlagRequest request, User currentUser) {
        LostFoundItem item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + request.getItemId()));

        Flag flag = Flag.builder()
                .item(item)
                .reportedBy(currentUser)
                .reason(request.getReason().trim())
                .reviewed(false)
                .createdAt(LocalDateTime.now())
                .build();

        Flag saved = flagRepository.save(flag);
        log.info("User #{} flagged item #{} for review", currentUser.getId(), item.getId());
        return flagMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<FlagResponse> getUnreviewedFlags() {
        return flagRepository.findByReviewedFalseOrderByCreatedAtDesc().stream()
                .map(flagMapper::toResponse)
                .toList();
    }

    @Transactional
    public FlagResponse resolveFlag(Long flagId, ResolveFlagRequest request) {
        Flag flag = flagRepository.findById(flagId)
                .orElseThrow(() -> new ResourceNotFoundException("Flag not found with id: " + flagId));

        flag.setReviewed(true);
        Flag saved = flagRepository.save(flag);

        if (request.isRemoveItem() && flag.getItem() != null) {
            flag.getItem().setStatus(ItemStatus.REMOVED.name());
            itemRepository.save(flag.getItem());
            log.info("Admin soft-deleted item {} during flag resolution", flag.getItem().getId());
        }

        return flagMapper.toResponse(saved);
    }
}
