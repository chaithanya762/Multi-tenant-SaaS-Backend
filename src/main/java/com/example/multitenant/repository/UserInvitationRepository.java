package com.example.multitenant.repository;

import com.example.multitenant.domain.UserInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserInvitationRepository extends JpaRepository<UserInvitation, String> {
    Optional<UserInvitation> findByToken(String token);
    List<UserInvitation> findByTenantIdAndAcceptedAtIsNull(String tenantId);
}
