package com.cloudguard.alert.dto;
import java.util.List;
public record AlertDetailDto(
    AlertDto alert,
    List<AlertCommentDto> comments,
    List<AlertTimelineDto> timeline
) {}
