package com.campustrack.repository;

import com.campustrack.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    List<User> findByVerifiedFalseOrderByCreatedAtDesc();
    long countByVerifiedFalse();
    long countByRole(String role);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:verified IS NULL OR u.verified = :verified) AND " +
           "(:search IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY u.createdAt DESC")
    org.springframework.data.domain.Page<User> findUsersWithFilters(
            @org.springframework.data.repository.query.Param("role") String role,
            @org.springframework.data.repository.query.Param("verified") Boolean verified,
            @org.springframework.data.repository.query.Param("search") String search,
            org.springframework.data.domain.Pageable pageable);
}
