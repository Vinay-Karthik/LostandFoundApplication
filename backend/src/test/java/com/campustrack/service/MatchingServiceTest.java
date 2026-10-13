package com.campustrack.service;

import com.campustrack.entity.LostFoundItem;
import com.campustrack.entity.User;
import com.campustrack.mapper.MatchMapper;
import com.campustrack.matching.*;
import com.campustrack.repository.ItemRepository;
import com.campustrack.repository.MatchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class MatchingServiceTest {

    @Mock
    private MatchRepository matchRepository;

    @Mock
    private ItemRepository itemRepository;

    private MatchingService matchingService;
    private TitleSimilarityRule titleRule;

    @BeforeEach
    void setUp() {
        MatchMapper matchMapper = new MatchMapper();
        titleRule = new TitleSimilarityRule();
        List<MatchingRule> rules = List.of(
                titleRule,
                new DescriptionSimilarityRule(),
                new CategoryMatchRule(),
                new TagOverlapRule(),
                new LocationSimilarityRule()
        );
        matchingService = new MatchingService(matchRepository, itemRepository, matchMapper, rules, null);
    }

    @Test
    @DisplayName("Fuzzy matching should match misspelled word 'walet' with 'wallet'")
    void testMisspelledWalletMatch() {
        LostFoundItem item1 = LostFoundItem.builder().title("Brown leather walet").build();
        LostFoundItem item2 = LostFoundItem.builder().title("Brown Leather Wallet").build();
        double similarity = titleRule.computeScore(item1, item2);
        assertTrue(similarity > 0.80, "Expected similarity > 0.80 for 'walet' vs 'wallet', got: " + similarity);
    }

    @Test
    @DisplayName("Fuzzy matching should handle 'macbook' vs 'MacBook Pro 14'")
    void testMacbookMatch() {
        LostFoundItem item1 = LostFoundItem.builder().title("MacBook Pro 14 Space Gray").build();
        LostFoundItem item2 = LostFoundItem.builder().title("Apple Macbook Laptop").build();
        double similarity = titleRule.computeScore(item1, item2);
        assertTrue(similarity >= 0.20, "Expected positive token match for macbook, got: " + similarity);
    }

    @Test
    @DisplayName("Matching calculation for matching items should score above threshold >= 0.4")
    void testCombinedMatchingScore() {
        User user1 = User.builder().id(1L).name("User A").email("a@university.edu").role("STUDENT").verified(true).build();
        User user2 = User.builder().id(2L).name("User B").email("b@university.edu").role("STUDENT").verified(true).build();

        LostFoundItem lostItem = LostFoundItem.builder()
                .id(101L)
                .user(user1)
                .type("LOST")
                .title("Blue HydroFlask water bottle")
                .description("32oz blue bottle with campus sticker left at library")
                .category("Accessories")
                .tags("bottle, hydroflask, blue")
                .location("Main Library")
                .dateReported(LocalDate.now())
                .status("OPEN")
                .build();

        LostFoundItem foundItem = LostFoundItem.builder()
                .id(102L)
                .user(user2)
                .type("FOUND")
                .title("Blue Hydro Flask Bottle")
                .description("Found blue metal bottle in library 1st floor")
                .category("Accessories")
                .tags("bottle, hydroflask, water")
                .location("Library")
                .dateReported(LocalDate.now())
                .status("OPEN")
                .build();

        float score = matchingService.calculateMatchScore(lostItem, foundItem);
        assertTrue(score >= 0.60f, "Expected high match score (>= 0.60), got: " + score);
    }

    @Test
    @DisplayName("Completely different items should have very low score")
    void testUnrelatedItemsScore() {
        LostFoundItem lostKeys = LostFoundItem.builder()
                .id(103L)
                .type("LOST")
                .title("Toyota Car Key Fob")
                .description("Black remote key")
                .category("Keys")
                .tags("car, key")
                .location("Parking Lot B")
                .build();

        LostFoundItem foundCoat = LostFoundItem.builder()
                .id(104L)
                .type("FOUND")
                .title("Red Winter Jacket")
                .description("Heavy red winter coat size M")
                .category("Clothing")
                .tags("jacket, coat, red")
                .location("Gym")
                .build();

        float score = matchingService.calculateMatchScore(lostKeys, foundCoat);
        assertTrue(score < 0.20f, "Expected low score for unrelated items, got: " + score);
    }

    @Test
    @DisplayName("An item must never match with itself (score must be 0.0)")
    void testItemCannotMatchWithItself() {
        LostFoundItem item = LostFoundItem.builder()
                .id(10L)
                .type("LOST")
                .title("Earphones")
                .description("Bluetooth headphone")
                .category("Electronics")
                .location("Auditorium")
                .build();

        float score = matchingService.calculateMatchScore(item, item);
        assertEquals(0.0f, score, "An item compared to itself must always return 0.0 score");
    }

    @Test
    @DisplayName("Items of the same type (LOST vs LOST) must never match")
    void testSameTypeCannotMatch() {
        LostFoundItem lost1 = LostFoundItem.builder()
                .id(10L)
                .type("LOST")
                .title("Earphones")
                .category("Electronics")
                .build();

        LostFoundItem lost2 = LostFoundItem.builder()
                .id(20L)
                .type("LOST")
                .title("Earphones")
                .category("Electronics")
                .build();

        float score = matchingService.calculateMatchScore(lost1, lost2);
        assertEquals(0.0f, score, "Items of the same type must return 0.0 score");
    }
}
