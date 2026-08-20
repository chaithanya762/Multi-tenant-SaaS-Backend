package com.example.multitenant.service;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.Tenant;
import com.example.multitenant.domain.User;
import com.example.multitenant.repository.TenantRepository;
import com.example.multitenant.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, TenantRepository tenantRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User createUser(String tenantId, String username, String email, String rawPassword, String role) {
        TenantContext.setTenantId(tenantId);
        
        // Auto-provision tenant if it does not exist in the database yet
        if (!tenantRepository.existsById(tenantId)) {
            Tenant newTenant = new Tenant(tenantId, tenantId, "ACTIVE");
            tenantRepository.save(newTenant);
            log.info("Auto-provisioned tenant boundary '{}' during user registration", tenantId);
        }

        if (userRepository.existsByTenantIdAndUsername(tenantId, username)) {
            throw new IllegalArgumentException("Username '" + username + "' already exists in this tenant");
        }
        if (userRepository.existsByTenantIdAndEmail(tenantId, email)) {
            throw new IllegalArgumentException("Email '" + email + "' already exists in this tenant");
        }

        String passwordHash = passwordEncoder.encode(rawPassword);
        User user = new User(UUID.randomUUID().toString(), tenantId, username, email, passwordHash, role);
        User saved = userRepository.save(user);
        log.info("Created user '{}' for tenant '{}'", username, tenantId);
        return saved;
    }

    @Transactional(readOnly = true)
    public User authenticate(String tenantId, String username, String rawPassword) {
        TenantContext.setTenantId(tenantId);
        User user = userRepository.findByTenantIdAndUsername(tenantId, username)
            .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));
        if (!user.isActive()) {
            throw new IllegalStateException("User account is deactivated");
        }
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid username or password");
        }
        return user;
    }

    @Transactional(readOnly = true)
    public List<User> getUsersForCurrentTenant() {
        return userRepository.findByTenantId(TenantContext.getTenantId());
    }

    @Transactional
    public void deactivateUser(String userId) {
        String tenantId = TenantContext.getTenantId();
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setActive(false);
        userRepository.save(user);
        log.info("Deactivated user '{}' in tenant '{}'", user.getUsername(), tenantId);
    }

    private final java.util.concurrent.ConcurrentHashMap<String, PasswordResetEntry> resetTokens = new java.util.concurrent.ConcurrentHashMap<>();

    private record PasswordResetEntry(String token, String tenantId, String email, java.time.Instant expiresAt) {
        boolean isValid(String checkToken, String checkTenantId, String checkEmail) {
            return token.equals(checkToken) && tenantId.equals(checkTenantId)
                && email.equals(checkEmail) && java.time.Instant.now().isBefore(expiresAt);
        }
    }

    public String generatePasswordResetToken(String tenantId, String email) {
        TenantContext.setTenantId(tenantId);
        User user = userRepository.findByTenantIdAndEmail(tenantId, email)
            .orElseThrow(() -> new IllegalArgumentException("No account found with email: " + email));
        String token = java.util.UUID.randomUUID().toString();
        resetTokens.put(email + ":" + tenantId, new PasswordResetEntry(token, tenantId, email, java.time.Instant.now().plusSeconds(3600)));
        log.info("Password reset token generated for user '{}' in tenant '{}'", user.getUsername(), tenantId);
        return token;
    }

    @Transactional
    public void resetPassword(String tenantId, String email, String resetToken, String newPassword) {
        TenantContext.setTenantId(tenantId);
        String key = email + ":" + tenantId;
        PasswordResetEntry entry = resetTokens.get(key);
        if (entry == null || !entry.isValid(resetToken, tenantId, email)) {
            throw new IllegalArgumentException("Invalid or expired password reset token");
        }
        User user = userRepository.findByTenantIdAndEmail(tenantId, email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        resetTokens.remove(key);
        log.info("Password reset completed for user '{}' in tenant '{}'", user.getUsername(), tenantId);
    }
}
