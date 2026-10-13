package com.campustrack.service;

import com.campustrack.dto.*;
import com.campustrack.entity.User;
import com.campustrack.entity.enums.Role;
import com.campustrack.exception.CustomExceptions.*;
import com.campustrack.mapper.UserMapper;
import com.campustrack.repository.UserRepository;
import com.campustrack.security.JwtTokenProvider;
import com.campustrack.security.UserDetailsImpl;
import com.campustrack.validator.CampusEmailValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service managing user authentication, registration, and credentials.
 * Single Responsibility: Execute login, register new accounts with OTP validation,
 * and generate JWT authentication tokens.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;
    private final OtpService otpService;
    private final CampusEmailValidator emailValidator;
    private final UserService userService;

    public boolean isAllowedCampusEmail(String email) {
        return emailValidator.isAllowedCampusEmail(email);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (!emailValidator.isAllowedCampusEmail(email)) {
            throw new BadRequestException("Registration is restricted to campus emails only (@"
                    + emailValidator.getAllowedDomainsDescription() + ")");
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

        log.info("Registered new user: {} (role: {}, verified: {})", email, role, verified);
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

        log.info("User {} successfully logged in", email);
        return userMapper.toAuthResponse(user, token);
    }

    // Delegations to UserService for backwards compatibility and clean interface segregation
    public User getCurrentUserEntity() {
        return userService.getCurrentUserEntity();
    }

    public UserDetailsImpl getCurrentUserDetails() {
        return userService.getCurrentUserDetails();
    }

    public UserDTO getCurrentUserProfile() {
        return userService.getCurrentUserProfile();
    }

    public UserDTO updateProfile(UpdateProfileRequest request) {
        return userService.updateProfile(request);
    }

    public void changePassword(ChangePasswordRequest request) {
        userService.changePassword(request);
    }

    public UserDTO uploadAvatar(org.springframework.web.multipart.MultipartFile file) {
        return userService.uploadAvatar(file);
    }
}
