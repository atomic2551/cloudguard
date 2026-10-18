package com.cloudguard.cloud.repository;

import com.cloudguard.cloud.entity.CloudAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CloudAccountRepository extends JpaRepository<CloudAccount, UUID> {
    long countByStatus(String status);
}
