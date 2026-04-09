package com.hrm.dto;

import lombok.Data;
import java.util.List;

@Data
public class RoleDTO {
    private String id;
    private String name;
    private String description;
    private List<String> permissions; // List of codes
    private String createdAt;
}
