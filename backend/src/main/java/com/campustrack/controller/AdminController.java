package com.campustrack.controller;

import com.campustrack.dto.*;
import com.campustrack.entity.User;
import com.campustrack.service.AdminService;
import com.campustrack.service.AuthService;
import com.campustrack.service.StatsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final StatsService statsService;
    private final AuthService authService;
    private final com.campustrack.config.DatabaseSeeder databaseSeeder;

    // ==========================================
    // 0. SEED DATA REFRESH
    // ==========================================
    @PostMapping("/admin/reseed")
    public ResponseEntity<ApiResponse<String>> reseedDatabase() {
        databaseSeeder.seedData();
        return ResponseEntity.ok(ApiResponse.ok("Database seeded successfully with realistic items and matches", "SUCCESS"));
    }

    // ==========================================
    // 1. ALL USERS MANAGEMENT
    // ==========================================
    @GetMapping("/admin/users")
    public ResponseEntity<ApiResponse<PagedResponse<UserDTO>>> getAllUsers(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "verified", required = false) Boolean verified,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllUsers(search, role, verified, page, size)));
    }

    @PostMapping("/admin/users")
    public ResponseEntity<ApiResponse<UserDTO>> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        UserDTO user = adminService.createUser(request);
        return ResponseEntity.ok(ApiResponse.ok("User created successfully", user));
    }

    @PutMapping("/admin/users/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(
            @PathVariable("id") Long userId,
            @RequestBody AdminUpdateUserRequest request) {
        UserDTO user = adminService.updateUser(userId, request);
        return ResponseEntity.ok(ApiResponse.ok("User updated successfully", user));
    }

    @PostMapping("/admin/users/{id}/reset-password")
    public ResponseEntity<ApiResponse<String>> resetUserPassword(
            @PathVariable("id") Long userId,
            @RequestParam("newPassword") String newPassword) {
        adminService.resetUserPassword(userId, newPassword);
        return ResponseEntity.ok(ApiResponse.ok("User password reset successfully", "SUCCESS"));
    }

    @GetMapping("/admin/users/{id}/details")
    public ResponseEntity<ApiResponse<AdminUserDetailsResponse>> getUserDetails(@PathVariable("id") Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getUserDetails(userId)));
    }

    @PatchMapping("/admin/users/{id}/suspend")
    public ResponseEntity<ApiResponse<UserDTO>> toggleUserSuspension(
            @PathVariable("id") Long userId,
            @RequestParam("suspended") boolean suspended) {
        UserDTO user = adminService.toggleUserSuspension(userId, suspended);
        String msg = suspended ? "User account suspended" : "User account unsuspended";
        return ResponseEntity.ok(ApiResponse.ok(msg, user));
    }

    @GetMapping("/admin/unverified-users")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getUnverifiedUsers() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getUnverifiedUsers()));
    }

    @PostMapping("/admin/verify-user/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> verifyUser(
            @PathVariable("id") Long userId,
            @RequestParam(value = "approve", defaultValue = "true") boolean approve) {
        UserDTO user = adminService.verifyUser(userId, approve);
        String msg = approve ? "User account approved" : "User account rejected and removed";
        return ResponseEntity.ok(ApiResponse.ok(msg, user));
    }

    @PatchMapping("/admin/users/{id}/verify")
    public ResponseEntity<ApiResponse<UserDTO>> toggleUserVerification(
            @PathVariable("id") Long userId,
            @RequestParam("verified") boolean verified) {
        UserDTO user = adminService.toggleUserVerification(userId, verified);
        return ResponseEntity.ok(ApiResponse.ok("User verification updated", user));
    }

    @PatchMapping("/admin/users/{id}/role")
    public ResponseEntity<ApiResponse<UserDTO>> updateUserRole(
            @PathVariable("id") Long userId,
            @RequestParam("role") String role) {
        UserDTO user = adminService.updateUserRole(userId, role);
        return ResponseEntity.ok(ApiResponse.ok("User role updated successfully", user));
    }

    @DeleteMapping("/admin/users/{id}")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable("id") Long userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.ok("User account deleted successfully", "SUCCESS"));
    }

    // ==========================================
    // 2. ITEM MODERATION & MANAGEMENT
    // ==========================================
    @GetMapping("/admin/items")
    public ResponseEntity<ApiResponse<PagedResponse<ItemResponse>>> getAdminItems(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAdminItems(status, category, page, size)));
    }

    @PatchMapping("/admin/items/{id}")
    public ResponseEntity<ApiResponse<ItemResponse>> setItemStatus(
            @PathVariable("id") Long itemId,
            @RequestParam("status") String status,
            @RequestParam(value = "reason", defaultValue = "Admin moderation") String reason) {
        ItemResponse item = adminService.setItemStatus(itemId, status, reason);
        return ResponseEntity.ok(ApiResponse.ok("Item status updated", item));
    }

    @DeleteMapping("/admin/items/{id}")
    public ResponseEntity<ApiResponse<String>> deleteItem(@PathVariable("id") Long itemId) {
        adminService.deleteItem(itemId);
        return ResponseEntity.ok(ApiResponse.ok("Item deleted successfully", "SUCCESS"));
    }

    // ==========================================
    // 3. SYSTEM MATCHES MANAGEMENT
    // ==========================================
    @GetMapping("/admin/matches")
    public ResponseEntity<ApiResponse<PagedResponse<MatchResponse>>> getAdminMatches(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAdminMatches(status, page, size)));
    }

    @PatchMapping("/admin/matches/{id}/status")
    public ResponseEntity<ApiResponse<MatchResponse>> setMatchStatus(
            @PathVariable("id") Long matchId,
            @RequestParam("status") String status) {
        MatchResponse match = adminService.setMatchStatus(matchId, status);
        return ResponseEntity.ok(ApiResponse.ok("Match status updated", match));
    }

    // ==========================================
    // 4. FLAGS & MODERATION QUEUE
    // ==========================================
    @PostMapping("/flags")
    public ResponseEntity<ApiResponse<FlagResponse>> createFlag(@Valid @RequestBody CreateFlagRequest request) {
        User currentUser = authService.getCurrentUserEntity();
        FlagResponse response = adminService.createFlag(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Item flagged for review", response));
    }

    @GetMapping("/admin/flags")
    public ResponseEntity<ApiResponse<List<FlagResponse>>> getUnreviewedFlags() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getUnreviewedFlags()));
    }

    @PostMapping("/admin/flags/{id}/resolve")
    public ResponseEntity<ApiResponse<FlagResponse>> resolveFlag(
            @PathVariable("id") Long flagId,
            @RequestBody ResolveFlagRequest request) {
        FlagResponse response = adminService.resolveFlag(flagId, request);
        return ResponseEntity.ok(ApiResponse.ok("Flag resolved", response));
    }

    // ==========================================
    // 5. ADMIN ANALYTICS & REPORTING
    // ==========================================
    @GetMapping("/admin/stats/summary")
    public ResponseEntity<ApiResponse<StatsSummaryResponse>> getSummaryStats(
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(statsService.getSummaryStats(from, to)));
    }

    @GetMapping("/admin/stats/engagement")
    public ResponseEntity<ApiResponse<EngagementStatsResponse>> getEngagementStats() {
        return ResponseEntity.ok(ApiResponse.ok(statsService.getEngagementStats()));
    }
}
