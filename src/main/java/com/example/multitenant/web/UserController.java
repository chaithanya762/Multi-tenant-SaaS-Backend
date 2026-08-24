package com.example.multitenant.web;

import com.example.multitenant.domain.User;
import com.example.multitenant.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "User Management", description = "Manage users within a tenant")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_SYS_ADMIN')")
    @Operation(summary = "List all users in the current tenant")
    public ResponseEntity<List<User>> listUsers() {
        return ResponseEntity.ok(userService.getUsersForCurrentTenant());
    }

    @PostMapping("/{userId}/deactivate")
    @PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_SYS_ADMIN')")
    @Operation(summary = "Deactivate a user")
    public ResponseEntity<Map<String, String>> deactivateUser(@PathVariable String userId) {
        userService.deactivateUser(userId);
        return ResponseEntity.ok(Map.of("message", "User deactivated"));
    }

    @PostMapping("/invite")
    @PreAuthorize("hasAnyRole('ROLE_TENANT_ADMIN', 'ROLE_SYS_ADMIN')")
    @Operation(summary = "Invite a new team member")
    public ResponseEntity<com.example.multitenant.domain.UserInvitation> inviteUser(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String role = body.getOrDefault("role", "ROLE_TENANT_USER");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("email is required");
        }
        return ResponseEntity.ok(userService.createInvitation(email, role));
    }
}
