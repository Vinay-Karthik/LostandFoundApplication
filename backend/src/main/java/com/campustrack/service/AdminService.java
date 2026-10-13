package com.campustrack.service;

import com.campustrack.dto.AuthDTOs.*;
import com.campustrack.dto.FlagDTOs.*;
import com.campustrack.dto.ItemDTOs.*;
import com.campustrack.dto.MatchDTOs.MatchResponse;
import com.campustrack.entity.Flag;
import com.campustrack.entity.LostFoundItem;
import com.campustrack.entity.Match;
import com.campustrack.entity.User;
import com.campustrack.entity.enums.ItemStatus;
import com.campustrack.entity.enums.MatchStatus;
import com.campustrack.entity.enums.Role;
import com.campustrack.exception.CustomExceptions.*;
import com.campustrack.mapper.FlagMapper;
import com.campustrack.mapper.ItemMapper;
import com.campustrack.mapper.MatchMapper;
import com.campustrack.mapper.UserMapper;
import com.campustrack.repository.FlagRepository;
import com.campustrack.repository.ItemRepository;
import com.campustrack.repository.MatchRepository;
import com.campustrack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final MatchRepository matchRepository;
    private final FlagService flagService;
    private final UserMapper userMapper;
    private final ItemMapper itemMapper;
    private final MatchMapper matchMapper;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    // --- User Management ---
    @Transactional(readOnly = true)
    public PagedResponse<UserDTO> getAllUsers(String search, String role, Boolean verified, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;
        String roleParam = (role != null && !role.isBlank()) ? role.toUpperCase().trim() : null;

        Page<User> userPage = userRepository.findUsersWithFilters(roleParam, verified, searchParam, pageable);
        List<UserDTO> content = userPage.getContent().stream()
                .map(userMapper::toUserDTO)
                .toList();

        return PagedResponse.<UserDTO>builder()
                .content(content)
                .page(userPage.getNumber())
                .size(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .last(userPage.isLast())
                .build();
    }

    @Transactional
    public UserDTO createUser(AdminCreateUserRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already registered: " + email);
        }

        Role role = Role.fromString(request.getRole());
        String roleStr = role != null ? role.name() : Role.STUDENT.name();
        boolean verified = request.getVerified() != null ? request.getVerified() : true;

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(roleStr)
                .verified(verified)
                .createdAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(user);
        log.info("Admin created new user: {} with role: {}", saved.getEmail(), saved.getRole());
        return userMapper.toUserDTO(saved);
    }

    @Transactional
    public UserDTO updateUser(Long userId, AdminUpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new BadRequestException("Email is already in use: " + newEmail);
            }
            user.setEmail(newEmail);
        }

        if (request.getRole() != null && !request.getRole().isBlank()) {
            Role role = Role.fromString(request.getRole());
            if (role != null) {
                user.setRole(role.name());
            }
        }

        if (request.getVerified() != null) {
            user.setVerified(request.getVerified());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getNewPassword().length() < 6) {
                throw new BadRequestException("Password must be at least 6 characters");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        User saved = userRepository.save(user);
        log.info("Admin updated user details for: {}", saved.getEmail());
        return userMapper.toUserDTO(saved);
    }

    @Transactional
    public void resetUserPassword(Long userId, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Admin reset password for user: {}", user.getEmail());
    }

    @Transactional
    public UserDTO toggleUserSuspension(Long userId, boolean suspended) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setSuspended(suspended);
        User saved = userRepository.save(user);
        log.info("Admin set user {} suspended status to: {}", user.getEmail(), suspended);
        return userMapper.toUserDTO(saved);
    }

    @Transactional(readOnly = true)
    public AdminUserDetailsResponse getUserDetails(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<LostFoundItem> userItems = itemRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<ItemResponse> itemResponses = userItems.stream()
                .map(item -> {
                    int matchCount = matchRepository.findMatchesByItemId(item.getId()).size();
                    return itemMapper.toResponse(item, null, matchCount);
                })
                .toList();

        long lostCount = userItems.stream().filter(i -> "LOST".equalsIgnoreCase(i.getType())).count();
        long foundCount = userItems.stream().filter(i -> "FOUND".equalsIgnoreCase(i.getType())).count();
        long resolvedCount = userItems.stream().filter(i -> "RESOLVED".equalsIgnoreCase(i.getStatus())).count();

        return AdminUserDetailsResponse.builder()
                .user(userMapper.toUserDTO(user))
                .items(itemResponses)
                .totalItems(userItems.size())
                .lostCount(lostCount)
                .foundCount(foundCount)
                .resolvedCount(resolvedCount)
                .build();
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getUnverifiedUsers() {
        return userRepository.findByVerifiedFalseOrderByCreatedAtDesc().stream()
                .map(userMapper::toUserDTO)
                .toList();
    }

    @Transactional
    public UserDTO verifyUser(Long userId, boolean approve) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (approve) {
            user.setVerified(true);
            User saved = userRepository.save(user);
            log.info("Admin approved verification for user {}", user.getEmail());
            return userMapper.toUserDTO(saved);
        } else {
            userRepository.delete(user);
            log.info("Admin rejected and removed unverified user {}", user.getEmail());
            return null;
        }
    }

    @Transactional
    public UserDTO toggleUserVerification(Long userId, boolean verified) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setVerified(verified);
        User saved = userRepository.save(user);
        log.info("Admin set user {} verification to {}", user.getEmail(), verified);
        return userMapper.toUserDTO(saved);
    }

    @Transactional
    public UserDTO updateUserRole(Long userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Role parsedRole = Role.fromString(roleName);
        if (parsedRole == null) {
            throw new BadRequestException("Invalid role: " + roleName);
        }

        user.setRole(parsedRole.name());
        User saved = userRepository.save(user);
        log.info("Admin updated role for user {} to {}", user.getEmail(), parsedRole);
        return userMapper.toUserDTO(saved);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        userRepository.delete(user);
        log.info("Admin deleted user account: {}", user.getEmail());
    }

    // --- Item Moderation & Management ---
    @Transactional(readOnly = true)
    public PagedResponse<ItemResponse> getAdminItems(String status, String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<LostFoundItem> itemPage = itemRepository.findAdminItemsWithFilters(
                (status != null && !status.isBlank()) ? status.toUpperCase().trim() : null,
                (category != null && !category.isBlank()) ? category.trim() : null,
                pageable
        );

        List<ItemResponse> content = itemPage.getContent().stream()
                .map(item -> {
                    int matchCount = matchRepository.findMatchesByItemId(item.getId()).size();
                    return itemMapper.toResponse(item, null, matchCount);
                })
                .toList();

        return PagedResponse.<ItemResponse>builder()
                .content(content)
                .page(itemPage.getNumber())
                .size(itemPage.getSize())
                .totalElements(itemPage.getTotalElements())
                .totalPages(itemPage.getTotalPages())
                .last(itemPage.isLast())
                .build();
    }

    @Transactional
    public ItemResponse setItemStatus(Long itemId, String newStatus, String reason) {
        LostFoundItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemId));

        ItemStatus parsedStatus = ItemStatus.fromString(newStatus);
        item.setStatus(parsedStatus != null ? parsedStatus.name() : newStatus.toUpperCase().trim());
        LostFoundItem saved = itemRepository.save(item);
        log.info("Admin changed status of item {} to {}. Reason: {}", itemId, newStatus, reason);

        int matchCount = matchRepository.findMatchesByItemId(saved.getId()).size();
        return itemMapper.toResponse(saved, null, matchCount);
    }

    @Transactional
    public void deleteItem(Long itemId) {
        LostFoundItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemId));

        itemRepository.delete(item);
        log.info("Admin deleted item with id: {}", itemId);
    }

    // --- Matches Management ---
    @Transactional(readOnly = true)
    public PagedResponse<MatchResponse> getAdminMatches(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String statusParam = (status != null && !status.isBlank()) ? status.toUpperCase().trim() : null;

        Page<Match> matchPage = matchRepository.findAdminMatchesWithFilters(statusParam, pageable);
        List<MatchResponse> content = matchPage.getContent().stream()
                .map(m -> matchMapper.toResponse(m, null))
                .toList();

        return PagedResponse.<MatchResponse>builder()
                .content(content)
                .page(matchPage.getNumber())
                .size(matchPage.getSize())
                .totalElements(matchPage.getTotalElements())
                .totalPages(matchPage.getTotalPages())
                .last(matchPage.isLast())
                .build();
    }

    @Transactional
    public MatchResponse setMatchStatus(Long matchId, String newStatus) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with id: " + matchId));

        MatchStatus parsed = MatchStatus.fromString(newStatus);
        if (parsed != null) {
            match.setStatus(parsed.name());
            if (parsed == MatchStatus.CONFIRMED) {
                match.getLostItem().setStatus(ItemStatus.MATCHED.name());
                match.getFoundItem().setStatus(ItemStatus.MATCHED.name());
                itemRepository.save(match.getLostItem());
                itemRepository.save(match.getFoundItem());
            }
        }
        Match saved = matchRepository.save(match);
        return matchMapper.toResponse(saved, null);
    }

    // --- Flags & Reports Moderation (Delegated to FlagService) ---
    @Transactional
    public FlagResponse createFlag(CreateFlagRequest request, User currentUser) {
        return flagService.createFlag(request, currentUser);
    }

    @Transactional(readOnly = true)
    public List<FlagResponse> getUnreviewedFlags() {
        return flagService.getUnreviewedFlags();
    }

    @Transactional
    public FlagResponse resolveFlag(Long flagId, ResolveFlagRequest request) {
        return flagService.resolveFlag(flagId, request);
    }
}
