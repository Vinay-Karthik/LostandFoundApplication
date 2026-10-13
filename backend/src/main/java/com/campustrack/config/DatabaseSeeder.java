package com.campustrack.config;

import com.campustrack.entity.LostFoundItem;
import com.campustrack.entity.User;
import com.campustrack.entity.enums.ItemStatus;
import com.campustrack.entity.enums.ItemType;
import com.campustrack.entity.enums.Role;
import com.campustrack.repository.ItemRepository;
import com.campustrack.repository.UserRepository;
import com.campustrack.service.MatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final MatchingService matchingService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (itemRepository.count() < 5) {
            log.info("Populating database with rich, realistic campus seed data...");
            seedData();
        }
    }

    public synchronized void seedData() {
        // ----------------------------------------------------
        // 1. SEED REALISTIC USERS & AVATARS
        // ----------------------------------------------------
        User admin = userRepository.findByEmail("admin@university.edu").orElseGet(() -> {
            User u = User.builder()
                    .name("Campus Administrator")
                    .email("admin@university.edu")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ADMIN.name())
                    .verified(true)
                    .suspended(false)
                    .avatarUrl("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80")
                    .createdAt(LocalDateTime.now().minusDays(45))
                    .build();
            return userRepository.save(u);
        });

        User alex = userRepository.findByEmail("alex@university.edu").orElseGet(() -> {
            User u = User.builder()
                    .name("Alex Johnson")
                    .email("alex@university.edu")
                    .password(passwordEncoder.encode("Student@123"))
                    .role(Role.STUDENT.name())
                    .verified(true)
                    .suspended(false)
                    .avatarUrl("https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80")
                    .createdAt(LocalDateTime.now().minusDays(30))
                    .build();
            return userRepository.save(u);
        });

        User sarah = userRepository.findByEmail("sarah@university.edu").orElseGet(() -> {
            User u = User.builder()
                    .name("Sarah Williams")
                    .email("sarah@university.edu")
                    .password(passwordEncoder.encode("Student@123"))
                    .role(Role.STUDENT.name())
                    .verified(true)
                    .suspended(false)
                    .avatarUrl("https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80")
                    .createdAt(LocalDateTime.now().minusDays(25))
                    .build();
            return userRepository.save(u);
        });

        User david = userRepository.findByEmail("david@university.edu").orElseGet(() -> {
            User u = User.builder()
                    .name("David Miller")
                    .email("david@university.edu")
                    .password(passwordEncoder.encode("Student@123"))
                    .role(Role.STUDENT.name())
                    .verified(true)
                    .suspended(false)
                    .avatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80")
                    .createdAt(LocalDateTime.now().minusDays(20))
                    .build();
            return userRepository.save(u);
        });

        User emily = userRepository.findByEmail("emily@university.edu").orElseGet(() -> {
            User u = User.builder()
                    .name("Emily Chen")
                    .email("emily@university.edu")
                    .password(passwordEncoder.encode("Student@123"))
                    .role(Role.STUDENT.name())
                    .verified(true)
                    .suspended(false)
                    .avatarUrl("https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80")
                    .createdAt(LocalDateTime.now().minusDays(15))
                    .build();
            return userRepository.save(u);
        });

        User marcus = userRepository.findByEmail("marcus@university.edu").orElseGet(() -> {
            User u = User.builder()
                    .name("Marcus Thorne")
                    .email("marcus@university.edu")
                    .password(passwordEncoder.encode("Student@123"))
                    .role(Role.STUDENT.name())
                    .verified(false)
                    .suspended(false)
                    .avatarUrl("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80")
                    .createdAt(LocalDateTime.now().minusDays(2))
                    .build();
            return userRepository.save(u);
        });

        // ----------------------------------------------------
        // 2. SEED REALISTIC LOST & FOUND ITEMS (ALL CATEGORIES)
        // ----------------------------------------------------
        List<LostFoundItem> itemsToSeed = new ArrayList<>();

        // Item 1: Lost MacBook
        itemsToSeed.add(LostFoundItem.builder()
                .user(alex)
                .type(ItemType.LOST.name())
                .title("Apple MacBook Pro 14-inch Space Gray")
                .description("Left my MacBook Pro on the 2nd-floor study pod in the Main Library. Has a distinct React/GitHub sticker on the top shell.")
                .dateReported(LocalDate.now().minusDays(2))
                .location("Main Library - 2nd Floor Study Pod")
                .category("Electronics")
                .tags("macbook, laptop, apple, computer, electronics")
                .imageUrl("https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80")
                .status(ItemStatus.OPEN.name())
                .createdAt(LocalDateTime.now().minusDays(2))
                .build());

        // Item 2: Found MacBook (Counterpart Match)
        itemsToSeed.add(LostFoundItem.builder()
                .user(sarah)
                .type(ItemType.FOUND.name())
                .title("Space Gray Apple MacBook Laptop")
                .description("Found an Apple MacBook Pro left unattended near the library 2nd-floor quiet study area. Safely handed to the front desk librarian.")
                .dateReported(LocalDate.now().minusDays(1))
                .location("Main Library - Front Circulation Desk")
                .category("Electronics")
                .tags("macbook, apple, laptop, gray, computer")
                .imageUrl("https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80")
                .status(ItemStatus.OPEN.name())
                .createdAt(LocalDateTime.now().minusDays(1))
                .build());

        // Item 3: Lost AirPods Pro 2
        itemsToSeed.add(LostFoundItem.builder()
                .user(emily)
                .type(ItemType.LOST.name())
                .title("AirPods Pro 2 in White Charging Case")
                .description("Lost my Apple AirPods Pro wireless earbuds somewhere between the Student Activity Center and Cafeteria courtyard.")
                .dateReported(LocalDate.now().minusDays(3))
                .location("Student Activity Center")
                .category("Electronics")
                .tags("airpods, apple, earbuds, headphones, white")
                .imageUrl("https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80")
                .status(ItemStatus.OPEN.name())
                .createdAt(LocalDateTime.now().minusDays(3))
                .build());

        // Item 4: Found AirPods (Counterpart Match)
        itemsToSeed.add(LostFoundItem.builder()
                .user(david)
                .type(ItemType.FOUND.name())
                .title("Apple AirPods Pro Earbuds in Case")
                .description("Found a white AirPods Pro charging case on a wooden bench outside the campus cafeteria.")
                .dateReported(LocalDate.now().minusDays(2))
                .location("Campus Cafeteria Courtyard")
                .category("Electronics")
                .tags("airpods, apple, earbuds, audio, headphones")
                .imageUrl("https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&w=800&q=80")
                .status(ItemStatus.OPEN.name())
                .createdAt(LocalDateTime.now().minusDays(2))
                .build());

        // Item 5: Lost Honda Car Keys
        itemsToSeed.add(LostFoundItem.builder()
                .user(sarah)
                .type(ItemType.LOST.name())
                .title("Honda Car Key Fob with Blue Lanyard")
                .description("Set of keys including Honda smart key fob, gym pass, and blue woven campus lanyard. Missing since Tuesday afternoon.")
                .dateReported(LocalDate.now().minusDays(4))
                .location("North Parking Lot B")
                .category("Keys")
                .tags("keys, honda, fob, lanyard, car, blue")
                .imageUrl("https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80")
                .status(ItemStatus.OPEN.name())
                .createdAt(LocalDateTime.now().minusDays(4))
                .build());

        // Item 6: Found Keys (Counterpart Match)
        itemsToSeed.add(LostFoundItem.builder()
                .user(alex)
                .type(ItemType.FOUND.name())
                .title("Honda Smart Key with Blue Woven Strap")
                .description("Discovered keys on the walkway near Parking Lot B entrance. Stored in campus security lost & found bin.")
                .dateReported(LocalDate.now().minusDays(3))
                .location("Campus Security Desk - Parking Lot B")
                .category("Keys")
                .tags("keys, honda, blue, strap, fob")
                .imageUrl("https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80")
                .status(ItemStatus.OPEN.name())
                .createdAt(LocalDateTime.now().minusDays(3))
                .build());

        // Item 7: Lost Black North Face Backpack
        itemsToSeed.add(LostFoundItem.builder()
                .user(alex)
                .type(ItemType.LOST.name())
                .title("Black North Face Recon Backpack")
                .description("Water-resistant black backpack with padded straps. Contains Organic Chemistry binder and TI-84 calculator.")
                .dateReported(LocalDate.now().minusDays(5))
                .location("Science & Tech Complex Room 304")
                .category("Bags")
                .tags("backpack, north face, black, bag, school")
                .imageUrl("https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80")
                .status(ItemStatus.OPEN.name())
                .createdAt(LocalDateTime.now().minusDays(5))
                .build());

        // Item 8: Found Brown Leather Wallet
        itemsToSeed.add(LostFoundItem.builder()
                .user(david)
                .type(ItemType.FOUND.name())
                .title("Brown Leather Bi-Fold Wallet")
                .description("Found a brown genuine leather wallet on the 1st floor dining table. Contains university meal card.")
                .dateReported(LocalDate.now().minusDays(3))
                .location("Student Center Dining Hall")
                .category("Accessories")
                .tags("wallet, leather, brown, money, id")
                .imageUrl("https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80")
                .status(ItemStatus.OPEN.name())
                .createdAt(LocalDateTime.now().minusDays(3))
                .build());

        // Item 9: Lost Sony WH-1000XM5 Headphones
        itemsToSeed.add(LostFoundItem.builder()
                .user(emily)
                .type(ItemType.LOST.name())
                .title("Sony WH-1000XM5 Wireless Headphones")
                .description("Black noise-cancelling over-ear headphones inside gray zippered travel case. Left in Engineering lab.")
                .dateReported(LocalDate.now().minusDays(4))
                .location("Engineering Hall - Computer Lab 102")
                .category("Electronics")
                .tags("sony, headphones, over-ear, black, audio")
                .imageUrl("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80")
                .status(ItemStatus.OPEN.name())
                .createdAt(LocalDateTime.now().minusDays(4))
                .build());

        // Item 10: Found Ray-Ban Sunglasses
        itemsToSeed.add(LostFoundItem.builder()
                .user(sarah)
                .type(ItemType.FOUND.name())
                .title("Ray-Ban Classic Wayfarer Sunglasses")
                .description("Black frame polarized sunglasses found on the bleachers near the athletic track.")
                .dateReported(LocalDate.now().minusDays(1))
                .location("Sports & Fitness Center - Track Bleachers")
                .category("Accessories")
                .tags("sunglasses, rayban, glasses, black, polarized")
                .imageUrl("https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80")
                .status(ItemStatus.OPEN.name())
                .createdAt(LocalDateTime.now().minusDays(1))
                .build());

        // Item 11: Lost Navy Blue Fleece Pullover
        itemsToSeed.add(LostFoundItem.builder()
                .user(david)
                .type(ItemType.LOST.name())
                .title("Navy Blue Patagonia Snap-T Fleece (Size M)")
                .description("Dark navy fleece pullover left on the back of chair during afternoon lecture.")
                .dateReported(LocalDate.now().minusDays(6))
                .location("Auditorium Hall B")
                .category("Clothing")
                .tags("patagonia, fleece, jacket, blue, clothing")
                .imageUrl("https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80")
                .status(ItemStatus.OPEN.name())
                .createdAt(LocalDateTime.now().minusDays(6))
                .build());

        // Item 12: Found Pastel Mint Hydro Flask
        itemsToSeed.add(LostFoundItem.builder()
                .user(alex)
                .type(ItemType.FOUND.name())
                .title("Hydro Flask 32oz Wide Mouth Water Bottle")
                .description("Mint green stainless steel insulated flask with National Parks sticker.")
                .dateReported(LocalDate.now().minusDays(2))
                .location("Sports & Fitness Center Gymnasium")
                .category("Accessories")
                .tags("hydroflask, water bottle, mint, green, flask")
                .imageUrl("https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80")
                .status(ItemStatus.OPEN.name())
                .createdAt(LocalDateTime.now().minusDays(2))
                .build());

        // Save all items
        List<LostFoundItem> savedItems = itemRepository.saveAll(itemsToSeed);
        log.info("Saved {} realistic items to database", savedItems.size());

        // ----------------------------------------------------
        // 3. TRIGGER AUTOMATIC SMART MATCHING CALCULATION
        // ----------------------------------------------------
        for (LostFoundItem item : savedItems) {
            try {
                matchingService.findAndCreateMatches(item);
            } catch (Exception e) {
                log.warn("Matching calculation for item #{}: {}", item.getId(), e.getMessage());
            }
        }

        log.info("Database seeding completed with realistic campus users, listings, photos, and match pairings!");
    }
}
