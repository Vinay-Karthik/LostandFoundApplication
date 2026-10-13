package com.campustrack.controller;

import com.campustrack.dto.ApiResponse;
import com.campustrack.service.EmbeddingBackfillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * The existing security configuration restricts /api/admin/** to ROLE_ADMIN.
 * Call this endpoint one page at a time to populate older records.
 */
@RestController
@RequestMapping("/api/admin/embeddings")
@RequiredArgsConstructor
public class EmbeddingAdminController {
    private final EmbeddingBackfillService backfillService;

    @PostMapping("/backfill")
    public ResponseEntity<ApiResponse<EmbeddingBackfillService.BackfillResult>> backfill(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        var result = backfillService.backfillPage(page, size);
        return ResponseEntity.ok(ApiResponse.ok("Embedding backfill page processed", result));
    }
}
