package com.campustrack.service;

import com.campustrack.dto.AuthDTOs.*;
import com.campustrack.entity.User;
import com.campustrack.exception.CustomExceptions.*;
import com.campustrack.mapper.UserMapper;
import com.campustrack.repository.UserRepository;
import com.campustrack.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing user identity, profile modifications, and session context.
 * Single Responsibility: Provide user profile operations, password management, and security context resolution.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final ImageStorageService imageStorageService;

    public UserDetailsImpl getCurrentUserDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserDetailsImpl)) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return (UserDetailsImpl) auth.getPrincipal();
    }

    public User getCurrentUserEntity() {
        UserDetailsImpl userDetails = getCurrentUserDetails();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user could not be found"));
    }

    @Transactional(readOnly = true)
    public UserDTO getCurrentUserProfile() {
        User user = getCurrentUserEntity();
        return userMapper.toUserDTO(user);
    }

    @Transactional
    public UserDTO updateProfile(UpdateProfileRequest request) {
        User user = getCurrentUserEntity();
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }
        User saved = userRepository.save(user);
        log.info("User #{} profile updated", saved.getId());
        return userMapper.toUserDTO(saved);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentUserEntity();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password provided does not match");
        }

        if (request.getNewPassword().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("User #{} successfully changed password", user.getId());
    }

    @Transactional
    public UserDTO uploadAvatar(org.springframework.web.multipart.MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select an image file to upload");
        }
        User user = getCurrentUserEntity();
        String avatarUrl = imageStorageService.storeImage(file);
        user.setAvatarUrl(avatarUrl);
        User saved = userRepository.save(user);
        log.info("User #{} avatar updated", saved.getId());
        return userMapper.toUserDTO(saved);
    }
}
