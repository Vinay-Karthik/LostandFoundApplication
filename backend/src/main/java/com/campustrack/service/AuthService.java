package com.campustrack.service;

import com.campustrack.dto.AuthDTOs.*;
import com.campustrack.entity.User;
import com.campustrack.entity.enums.Role;
import com.campustrack.exception.CustomExceptions.*;
import com.campustrack.mapper.UserMapper;
import com.campustrack.repository.UserRepository;
import com.campustrack.security.JwtTokenProvider;
import com.campustrack.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final ImageStorageService imageStorageService;
    private final UserMapper userMapper;
    private final OtpService otpService;

    @Value("${campustrack.campus.allowed-domains:university.edu,campus.edu,student.edu,college.edu,mit.edu,stanford.edu}")
    private String allowedDomainsConfig;

    public boolean isAllowedCampusEmail(String email) {
        if (email == null || !email.contains("@")) {
            return false;
        }
        String domain = email.substring(email.indexOf("@") + 1).toLowerCase().trim();
        List<String> allowedDomains = Arrays.stream(allowedDomainsConfig.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .toList();

        return allowedDomains.stream().anyMatch(d -> domain.equals(d) || domain.endsWith("." + d));
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (!isAllowedCampusEmail(email)) {
            throw new BadRequestException("Registration is restricted to campus emails only (@" + allowedDomainsConfig + ")");
        }

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already registered. Please login.");
        }

        // Validate OTP if provided, or check if already verified in session
        boolean isOtpVerified = false;
        if (request.getOtp() != null && !request.getOtp().trim().isEmpty()) {
            isOtpVerified = otpService.verifyOtp(email, request.getOtp().trim());
        } else if (otpService.isEmailVerified(email)) {
            isOtpVerified = true;
        } else {
            throw new BadRequestException("Please enter the 6-digit verification code sent to your campus email.");
        }

        long totalUsers = userRepository.count();
        boolean isFirstUser = totalUsers == 0 || email.startsWith("admin@");
        String role = isFirstUser ? Role.ADMIN.name() : Role.STUDENT.name();
        boolean verified = isOtpVerified || isFirstUser;

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .verified(verified)
                .createdAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);
        otpService.clearOtp(email);

        UserDetailsImpl userDetails = UserDetailsImpl.build(savedUser);
        String token = jwtTokenProvider.generateToken(userDetails);

        return userMapper.toAuthResponse(savedUser, token);
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(userDetails);

        User user = userRepository.findById(userDetails.getId()).orElse(null);
        if (user != null && Boolean.TRUE.equals(user.getSuspended())) {
            throw new UnauthorizedException("Your account has been suspended by campus administration.");
        }
        return userMapper.toAuthResponse(user, token);
    }

    @Transactional(readOnly = true)
    public UserDTO getCurrentUserProfile() {
        UserDetailsImpl userDetails = getCurrentUserDetails();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

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

        return userMapper.toUserDTO(saved);
    }

    @Transactional
    public UserDTO uploadAvatar(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select an image file to upload");
        }
        User user = getCurrentUserEntity();
        String avatarUrl = imageStorageService.storeImage(file);
        user.setAvatarUrl(avatarUrl);
        User saved = userRepository.save(user);

        return userMapper.toUserDTO(saved);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentUserEntity();
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public UserDetailsImpl getCurrentUserDetails() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return (UserDetailsImpl) authentication.getPrincipal();
    }

    public User getCurrentUserEntity() {
        UserDetailsImpl userDetails = getCurrentUserDetails();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userDetails.getId()));
    }
}
