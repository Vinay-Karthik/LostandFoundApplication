package com.campustrack.service;

import com.campustrack.exception.CustomExceptions.*;
import com.campustrack.repository.UserRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@svce.edu.in}")
    private String senderEmail;

    @Value("${campustrack.campus.allowed-domains:svce.edu.in}")
    private String allowedDomainsConfig;

    private static final long OTP_VALIDITY_SECONDS = 300; // 5 minutes
    private static final SecureRandom RANDOM = new SecureRandom();

    @Data
    @AllArgsConstructor
    private static class OtpEntry {
        private String otp;
        private Instant expiresAt;
        private boolean verified;
    }

    private final ConcurrentHashMap<String, OtpEntry> otpCache = new ConcurrentHashMap<>();

    public void sendOtp(String email) {
        String cleanEmail = email.trim().toLowerCase();

        // 1. Validate Campus Domain
        validateCampusDomain(cleanEmail);

        // 2. Check if user already exists
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new ConflictException("An account with this campus email already exists. Please log in.");
        }

        // 3. Generate 6-digit numeric OTP
        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        Instant expiresAt = Instant.now().plusSeconds(OTP_VALIDITY_SECONDS);

        otpCache.put(cleanEmail, new OtpEntry(otp, expiresAt, false));
        log.info("Generated OTP for {}: {} (Expires in 5 minutes)", cleanEmail, otp);

        // 4. Send Email via SMTP asynchronously
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                sendOtpEmail(cleanEmail, otp);
                log.info("OTP verification email successfully dispatched to {}", cleanEmail);
            } catch (Exception e) {
                log.error("Failed to send OTP email to {}: {}", cleanEmail, e.getMessage());
            }
        });
    }

    public boolean verifyOtp(String email, String otp) {
        String cleanEmail = email.trim().toLowerCase();
        OtpEntry entry = otpCache.get(cleanEmail);

        if (entry == null) {
            throw new BadRequestException("No active verification code found for this email. Please request a new code.");
        }

        if (Instant.now().isAfter(entry.getExpiresAt())) {
            otpCache.remove(cleanEmail);
            throw new BadRequestException("Verification code has expired. Please request a new code.");
        }

        if (!entry.getOtp().equals(otp.trim())) {
            throw new BadRequestException("Invalid verification code. Please check and try again.");
        }

        entry.setVerified(true);
        otpCache.put(cleanEmail, entry);
        log.info("Email {} successfully verified with OTP", cleanEmail);
        return true;
    }

    public boolean isEmailVerified(String email) {
        String cleanEmail = email.trim().toLowerCase();
        OtpEntry entry = otpCache.get(cleanEmail);
        return entry != null && entry.isVerified() && Instant.now().isBefore(entry.getExpiresAt().plusSeconds(300));
    }

    public void clearOtp(String email) {
        otpCache.remove(email.trim().toLowerCase());
    }

    private void validateCampusDomain(String email) {
        if (!email.contains("@")) {
            throw new BadRequestException("Invalid email format");
        }
        String domain = email.substring(email.indexOf('@') + 1).toLowerCase();
        List<String> allowed = Arrays.stream(allowedDomainsConfig.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .toList();

        boolean isAllowed = allowed.stream().anyMatch(d -> domain.equals(d) || domain.endsWith("." + d));
        if (!isAllowed) {
            throw new BadRequestException("Registration is restricted to official campus email addresses (" + allowedDomainsConfig + ")");
        }
    }

    private void sendOtpEmail(String recipientEmail, String otp) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(senderEmail);
        helper.setTo(recipientEmail);
        helper.setSubject("Your CampusTrack Verification Code: " + otp);

        String htmlContent = """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
                .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
                .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
                .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
                .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
                .otp-box { background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 8px; text-align: center; padding: 18px; margin: 24px 0; }
                .otp-code { font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #1d4ed8; font-family: monospace; }
                .notice { font-size: 13px; color: #64748b; line-height: 1.6; }
                .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="title">Campus<span style="color:#2563eb;">Track</span></div>
                  <div class="subtitle">SVCE Campus Lost & Found Portal</div>
                </div>
                <p style="font-size: 15px; color: #1e293b;">Hello,</p>
                <p style="font-size: 14px; color: #475569; line-height: 1.5;">
                  Thank you for registering on CampusTrack. Use the one-time verification code below to verify your campus email:
                </p>
                <div class="otp-box">
                  <div class="otp-code">%s</div>
                  <div style="font-size: 12px; color: #3b82f6; font-weight: 600; margin-top: 6px;">Valid for 5 minutes</div>
                </div>
                <div class="notice">
                  • Do not share this code with anyone.<br>
                  • If you did not request this registration code, please ignore this email.
                </div>
                <div class="footer">
                  © 2026 CampusTrack • Sri Venkateswara College of Engineering (SVCE)
                </div>
              </div>
            </body>
            </html>
            """.formatted(otp);

        helper.setText(htmlContent, true);
        mailSender.send(message);
    }
}
