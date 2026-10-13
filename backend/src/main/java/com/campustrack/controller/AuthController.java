package com.campustrack.controller;

import com.campustrack.dto.*;
import com.campustrack.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final com.campustrack.service.OtpService otpService;

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<String>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        String otp = otpService.sendOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Verification code sent to your email! [Your Code: " + otp + "]", "OTP_SENT"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<String>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        otpService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.ok("Email verified successfully", "OTP_VERIFIED"));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.ok("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser() {
        UserDTO user = authService.getCurrentUserProfile();
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PatchMapping("/profile")
    public ResponseEntity<ApiResponse<UserDTO>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        UserDTO user = authService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", user));
    }

    @PatchMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully", "SUCCESS"));
    }

    @PostMapping(value = "/avatar", consumes = {org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<ApiResponse<UserDTO>> uploadAvatar(@RequestParam("image") org.springframework.web.multipart.MultipartFile file) {
        UserDTO user = authService.uploadAvatar(file);
        return ResponseEntity.ok(ApiResponse.ok("Avatar uploaded successfully", user));
    }
}
