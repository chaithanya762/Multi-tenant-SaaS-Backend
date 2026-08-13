package com.example.multitenant.web.dto;

public class ApiKeyCreationResponse {

    private String id;
    private String name;
    private String keyPrefix;
    private String rawKey;
    private String message;

    public ApiKeyCreationResponse() {}

    public ApiKeyCreationResponse(String id, String name, String keyPrefix, String rawKey, String message) {
        this.id = id;
        this.name = name;
        this.keyPrefix = keyPrefix;
        this.rawKey = rawKey;
        this.message = message;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getKeyPrefix() { return keyPrefix; }
    public void setKeyPrefix(String keyPrefix) { this.keyPrefix = keyPrefix; }

    public String getRawKey() { return rawKey; }
    public void setRawKey(String rawKey) { this.rawKey = rawKey; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
