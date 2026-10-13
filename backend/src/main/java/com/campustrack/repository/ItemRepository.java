package com.campustrack.repository;

import com.campustrack.entity.LostFoundItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<LostFoundItem, Long> {

    @Query("SELECT i FROM LostFoundItem i WHERE " +
           "(:type IS NULL OR i.type = :type) AND " +
           "(:category IS NULL OR LOWER(i.category) = LOWER(:category)) AND " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:location IS NULL OR LOWER(i.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:tag IS NULL OR LOWER(i.tags) LIKE LOWER(CONCAT('%', :tag, '%'))) AND " +
           "(:search IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.description) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(i.status <> 'REMOVED') " +
           "ORDER BY i.createdAt DESC")
    Page<LostFoundItem> findItemsWithFilters(
            @Param("type") String type,
            @Param("category") String category,
            @Param("status") String status,
            @Param("location") String location,
            @Param("tag") String tag,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT i FROM LostFoundItem i WHERE " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:category IS NULL OR LOWER(i.category) = LOWER(:category)) " +
           "ORDER BY i.createdAt DESC")
    Page<LostFoundItem> findAdminItemsWithFilters(
            @Param("status") String status,
            @Param("category") String category,
            Pageable pageable);

    List<LostFoundItem> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<LostFoundItem> findByStatus(String status, Pageable pageable);

    @Query("SELECT i FROM LostFoundItem i WHERE i.type = :oppositeType AND i.status = 'OPEN' AND i.id <> :excludeId")
    List<LostFoundItem> findPotentialMatchesFor(
            @Param("oppositeType") String oppositeType,
            @Param("excludeId") Long excludeId);

    long countByType(String type);
    long countByStatus(String status);
    
    @Query("SELECT i.category, COUNT(i) FROM LostFoundItem i GROUP BY i.category")
    List<Object[]> countGroupByCategory();

    @Query("SELECT i.dateReported, COUNT(i) FROM LostFoundItem i WHERE i.dateReported >= :startDate GROUP BY i.dateReported ORDER BY i.dateReported ASC")
    List<Object[]> countGroupByDateReported(@Param("startDate") LocalDate startDate);
}
