package com.example.multitenant.web.exception;

public class QuotaExceededException extends RuntimeException {
    private final String resource;
    private final int limit;

    public QuotaExceededException(String resource, int limit) {
        super(String.format("%s quota exceeded. Your plan allows a maximum of %d %s.", resource, limit, resource.toLowerCase()));
        this.resource = resource;
        this.limit = limit;
    }

    public String getResource() { return resource; }
    public int getLimit() { return limit; }
}
