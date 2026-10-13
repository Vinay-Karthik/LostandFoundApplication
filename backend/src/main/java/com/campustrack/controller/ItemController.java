package com.campustrack.controller;

import com.campustrack.dto.*;
import com.campustrack.entity.User;
import com.campustrack.security.UserDetailsImpl;
import com.campustrack.service.AuthService;
import com.campustrack.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;
    private final AuthService authService;

    @PostMapping(value = "/items", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<ApiResponse<ItemResponse>> createItemMultipart(
            @RequestParam("type") String type,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "dateReported", required = false) String dateReportedStr,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam(value = "imageUrl", required = false) String imageUrl,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) {

        LocalDate dateReported = null;
        if (dateReportedStr != null && !dateReportedStr.isBlank()) {
            try {
                dateReported = LocalDate.parse(dateReportedStr);
            } catch (Exception ignored) {}
        }

        CreateItemRequest request = CreateItemRequest.builder()
                .type(type)
                .title(title)
                .description(description)
                .dateReported(dateReported)
                .location(location)
                .category(category)
                .tags(tags)
                .imageUrl(imageUrl)
                .build();

        User currentUser = authService.getCurrentUserEntity();
        ItemResponse response = itemService.createItem(request, imageFile, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Item posted successfully", response));
    }

    @PostMapping(value = "/items", consumes = {MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<ApiResponse<ItemResponse>> createItemJson(
            @Valid @RequestBody CreateItemRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        ItemResponse response = itemService.createItem(request, null, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Item posted successfully", response));
    }

    @GetMapping("/items")
    public ResponseEntity<ApiResponse<PagedResponse<ItemResponse>>> getItems(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "tags", required = false) String tag,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "12") int size,
            Authentication authentication) {

        Long currentUserId = null;
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl userDetails) {
            currentUserId = userDetails.getId();
        }

        PagedResponse<ItemResponse> response = itemService.getItems(type, category, status, location, tag, search, page, size, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<ApiResponse<ItemResponse>> getItemById(
            @PathVariable("id") Long id,
            Authentication authentication) {
        Long currentUserId = null;
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl userDetails) {
            currentUserId = userDetails.getId();
        }
        ItemResponse response = itemService.getItemById(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping(value = "/items/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<ApiResponse<ItemResponse>> updateItemMultipart(
            @PathVariable("id") Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "dateReported", required = false) String dateReportedStr,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam(value = "imageUrl", required = false) String imageUrl,
            @RequestParam(value = "status", required = false) String status,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) {

        LocalDate dateReported = null;
        if (dateReportedStr != null && !dateReportedStr.isBlank()) {
            try {
                dateReported = LocalDate.parse(dateReportedStr);
            } catch (Exception ignored) {}
        }

        UpdateItemRequest request = UpdateItemRequest.builder()
                .title(title)
                .description(description)
                .dateReported(dateReported)
                .location(location)
                .category(category)
                .tags(tags)
                .imageUrl(imageUrl)
                .status(status)
                .build();

        User currentUser = authService.getCurrentUserEntity();
        ItemResponse response = itemService.updateItem(id, request, imageFile, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Item updated successfully", response));
    }

    @PatchMapping(value = "/items/{id}", consumes = {MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<ApiResponse<ItemResponse>> updateItemJson(
            @PathVariable("id") Long id,
            @RequestBody UpdateItemRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        ItemResponse response = itemService.updateItem(id, request, null, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Item updated successfully", response));
    }

    @GetMapping("/items/my-items")
    public ResponseEntity<ApiResponse<List<ItemResponse>>> getMyItems() {
        User currentUser = authService.getCurrentUserEntity();
        List<ItemResponse> response = itemService.getMyItems(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<ApiResponse<String>> deleteItem(@PathVariable("id") Long id) {
        User currentUser = authService.getCurrentUserEntity();
        itemService.deleteItem(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Item deleted successfully", "SUCCESS"));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.ok(itemService.getCategories()));
    }
}
