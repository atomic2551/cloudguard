package com.cloudguard.dashboard.dto;

import java.util.List;

public class DashboardSummaryDto {
    private int overallSecurityScore;
    private CategoryScores categoryScores;
    private Metrics metrics;
    private List<AlertTrend> alertsTrend;
    private List<SeverityDistribution> severityDistribution;
    private List<Recommendation> topRecommendations;

    public int getOverallSecurityScore() { return overallSecurityScore; }
    public void setOverallSecurityScore(int overallSecurityScore) { this.overallSecurityScore = overallSecurityScore; }
    public CategoryScores getCategoryScores() { return categoryScores; }
    public void setCategoryScores(CategoryScores categoryScores) { this.categoryScores = categoryScores; }
    public Metrics getMetrics() { return metrics; }
    public void setMetrics(Metrics metrics) { this.metrics = metrics; }
    public List<AlertTrend> getAlertsTrend() { return alertsTrend; }
    public void setAlertsTrend(List<AlertTrend> alertsTrend) { this.alertsTrend = alertsTrend; }
    public List<SeverityDistribution> getSeverityDistribution() { return severityDistribution; }
    public void setSeverityDistribution(List<SeverityDistribution> severityDistribution) { this.severityDistribution = severityDistribution; }
    public List<Recommendation> getTopRecommendations() { return topRecommendations; }
    public void setTopRecommendations(List<Recommendation> topRecommendations) { this.topRecommendations = topRecommendations; }

    public static class CategoryScores {
        private int iam;
        private int network;
        private int storage;
        private int logging;
        private int compute;

        public int getIam() { return iam; }
        public void setIam(int iam) { this.iam = iam; }
        public int getNetwork() { return network; }
        public void setNetwork(int network) { this.network = network; }
        public int getStorage() { return storage; }
        public void setStorage(int storage) { this.storage = storage; }
        public int getLogging() { return logging; }
        public void setLogging(int logging) { this.logging = logging; }
        public int getCompute() { return compute; }
        public void setCompute(int compute) { this.compute = compute; }
    }

    public static class Metrics {
        private long totalAlerts;
        private long criticalAlerts;
        private long highAlerts;
        private long openIncidents;
        private long investigatingIncidents;
        private long criticalFindings;
        private long openFindings;
        private long activeCloudAccounts;

        public long getTotalAlerts() { return totalAlerts; }
        public void setTotalAlerts(long totalAlerts) { this.totalAlerts = totalAlerts; }
        public long getCriticalAlerts() { return criticalAlerts; }
        public void setCriticalAlerts(long criticalAlerts) { this.criticalAlerts = criticalAlerts; }
        public long getHighAlerts() { return highAlerts; }
        public void setHighAlerts(long highAlerts) { this.highAlerts = highAlerts; }
        public long getOpenIncidents() { return openIncidents; }
        public void setOpenIncidents(long openIncidents) { this.openIncidents = openIncidents; }
        public long getInvestigatingIncidents() { return investigatingIncidents; }
        public void setInvestigatingIncidents(long investigatingIncidents) { this.investigatingIncidents = investigatingIncidents; }
        public long getCriticalFindings() { return criticalFindings; }
        public void setCriticalFindings(long criticalFindings) { this.criticalFindings = criticalFindings; }
        public long getOpenFindings() { return openFindings; }
        public void setOpenFindings(long openFindings) { this.openFindings = openFindings; }
        public long getActiveCloudAccounts() { return activeCloudAccounts; }
        public void setActiveCloudAccounts(long activeCloudAccounts) { this.activeCloudAccounts = activeCloudAccounts; }
    }

    public static class AlertTrend {
        private String date;
        private int critical;
        private int high;
        private int medium;
        private int low;

        public AlertTrend() {}
        public AlertTrend(String date, int critical, int high, int medium, int low) {
            this.date = date;
            this.critical = critical;
            this.high = high;
            this.medium = medium;
            this.low = low;
        }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public int getCritical() { return critical; }
        public void setCritical(int critical) { this.critical = critical; }
        public int getHigh() { return high; }
        public void setHigh(int high) { this.high = high; }
        public int getMedium() { return medium; }
        public void setMedium(int medium) { this.medium = medium; }
        public int getLow() { return low; }
        public void setLow(int low) { this.low = low; }
    }

    public static class SeverityDistribution {
        private String name;
        private long value;
        private String color;

        public SeverityDistribution() {}
        public SeverityDistribution(String name, long value, String color) {
            this.name = name;
            this.value = value;
            this.color = color;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public long getValue() { return value; }
        public void setValue(long value) { this.value = value; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }

    public static class Recommendation {
        private String priority;
        private String text;
        private String effort;

        public Recommendation() {}
        public Recommendation(String priority, String text, String effort) {
            this.priority = priority;
            this.text = text;
            this.effort = effort;
        }

        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public String getEffort() { return effort; }
        public void setEffort(String effort) { this.effort = effort; }
    }
}
