package com.example.multitenant.web.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

public class PagedResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;

    public PagedResponse() {}

    public static <E, T> PagedResponse<T> from(Page<E> entityPage, Function<E, T> mapper) {
        PagedResponse<T> response = new PagedResponse<>();
        response.content = entityPage.getContent().stream().map(mapper).toList();
        response.page = entityPage.getNumber();
        response.size = entityPage.getSize();
        response.totalElements = entityPage.getTotalElements();
        response.totalPages = entityPage.getTotalPages();
        response.last = entityPage.isLast();
        return response;
    }

    public List<T> getContent() { return content; }
    public int getPage() { return page; }
    public int getSize() { return size; }
    public long getTotalElements() { return totalElements; }
    public int getTotalPages() { return totalPages; }
    public boolean isLast() { return last; }
}
