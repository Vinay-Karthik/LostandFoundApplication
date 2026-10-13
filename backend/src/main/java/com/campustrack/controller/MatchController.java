package com.campustrack.controller;

import com.campustrack.dto.ApiResponse;
import com.campustrack.dto.MatchResponse;
import com.campustrack.entity.User;
import com.campustrack.service.AuthService;
import com.campustrack.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MatchController {

    private final MatchingService matchingService;
    private final AuthService authService;

    @GetMapping("/items/{id}/matches")
    public ResponseEntity<ApiResponse<List<MatchResponse>>> getMatchesForItem(@PathVariable("id") Long itemId) {
        User currentUser = authService.getCurrentUserEntity();
        List<MatchResponse> matches = matchingService.getMatchesForItem(itemId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(matches));
    }

    @GetMapping("/matches/my-matches")
    public ResponseEntity<ApiResponse<List<MatchResponse>>> getMyMatches() {
        User currentUser = authService.getCurrentUserEntity();
        List<MatchResponse> matches = matchingService.getMatchesForUser(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(matches));
    }

    @PostMapping("/matches/{id}/confirm")
    public ResponseEntity<ApiResponse<MatchResponse>> confirmMatch(@PathVariable("id") Long matchId) {
        User currentUser = authService.getCurrentUserEntity();
        MatchResponse response = matchingService.confirmMatch(matchId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Match confirmed successfully", response));
    }

    @PostMapping("/matches/{id}/reject")
    public ResponseEntity<ApiResponse<MatchResponse>> rejectMatch(@PathVariable("id") Long matchId) {
        User currentUser = authService.getCurrentUserEntity();
        MatchResponse response = matchingService.rejectMatch(matchId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Match rejected", response));
    }
}
