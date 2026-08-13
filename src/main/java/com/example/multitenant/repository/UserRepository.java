package com.example.multitenant.repository;

import com.example.multitenant.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByTenantIdAndUsername(String tenantId, String username);
    Optional<User> findByTenantIdAndEmail(String tenantId, String email);
    boolean existsByTenantIdAndUsername(String tenantId, String username);
    boolean existsByTenantIdAndEmail(String tenantId, String email);
    long countByTenantIdAndActiveTrue(String tenantId);
}
