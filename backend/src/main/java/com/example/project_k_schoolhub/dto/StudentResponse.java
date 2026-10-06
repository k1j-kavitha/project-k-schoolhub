package com.example.project_k_schoolhub.dto;

public record StudentResponse(
		Long studentId,
		String name,
		Integer age,
		String course,
		String contactNumber) {
}