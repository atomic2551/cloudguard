package com.cloudguard.incident.entity;

import com.cloudguard.alert.entity.Alert;
import com.cloudguard.user.entity.User;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "incident_alerts")
public class IncidentAlert {
    @EmbeddedId
    private IncidentAlertId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("incidentId")
    @JoinColumn(name = "incident_id")
    private Incident incident;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("alertId")
    @JoinColumn(name = "alert_id")
    private Alert alert;

    @Column(name = "linked_at", nullable = false, updatable = false)
    private OffsetDateTime linkedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_by")
    private User linkedBy;

    @PrePersist
    protected void onCreate() {
        if (linkedAt == null) linkedAt = OffsetDateTime.now();
    }

    // Getters and setters
    public IncidentAlertId getId() { return id; }
    public void setId(IncidentAlertId id) { this.id = id; }
    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }
    public Alert getAlert() { return alert; }
    public void setAlert(Alert alert) { this.alert = alert; }
    public OffsetDateTime getLinkedAt() { return linkedAt; }
    public void setLinkedAt(OffsetDateTime linkedAt) { this.linkedAt = linkedAt; }
    public User getLinkedBy() { return linkedBy; }
    public void setLinkedBy(User linkedBy) { this.linkedBy = linkedBy; }
}
