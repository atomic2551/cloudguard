package com.cloudguard.alert.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateAlertCommentDto {

    @NotBlank(message = "Comment content cannot be empty")
    private String content;

    public CreateAlertCommentDto() {}

    public CreateAlertCommentDto(String content) {
        this.content = content;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
