package com.cloudguard.cloud.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "cloud_accounts")
public class CloudAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "account_id", nullable = false, length = 20)
    private String accountId;

    @Column(name = "primary_region", nullable = false, length = 30)
    private String primaryRegion;

    @Column(nullable = false, length = 20)
    private String status;
    
    // Minimal fields since we only need this for relational mapping and name pulling

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
    public String getPrimaryRegion() { return primaryRegion; }
    public void setPrimaryRegion(String primaryRegion) { this.primaryRegion = primaryRegion; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
