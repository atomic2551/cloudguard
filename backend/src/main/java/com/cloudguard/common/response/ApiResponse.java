package com.cloudguard.common.response;

import java.util.HashMap;
import java.util.Map;

public class ApiResponse {
    public static <T> Map<String, T> success(T data) {
        Map<String, T> response = new HashMap<>();
        response.put("data", data);
        return response;
    }
}
