package com.campustrack.service;

import com.campustrack.dto.ItemDTOs.ItemResponse;
import com.campustrack.entity.Bookmark;
import com.campustrack.entity.LostFoundItem;
import com.campustrack.entity.User;
import com.campustrack.exception.CustomExceptions.*;
import com.campustrack.mapper.ItemMapper;
import com.campustrack.repository.BookmarkRepository;
import com.campustrack.repository.ItemRepository;
import com.campustrack.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final ItemRepository itemRepository;
    private final MatchRepository matchRepository;
    private final AuthService authService;
    private final ItemMapper itemMapper;

    @Transactional
    public void addBookmark(Long itemId) {
        User currentUser = authService.getCurrentUserEntity();
        LostFoundItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemId));

        if (!bookmarkRepository.existsByUserIdAndItemId(currentUser.getId(), itemId)) {
            Bookmark bookmark = Bookmark.builder()
                    .user(currentUser)
                    .item(item)
                    .createdAt(LocalDateTime.now())
                    .build();
            bookmarkRepository.save(bookmark);
            log.info("User {} bookmarked item #{}", currentUser.getEmail(), itemId);
        }
    }

    @Transactional
    public void removeBookmark(Long itemId) {
        User currentUser = authService.getCurrentUserEntity();
        bookmarkRepository.deleteByUserIdAndItemId(currentUser.getId(), itemId);
        log.info("User {} removed bookmark on item #{}", currentUser.getEmail(), itemId);
    }

    @Transactional(readOnly = true)
    public List<ItemResponse> getUserBookmarkedItems() {
        User currentUser = authService.getCurrentUserEntity();
        List<Bookmark> bookmarks = bookmarkRepository.findByUserIdWithItem(currentUser.getId());

        return bookmarks.stream()
                .map(b -> {
                    LostFoundItem item = b.getItem();
                    int matchCount = matchRepository.findMatchesByItemId(item.getId()).size();
                    return itemMapper.toResponse(item, currentUser.getId(), matchCount);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isItemBookmarked(Long itemId) {
        User currentUser = authService.getCurrentUserEntity();
        return bookmarkRepository.existsByUserIdAndItemId(currentUser.getId(), itemId);
    }
}
