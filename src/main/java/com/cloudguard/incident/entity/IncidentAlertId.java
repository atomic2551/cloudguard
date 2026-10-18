package com.cloudguard.incident.entity;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class IncidentAlertId implements Serializable {
    private UUID incidentId;
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
        if (o == null || getClass() != o.getClass()) return false;
        IncidentAlertId that = (IncidentAlertId) o;
        return Objects.equals(incidentId, that.incidentId) && Objects.equals(alertId, that.alertId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(incidentId, alertId);
    }
}
