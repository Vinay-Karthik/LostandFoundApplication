package com.campustrack.service;

import com.campustrack.dto.MatchDTOs.MatchResponse;
import com.campustrack.entity.LostFoundItem;
import com.campustrack.entity.Match;
import com.campustrack.entity.User;
import com.campustrack.entity.enums.ItemStatus;
import com.campustrack.entity.enums.ItemType;
import com.campustrack.entity.enums.MatchStatus;
import com.campustrack.entity.enums.Role;
import com.campustrack.exception.CustomExceptions.*;
import com.campustrack.mapper.MatchMapper;
import com.campustrack.matching.MatchingRule;
import com.campustrack.repository.ItemRepository;
import com.campustrack.repository.MatchRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service orchestrating AI/heuristic smart matching between lost and found items.
 * Employs the Strategy Pattern (via injected MatchingRule list) to compute composite scores
 * and decouple scoring algorithms from entity persistence.
 */
@Service
@Slf4j
public class MatchingService {

    private final MatchRepository matchRepository;
    private final ItemRepository itemRepository;
    private final MatchMapper matchMapper;
    private final List<MatchingRule> matchingRules;
    private final SimpMessagingTemplate messagingTemplate;

    private static final float MATCH_THRESHOLD = 0.40f;

    @Autowired
    public MatchingService(
            MatchRepository matchRepository,
            ItemRepository itemRepository,
            MatchMapper matchMapper,
            List<MatchingRule> matchingRules,
            @Autowired(required = false) SimpMessagingTemplate messagingTemplate) {
        this.matchRepository = matchRepository;
        this.itemRepository = itemRepository;
        this.matchMapper = matchMapper;
        this.matchingRules = matchingRules;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public void findAndCreateMatches(LostFoundItem newItem) {
        if (!ItemStatus.OPEN.name().equalsIgnoreCase(newItem.getStatus())) {
            return;
        }

        String oppositeType = ItemType.LOST.name().equalsIgnoreCase(newItem.getType())
                ? ItemType.FOUND.name()
                : ItemType.LOST.name();

        List<LostFoundItem> potentialItems = itemRepository.findPotentialMatchesFor(oppositeType, newItem.getId());

        for (LostFoundItem candidate : potentialItems) {
            LostFoundItem lostItem = ItemType.LOST.name().equalsIgnoreCase(newItem.getType()) ? newItem : candidate;
            LostFoundItem foundItem = ItemType.FOUND.name().equalsIgnoreCase(newItem.getType()) ? newItem : candidate;

            float score = calculateMatchScore(lostItem, foundItem);

            if (score >= MATCH_THRESHOLD) {
                Optional<Match> existing = matchRepository.findExistingMatch(lostItem.getId(), foundItem.getId());
                if (existing.isPresent()) {
                    Match match = existing.get();
                    if (!MatchStatus.REJECTED.name().equalsIgnoreCase(match.getStatus())) {
                        match.setMatchScore(score);
                        matchRepository.save(match);
                    }
                } else {
                    Match match = Match.builder()
                            .lostItem(lostItem)
                            .foundItem(foundItem)
                            .matchScore(score)
                            .status(MatchStatus.SUGGESTED.name())
                            .createdAt(LocalDateTime.now())
                            .build();

                    Match savedMatch = matchRepository.save(match);
                    log.info("Created suggested match between items {} & {} with score {}", lostItem.getId(), foundItem.getId(), score);

                    broadcastMatch(savedMatch, lostItem, foundItem);
                }
            }
        }
    }

    public float calculateMatchScore(LostFoundItem item1, LostFoundItem item2) {
        if (item1 == null || item2 == null) {
            return 0.0f;
        }

        double totalWeightedScore = 0.0;
        double totalWeight = 0.0;

        for (MatchingRule rule : matchingRules) {
            if (!rule.isApplicable(item1, item2)) {
                continue;
            }
            double ruleScore = rule.computeScore(item1, item2);
            double weight = rule.getWeight();
            totalWeightedScore += (ruleScore * weight);
            totalWeight += weight;
        }

        double normalizedScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0.0;
        return (float) Math.min(1.0, Math.max(0.0, Math.round(normalizedScore * 100.0) / 100.0));
    }

    @Transactional(readOnly = true)
    public List<MatchResponse> getMatchesForItem(Long itemId, Long currentUserId) {
        List<Match> matches = matchRepository.findMatchesByItemId(itemId);
        return matches.stream()
                .map(m -> matchMapper.toResponse(m, currentUserId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MatchResponse> getMatchesForUser(Long userId) {
        List<Match> matches = matchRepository.findMatchesByUserId(userId);
        return matches.stream()
                .map(m -> matchMapper.toResponse(m, userId))
                .toList();
    }

    @Transactional
    public MatchResponse confirmMatch(Long matchId, User currentUser) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id: " + matchId));

        boolean isOwner = match.getLostItem().getUser().getId().equals(currentUser.getId()) ||
                          match.getFoundItem().getUser().getId().equals(currentUser.getId()) ||
                          Role.ADMIN.name().equalsIgnoreCase(currentUser.getRole());

        if (!isOwner) {
            throw new ForbiddenException("You are not authorized to confirm this match");
        }

        match.setStatus(MatchStatus.CONFIRMED.name());
        match.getLostItem().setStatus(ItemStatus.MATCHED.name());
        match.getFoundItem().setStatus(ItemStatus.MATCHED.name());

        itemRepository.save(match.getLostItem());
        itemRepository.save(match.getFoundItem());
        Match saved = matchRepository.save(match);

        return matchMapper.toResponse(saved, currentUser.getId());
    }

    @Transactional
    public MatchResponse rejectMatch(Long matchId, User currentUser) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id: " + matchId));

        boolean isOwner = match.getLostItem().getUser().getId().equals(currentUser.getId()) ||
                          match.getFoundItem().getUser().getId().equals(currentUser.getId()) ||
                          Role.ADMIN.name().equalsIgnoreCase(currentUser.getRole());

        if (!isOwner) {
            throw new ForbiddenException("You are not authorized to reject this match");
        }

        match.setStatus(MatchStatus.REJECTED.name());
        Match saved = matchRepository.save(match);
        return matchMapper.toResponse(saved, currentUser.getId());
    }

    private void broadcastMatch(Match match, LostFoundItem lostItem, LostFoundItem foundItem) {
        if (messagingTemplate != null) {
            try {
                MatchResponse matchRes = matchMapper.toResponse(match, null);
                messagingTemplate.convertAndSend("/topic/matches", matchRes);
                messagingTemplate.convertAndSend("/topic/matches/" + lostItem.getUser().getId(), matchRes);
                messagingTemplate.convertAndSend("/topic/matches/" + foundItem.getUser().getId(), matchRes);
            } catch (Exception e) {
                log.warn("Failed to broadcast match over WebSocket: {}", e.getMessage());
            }
        }
    }
}
