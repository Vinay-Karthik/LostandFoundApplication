package com.campustrack.service;

import com.campustrack.dto.*;
import com.campustrack.entity.LostFoundItem;
import com.campustrack.entity.User;
import com.campustrack.entity.enums.ItemStatus;
import com.campustrack.entity.enums.ItemType;
import com.campustrack.entity.enums.Role;
import com.campustrack.exception.CustomExceptions.*;
import com.campustrack.mapper.ItemMapper;
import com.campustrack.repository.ItemRepository;
import com.campustrack.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ItemService {

    private final ItemRepository itemRepository;
    private final MatchRepository matchRepository;
    private final com.campustrack.repository.BookmarkRepository bookmarkRepository;
    private final com.campustrack.repository.FlagRepository flagRepository;
    private final MatchingService matchingService;
    private final ImageStorageService imageStorageService;
    private final ItemMapper itemMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final NemotronEmbeddingService nemotronEmbeddingService;

    public static final List<String> SEED_CATEGORIES = List.of(
            "Electronics", "Documents", "Clothing", "Accessories", "Keys", "Bags", "Other"
    );

    @Transactional
    public ItemResponse createItem(CreateItemRequest request, MultipartFile imageFile, User currentUser) {
        if (currentUser == null) {
            throw new UnauthorizedException("You must be logged in to post an item");
        }

        if (!Boolean.TRUE.equals(currentUser.getVerified()) && !Role.ADMIN.name().equalsIgnoreCase(currentUser.getRole())) {
            throw new ForbiddenException("Your account is pending verification by campus administration. You cannot post items yet.");
        }

        String imageUrl = request.getImageUrl();
        if (imageFile != null && !imageFile.isEmpty()) {
            imageUrl = imageStorageService.storeImage(imageFile);
        }

        String normalizedTags = normalizeTags(request.getTags());
        String itemType = ItemType.fromString(request.getType()) != null 
                ? ItemType.fromString(request.getType()).name() 
                : ItemType.LOST.name();

        LostFoundItem item = LostFoundItem.builder()
                .user(currentUser)
                .type(itemType)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .dateReported(request.getDateReported() != null ? request.getDateReported() : LocalDate.now())
                .location(request.getLocation() != null ? request.getLocation().trim() : null)
                .category(request.getCategory() != null ? request.getCategory().trim() : "Other")
                .tags(normalizedTags)
                .imageUrl(imageUrl)
                .status(ItemStatus.OPEN.name())
                .createdAt(LocalDateTime.now())
                .build();

        // Generate semantic embedding via Nemotron (if configured)
        generateAndSetEmbedding(item);

        LostFoundItem savedItem = itemRepository.save(item);

        // Run smart matching against opposite type items
        try {
            matchingService.findAndCreateMatches(savedItem);
        } catch (Exception e) {
            log.error("Failed to run matching service for item {}: {}", savedItem.getId(), e.getMessage());
        }

        ItemResponse response = mapToResponse(savedItem, currentUser.getId());

        // Broadcast real-time item creation event to all active clients
        try {
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/items", response);
            }
        } catch (Exception e) {
            log.warn("Failed to broadcast item creation over WebSocket: {}", e.getMessage());
        }

        return response;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ItemResponse> getItems(
            String type, String category, String status, String location, String tag, String search,
            int page, int size, Long currentUserId) {

        Pageable pageable = PageRequest.of(page, size);
        Page<LostFoundItem> itemPage = itemRepository.findItemsWithFilters(
                (type != null && !type.isBlank()) ? type.toUpperCase().trim() : null,
                (category != null && !category.isBlank()) ? category.trim() : null,
                (status != null && !status.isBlank()) ? status.toUpperCase().trim() : null,
                (location != null && !location.isBlank()) ? location.trim() : null,
                (tag != null && !tag.isBlank()) ? tag.toLowerCase().trim() : null,
                (search != null && !search.isBlank()) ? search.trim() : null,
                pageable
        );

        List<ItemResponse> content = itemPage.getContent().stream()
                .map(item -> mapToResponse(item, currentUserId))
                .toList();

        return PagedResponse.<ItemResponse>builder()
                .content(content)
                .page(itemPage.getNumber())
                .size(itemPage.getSize())
                .totalElements(itemPage.getTotalElements())
                .totalPages(itemPage.getTotalPages())
                .last(itemPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public ItemResponse getItemById(Long id, Long currentUserId) {
        LostFoundItem item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));

        if (ItemStatus.REMOVED.name().equalsIgnoreCase(item.getStatus()) &&
                (currentUserId == null || !item.getUser().getId().equals(currentUserId))) {
            throw new ResourceNotFoundException("Item has been removed");
        }

        return mapToResponse(item, currentUserId);
    }

    @Transactional
    public ItemResponse updateItem(Long id, UpdateItemRequest request, MultipartFile imageFile, User currentUser) {
        LostFoundItem item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));

        boolean isOwner = item.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = Role.ADMIN.name().equalsIgnoreCase(currentUser.getRole());

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You are not allowed to edit this item");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            item.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            item.setDescription(request.getDescription());
        }
        if (request.getDateReported() != null) {
            item.setDateReported(request.getDateReported());
        }
        if (request.getLocation() != null) {
            item.setLocation(request.getLocation().trim());
        }
        if (request.getCategory() != null) {
            item.setCategory(request.getCategory().trim());
        }
        if (request.getTags() != null) {
            item.setTags(normalizeTags(request.getTags()));
        }
        if (request.getStatus() != null) {
            ItemStatus parsedStatus = ItemStatus.fromString(request.getStatus());
            if (parsedStatus != null) {
                item.setStatus(parsedStatus.name());
            }
        }

        if (imageFile != null && !imageFile.isEmpty()) {
            item.setImageUrl(imageStorageService.storeImage(imageFile));
        } else if (request.getImageUrl() != null) {
            item.setImageUrl(request.getImageUrl());
        }

        // Refresh semantic embedding when item details are updated
        generateAndSetEmbedding(item);

        LostFoundItem saved = itemRepository.save(item);

        if (ItemStatus.OPEN.name().equalsIgnoreCase(saved.getStatus())) {
            matchingService.findAndCreateMatches(saved);
        }

        return mapToResponse(saved, currentUser.getId());
    }

    @Transactional(readOnly = true)
    public List<ItemResponse> getMyItems(Long userId) {
        List<LostFoundItem> items = itemRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return items.stream()
                .map(i -> mapToResponse(i, userId))
                .toList();
    }

    @Transactional
    public void deleteItem(Long id, User currentUser) {
        LostFoundItem item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));

        boolean isOwner = currentUser != null && item.getUser() != null && item.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser != null && Role.ADMIN.name().equalsIgnoreCase(currentUser.getRole());

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You are not authorized to delete this item");
        }

        bookmarkRepository.deleteByItemId(id);
        flagRepository.deleteByItemId(id);
        matchRepository.deleteMatchesByItemId(id);

        itemRepository.delete(item);
        log.info("User {} deleted item #{} ('{}')", currentUser != null ? currentUser.getEmail() : "system", id, item.getTitle());
    }

    public List<String> getCategories() {
        return SEED_CATEGORIES;
    }

    private ItemResponse mapToResponse(LostFoundItem item, Long currentUserId) {
        int matchCount = matchRepository.findMatchesByItemId(item.getId()).size();
        return itemMapper.toResponse(item, currentUserId, matchCount);
    }

    private void generateAndSetEmbedding(LostFoundItem item) {
        if (nemotronEmbeddingService == null || !nemotronEmbeddingService.isConfigured()) {
            return;
        }

        try {
            float[] vector = "LOST".equalsIgnoreCase(item.getType())
                    ? nemotronEmbeddingService.embedQuery(item.toEmbeddingText())
                    : nemotronEmbeddingService.embedPassage(item.toEmbeddingText());

            item.setEmbeddingJson(nemotronEmbeddingService.serialize(vector));
            item.setEmbeddingModelVersion(nemotronEmbeddingService.getModel());
            log.info("Generated Nemotron embedding for item '{}' ({})", item.getTitle(), item.getType());
        } catch (Exception e) {
            log.warn("Could not generate Nemotron embedding for item '{}': {}. Proceeding with rule-based matching.",
                    item.getTitle(), e.getMessage());
            item.setEmbeddingJson(null);
            item.setEmbeddingModelVersion(null);
        }
    }

    private String normalizeTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return "";
        }
        return Arrays.stream(tags.split("[,\\s]+"))
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(s -> !s.isEmpty())
                .distinct()
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
    }
}
