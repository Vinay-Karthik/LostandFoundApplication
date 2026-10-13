package com.campustrack.controller;

import com.campustrack.dto.ApiResponse;
import com.campustrack.dto.ItemResponse;
import com.campustrack.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @PostMapping("/{itemId}")
    public ResponseEntity<ApiResponse<String>> addBookmark(@PathVariable("itemId") Long itemId) {
        bookmarkService.addBookmark(itemId);
        return ResponseEntity.ok(ApiResponse.ok("Item added to saved bookmarks", "BOOKMARKED"));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<ApiResponse<String>> removeBookmark(@PathVariable("itemId") Long itemId) {
        bookmarkService.removeBookmark(itemId);
        return ResponseEntity.ok(ApiResponse.ok("Item removed from bookmarks", "UNBOOKMARKED"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ItemResponse>>> getUserBookmarks() {
        return ResponseEntity.ok(ApiResponse.ok(bookmarkService.getUserBookmarkedItems()));
    }

    @GetMapping("/check/{itemId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkBookmarkStatus(@PathVariable("itemId") Long itemId) {
        boolean bookmarked = bookmarkService.isItemBookmarked(itemId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("bookmarked", bookmarked)));
    }
}
