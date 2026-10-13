package com.campustrack.repository;

import com.campustrack.entity.Flag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlagRepository extends JpaRepository<Flag, Long> {

    List<Flag> findByReviewedFalseOrderByCreatedAtDesc();

    Page<Flag> findByReviewed(@Param("reviewed") Boolean reviewed, Pageable pageable);

    long countByReviewedFalse();

    @Query("SELECT f FROM Flag f WHERE f.item.id = :itemId")
    List<Flag> findByItemId(@Param("itemId") Long itemId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Flag f WHERE f.item.id = :itemId")
    void deleteByItemId(@Param("itemId") Long itemId);
}
