package com.cloudguard.incident.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * JPA entity for the incident_alerts join table.
 * Used only for aggregate queries (e.g., counting alerts per incident).
 * Alerts are not eagerly loaded through this to avoid pagination issues.
 */
@Entity
@Table(name = "incident_alerts")
public class IncidentAlert {

    @EmbeddedId
    private IncidentAlertId id;

    @Column(name = "incident_id", insertable = false, updatable = false)
    private UUID incidentId;

    @Column(name = "alert_id", insertable = false, updatable = false)
    private UUID alertId;

    @Column(name = "linked_at", nullable = false)
    private OffsetDateTime linkedAt;

    @Column(name = "linked_by")
    private UUID linkedBy;

    @PrePersist
    protected void onCreate() {
        if (linkedAt == null) linkedAt = OffsetDateTime.now();
    }

    public IncidentAlertId getId() { return id; }
    public void setId(IncidentAlertId id) { this.id = id; }
    public UUID getIncidentId() { return incidentId; }
    public void setIncidentId(UUID incidentId) { this.incidentId = incidentId; }
    public UUID getAlertId() { return alertId; }
    public void setAlertId(UUID alertId) { this.alertId = alertId; }
    public OffsetDateTime getLinkedAt() { return linkedAt; }
    public void setLinkedAt(OffsetDateTime linkedAt) { this.linkedAt = linkedAt; }
    public UUID getLinkedBy() { return linkedBy; }
    public void setLinkedBy(UUID linkedBy) { this.linkedBy = linkedBy; }

    @Embeddable
    public static class IncidentAlertId implements java.io.Serializable {
        @Column(name = "incident_id")
        private UUID incidentId;

        @Column(name = "alert_id")
        private UUID alertId;

        public IncidentAlertId() {}
        public IncidentAlertId(UUID incidentId, UUID alertId) {
            this.incidentId = incidentId;
            this.alertId = alertId;
        }

        public UUID getIncidentId() { return incidentId; }
        public void setIncidentId(UUID incidentId) { this.incidentId = incidentId; }
        public UUID getAlertId() { return alertId; }
        public void setAlertId(UUID alertId) { this.alertId = alertId; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof IncidentAlertId)) return false;
            IncidentAlertId that = (IncidentAlertId) o;
            return java.util.Objects.equals(incidentId, that.incidentId) &&
                   java.util.Objects.equals(alertId, that.alertId);
        }

        @Override
        public int hashCode() {
            return java.util.Objects.hash(incidentId, alertId);
        }
    }
}
