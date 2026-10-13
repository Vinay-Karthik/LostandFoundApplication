package com.campustrack.service;

import com.campustrack.dto.AuthDTOs.RegisterRequest;
import com.campustrack.exception.CustomExceptions.BadRequestException;
import com.campustrack.mapper.UserMapper;
import com.campustrack.repository.UserRepository;
import com.campustrack.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private ImageStorageService imageStorageService;

    @Mock
    private OtpService otpService;

    private JwtTokenProvider jwtTokenProvider;
    private PasswordEncoder passwordEncoder;
    private UserMapper userMapper;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        userMapper = new UserMapper();
        jwtTokenProvider = new JwtTokenProvider(
                "CampusTrackSuperSecretJwtSigningKeyMustBe256BitsLongForHmacSha256Security2026",
                86400000
        );
        authService = new AuthService(userRepository, passwordEncoder, authenticationManager, jwtTokenProvider, imageStorageService, userMapper, otpService);
        ReflectionTestUtils.setField(authService, "allowedDomainsConfig", "university.edu,campus.edu,student.edu");
    }

    @Test
    @DisplayName("Should accept valid campus domain emails")
    void testValidCampusEmails() {
        assertTrue(authService.isAllowedCampusEmail("student@university.edu"));
        assertTrue(authService.isAllowedCampusEmail("john.doe@campus.edu"));
        assertTrue(authService.isAllowedCampusEmail("jane@cs.university.edu"));
        assertTrue(authService.isAllowedCampusEmail("alice@student.edu"));
    }

    @Test
    @DisplayName("Should reject non-campus emails like gmail, yahoo, random domains")
    void testRejectNonCampusEmails() {
        assertFalse(authService.isAllowedCampusEmail("spammer@gmail.com"));
        assertFalse(authService.isAllowedCampusEmail("user@yahoo.com"));
        assertFalse(authService.isAllowedCampusEmail("attacker@fakeedu.com"));
        assertFalse(authService.isAllowedCampusEmail("test@unknown.org"));
        assertFalse(authService.isAllowedCampusEmail("invalid-email"));
    }

    @Test
    @DisplayName("Register should throw BadRequestException for non-campus email")
    void testRegisterThrowsForInvalidDomain() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Hacker")
                .email("hacker@gmail.com")
                .password("secret123")
                .build();

        assertThrows(BadRequestException.class, () -> authService.register(request));
    }

    @Test
    @DisplayName("Password hashing with BCrypt should match raw password")
    void testPasswordHashing() {
        String rawPassword = "SecureCampusPassword123!";
        String encodedPassword = passwordEncoder.encode(rawPassword);

        assertNotEquals(rawPassword, encodedPassword);
        assertTrue(passwordEncoder.matches(rawPassword, encodedPassword));
        assertFalse(passwordEncoder.matches("WrongPassword", encodedPassword));
    }
}
