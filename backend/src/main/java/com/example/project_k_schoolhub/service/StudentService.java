package com.example.project_k_schoolhub.service;

import java.util.List;

import com.example.project_k_schoolhub.dto.StudentRequest;
import com.example.project_k_schoolhub.dto.StudentResponse;

public interface StudentService {
	StudentResponse createStudent(StudentRequest request);

	List<StudentResponse> getAllStudents();

	StudentResponse getStudentById(Long studentId);

	StudentResponse updateStudent(Long studentId, StudentRequest request);

	void deleteStudent(Long studentId);
}