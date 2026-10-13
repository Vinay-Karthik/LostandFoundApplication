package com.campustrack.repository;

import com.campustrack.entity.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {

    @Query("SELECT m FROM Match m WHERE (m.lostItem.id = :itemId OR m.foundItem.id = :itemId) ORDER BY m.matchScore DESC")
    List<Match> findMatchesByItemId(@Param("itemId") Long itemId);

    @Query("SELECT m FROM Match m WHERE " +
           "(m.lostItem.id = :lostItemId AND m.foundItem.id = :foundItemId) OR " +
           "(m.lostItem.id = :foundItemId AND m.foundItem.id = :lostItemId)")
    Optional<Match> findExistingMatch(@Param("lostItemId") Long lostItemId, @Param("foundItemId") Long foundItemId);

    long countByStatus(String status);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Match m WHERE m.lostItem.id = :itemId OR m.foundItem.id = :itemId")
    void deleteMatchesByItemId(@Param("itemId") Long itemId);

    @Query("SELECT m FROM Match m WHERE (m.lostItem.user.id = :userId OR m.foundItem.user.id = :userId) ORDER BY m.createdAt DESC")
    List<Match> findMatchesByUserId(@Param("userId") Long userId);

    @Query("SELECT m FROM Match m WHERE (:status IS NULL OR m.status = :status) ORDER BY m.createdAt DESC")
    org.springframework.data.domain.Page<Match> findAdminMatchesWithFilters(
            @Param("status") String status,
            org.springframework.data.domain.Pageable pageable);
}
