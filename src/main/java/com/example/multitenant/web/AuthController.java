package com.example.multitenant.web;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.service.AuthService;
import com.example.multitenant.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "User Authentication, Registration & Token Management")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final com.example.multitenant.service.TotpService totpService;
    private final com.example.multitenant.repository.UserRepository userRepository;

    public AuthController(AuthService authService, UserService userService,
                          com.example.multitenant.service.TotpService totpService,
                          com.example.multitenant.repository.UserRepository userRepository) {
        this.authService = authService;
        this.userService = userService;
        this.totpService = totpService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    @Operation(summary = "Login with username and password", description = "Returns a JWT access token (15 min) and a refresh token (30 days)")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            TenantContext.setTenantId(request.getTenantId());
            AuthService.LoginResult result = authService.login(
                request.getTenantId(), request.getUsername(), request.getPassword());
            TokenResponse response = new TokenResponse(
                result.accessToken(),
                result.refreshToken(),
                result.user().getTenantId(),
                result.user().getUsername(),
                result.user().getRole(),
                900L
            );
            return ResponseEntity.ok(response);
        } finally {
            TenantContext.clear();
        }
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user within a tenant")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            TenantContext.setTenantId(request.getTenantId());
            userService.createUser(
                request.getTenantId(),
                request.getUsername(),
                request.getEmail(),
                request.getPassword(),
                "ROLE_TENANT_USER"
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "User registered successfully"));
        } finally {
            TenantContext.clear();
        }
    }

    @PostMapping("/refresh")
    @Operation(summary = "Exchange refresh token for a new access token")
    public ResponseEntity<Map<String, String>> refresh(@Valid @RequestBody RefreshRequest request) {
        String newAccessToken = authService.refreshAccessToken(request.getRefreshToken());
        return ResponseEntity.ok(Map.of(
            "access_token", newAccessToken,
            "expires_in", "900"
        ));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke refresh token (logout)")
    public ResponseEntity<Map<String, String>> logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset token (sent to email)")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            TenantContext.setTenantId(request.getTenantId());
            String resetToken = userService.generatePasswordResetToken(request.getTenantId(), request.getEmail());
            // In production, send this token via email. For now, return it in response.
            return ResponseEntity.ok(Map.of(
                "message", "Password reset token generated. In production, this would be sent via email.",
                "resetToken", resetToken
            ));
        } finally {
            TenantContext.clear();
        }
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using a valid reset token")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            TenantContext.setTenantId(request.getTenantId());
            userService.resetPassword(request.getTenantId(), request.getEmail(), request.getResetToken(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password reset successfully. Please login with your new password."));
        } finally {
            TenantContext.clear();
        }
    }

    @PostMapping("/accept-invite")
    @Operation(summary = "Accept an invitation and set password")
    public ResponseEntity<Map<String, String>> acceptInvite(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String username = body.get("username");
        String password = body.get("password");
        if (token == null || username == null || password == null) {
            throw new IllegalArgumentException("token, username, and password are required");
        }
        userService.acceptInvitation(token, username, password);
        return ResponseEntity.ok(Map.of("message", "Invitation accepted successfully! You can now log in."));
    }

    @PostMapping("/2fa/setup")
    @Operation(summary = "Generate a new TOTP 2FA secret and QR code URI")
    public ResponseEntity<Map<String, String>> setup2fa() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        String tenantId = TenantContext.getTenantId();
        String secret = totpService.generateSecretKey();
        String qrUri = totpService.getQrCodeUri(username, secret, tenantId);
        return ResponseEntity.ok(Map.of("secret", secret, "qrUri", qrUri));
    }

    @PostMapping("/2fa/enable")
    @Operation(summary = "Verify and enable TOTP 2FA for the current user")
    public ResponseEntity<Map<String, String>> enable2fa(@RequestBody Map<String, String> body) {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        String tenantId = TenantContext.getTenantId();
        String secret = body.get("secret");
        String codeStr = body.get("code");
        if (secret == null || codeStr == null) {
            throw new IllegalArgumentException("secret and code are required");
        }
        int code;
        try {
            code = Integer.parseInt(codeStr.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Code must be a 6-digit number");
        }
        if (!totpService.verifyCode(secret, code)) {
            throw new IllegalArgumentException("Invalid verification code. Please check your authenticator app.");
        }
        userRepository.findByTenantIdAndUsername(tenantId, username).ifPresent(u -> {
            u.setTotpSecret(secret);
            u.setTotpEnabled(true);
            userRepository.save(u);
        });
        return ResponseEntity.ok(Map.of("message", "Two-factor authentication enabled successfully"));
    }

    @PostMapping("/2fa/disable")
    @Operation(summary = "Disable TOTP 2FA for the current user")
    public ResponseEntity<Map<String, String>> disable2fa() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        String tenantId = TenantContext.getTenantId();
        userRepository.findByTenantIdAndUsername(tenantId, username).ifPresent(u -> {
            u.setTotpSecret(null);
            u.setTotpEnabled(false);
            userRepository.save(u);
        });
        return ResponseEntity.ok(Map.of("message", "Two-factor authentication disabled"));
    }

    // ---- Request / Response DTOs ----

    @Data
    public static class ForgotPasswordRequest {
        @NotBlank private String tenantId;
        @NotBlank @Email private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank private String tenantId;
        @NotBlank @Email private String email;
        @NotBlank private String resetToken;
        @NotBlank @Size(min = 8, max = 128) private String newPassword;
    }

    @Data
    public static class LoginRequest {
        @NotBlank private String tenantId;
        @NotBlank private String username;
        @NotBlank private String password;
    }

    @Data
    public static class RegisterRequest {
        @NotBlank private String tenantId;
        @NotBlank @Size(min = 3, max = 50) private String username;
        @NotBlank @Email private String email;
        @NotBlank @Size(min = 8, max = 128) private String password;
    }

    @Data
    public static class RefreshRequest {
        @NotBlank private String refreshToken;
    }

    public record TokenResponse(String accessToken, String refreshToken, String tenantId,
                                 String username, String role, long expiresInSeconds) {}
}
