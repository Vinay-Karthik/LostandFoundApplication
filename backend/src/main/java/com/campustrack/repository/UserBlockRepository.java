package com.campustrack.repository;

import com.campustrack.entity.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM UserBlock b " +
           "WHERE (b.blocker.id = :user1Id AND b.blocked.id = :user2Id) " +
           "   OR (b.blocker.id = :user2Id AND b.blocked.id = :user1Id)")
    boolean isBlockedBetween(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);

    Optional<UserBlock> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
}
