package com.cloudguard.alert.dto;

public record UpdateAlertStatusDto(
    String status,
    String comment
) {}
