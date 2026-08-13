package com.example.multitenant.service;

import com.example.multitenant.context.TenantContext;
import com.example.multitenant.domain.User;
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
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User createUser(String tenantId, String username, String email, String rawPassword, String role) {
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
        return userRepository.findAll().stream()
            .filter(u -> TenantContext.getTenantId().equals(u.getTenantId()))
            .toList();
    }

    @Transactional
    public void deactivateUser(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setActive(false);
        userRepository.save(user);
    }
}
