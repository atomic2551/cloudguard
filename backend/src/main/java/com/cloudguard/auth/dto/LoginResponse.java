package com.cloudguard.auth.dto;

public class LoginResponse {
    private String token;
    private String tokenType;
    private AuthUserDto user;

    public LoginResponse(String token, String tokenType, AuthUserDto user) {
        this.token = token;
        this.tokenType = tokenType;
        this.user = user;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    public AuthUserDto getUser() { return user; }
    public void setUser(AuthUserDto user) { this.user = user; }
}
