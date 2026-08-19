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

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
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
