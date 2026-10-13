package com.campustrack.service;

import com.campustrack.entity.LostFoundItem;
import com.campustrack.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Admin-triggered, paginated backfill for records created before embeddings were enabled.
 * A batch is embedded in one API call to avoid one request per row.
 */
@Service
@RequiredArgsConstructor
public class EmbeddingBackfillService {
    private static final int MAX_BATCH_SIZE = 25;

    private final ItemRepository itemRepository;
    private final NemotronEmbeddingService embeddings;

    @Transactional
    public BackfillResult backfillPage(int pageNumber, int requestedSize) {
        if (pageNumber < 0) {
            throw new IllegalArgumentException("page must be zero or greater");
        }
        int pageSize = Math.max(1, Math.min(requestedSize, MAX_BATCH_SIZE));

        Page<LostFoundItem> page = itemRepository.findAll(
                PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.ASC, "id")));

        List<LostFoundItem> pending = new ArrayList<>();
        int skipped = 0;

        for (LostFoundItem item : page.getContent()) {
            boolean current = item.getEmbeddingJson() != null
                    && !item.getEmbeddingJson().isBlank()
                    && embeddings.getModel().equals(item.getEmbeddingModelVersion())
                    && embeddings.deserialize(item.getEmbeddingJson()) != null;
            if (current) {
                skipped++;
            } else {
                pending.add(item);
            }
        }

        if (!pending.isEmpty()) {
            List<float[]> vectors = embeddings.embedPassages(
                    pending.stream().map(LostFoundItem::toEmbeddingText).toList());

            for (int i = 0; i < pending.size(); i++) {
                LostFoundItem item = pending.get(i);
                item.setEmbeddingJson(embeddings.serialize(vectors.get(i)));
                item.setEmbeddingModelVersion(embeddings.getModel());
            }
            itemRepository.saveAll(pending);
        }

        Integer nextPage = page.hasNext() ? pageNumber + 1 : null;
        return new BackfillResult(
                pageNumber, page.getTotalPages(), page.getTotalElements(),
                pending.size(), skipped, nextPage);
    }

    public record BackfillResult(
            int page,
            int totalPages,
            long totalItems,
            int embedded,
            int skippedAlreadyCurrent,
            Integer nextPage) {
    }
}
