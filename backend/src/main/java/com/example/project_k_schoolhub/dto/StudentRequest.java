package com.example.project_k_schoolhub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StudentRequest(
		@NotBlank @Size(max = 100) String name,
		Integer age,
		@Size(max = 100) String course,
		@Size(max = 15) String contactNumber) {
}