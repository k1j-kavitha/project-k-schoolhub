package com.example.project_k_schoolhub.controller;

import java.net.URI;
import java.util.List;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.project_k_schoolhub.dto.StudentRequest;
import com.example.project_k_schoolhub.dto.StudentResponse;
import com.example.project_k_schoolhub.service.StudentService;

@RestController
@RequestMapping("/api/students")
public class StudentController {

	private final StudentService studentService;

	public StudentController(StudentService studentService) {
		this.studentService = studentService;
	}

	@PostMapping
	public ResponseEntity<StudentResponse> createStudent(@Valid @RequestBody StudentRequest request) {
		StudentResponse created = studentService.createStudent(request);
		return ResponseEntity.created(URI.create("/api/students/" + created.studentId())).body(created);
	}

	@GetMapping
	public List<StudentResponse> getAllStudents() {
		return studentService.getAllStudents();
	}

	@GetMapping("/{studentId}")
	public StudentResponse getStudentById(@PathVariable Long studentId) {
		return studentService.getStudentById(studentId);
	}

	@PutMapping("/{studentId}")
	public StudentResponse updateStudent(
			@PathVariable Long studentId,
			@Valid @RequestBody StudentRequest request) {
		return studentService.updateStudent(studentId, request);
	}

	@DeleteMapping("/{studentId}")
	public ResponseEntity<Void> deleteStudent(@PathVariable Long studentId) {
		studentService.deleteStudent(studentId);
		return ResponseEntity.noContent().build();
	}
}