package com.cloudguard.report.dto;

import java.util.List;
import java.util.Map;

public class SecurityReportDto {
    private String id;
    private String title;
    private String periodStart;
    private String periodEnd;
    private int overallScore;
    private Map<String, Integer> categoryScores;
    private ReportSummary summary;
    private List<TopRecommendation> topRecommendations;
    private String generatedAt;

    public static class ReportSummary {
        private long totalAlerts;
        private long resolvedAlerts;
        private long openIncidents;
        private long resolvedIncidents;
        private long criticalFindings;
        private long openFindings;

        public long getTotalAlerts() { return totalAlerts; }
        public void setTotalAlerts(long totalAlerts) { this.totalAlerts = totalAlerts; }
        public long getResolvedAlerts() { return resolvedAlerts; }
        public void setResolvedAlerts(long resolvedAlerts) { this.resolvedAlerts = resolvedAlerts; }
        public long getOpenIncidents() { return openIncidents; }
        public void setOpenIncidents(long openIncidents) { this.openIncidents = openIncidents; }
        public long getResolvedIncidents() { return resolvedIncidents; }
        public void setResolvedIncidents(long resolvedIncidents) { this.resolvedIncidents = resolvedIncidents; }
        public long getCriticalFindings() { return criticalFindings; }
        public void setCriticalFindings(long criticalFindings) { this.criticalFindings = criticalFindings; }
        public long getOpenFindings() { return openFindings; }
        public void setOpenFindings(long openFindings) { this.openFindings = openFindings; }
    }

    public static class TopRecommendation {
        private String priority;
        private String text;
        private String effort;

        public TopRecommendation() {}
        public TopRecommendation(String priority, String text, String effort) {
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

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getPeriodStart() { return periodStart; }
    public void setPeriodStart(String periodStart) { this.periodStart = periodStart; }
    public String getPeriodEnd() { return periodEnd; }
    public void setPeriodEnd(String periodEnd) { this.periodEnd = periodEnd; }
    public int getOverallScore() { return overallScore; }
    public void setOverallScore(int overallScore) { this.overallScore = overallScore; }
    public Map<String, Integer> getCategoryScores() { return categoryScores; }
    public void setCategoryScores(Map<String, Integer> categoryScores) { this.categoryScores = categoryScores; }
    public ReportSummary getSummary() { return summary; }
    public void setSummary(ReportSummary summary) { this.summary = summary; }
    public List<TopRecommendation> getTopRecommendations() { return topRecommendations; }
    public void setTopRecommendations(List<TopRecommendation> topRecommendations) { this.topRecommendations = topRecommendations; }
    public String getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(String generatedAt) { this.generatedAt = generatedAt; }
}
