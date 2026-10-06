package com.example.project_k_schoolhub.mapper;

import org.springframework.stereotype.Component;

import com.example.project_k_schoolhub.dto.StudentRequest;
import com.example.project_k_schoolhub.dto.StudentResponse;
import com.example.project_k_schoolhub.entity.Student;

@Component
public class StudentMapper {

	public Student toEntity(StudentRequest request) {
		Student student = new Student();
		updateEntity(student, request);
		return student;
	}

	public void updateEntity(Student student, StudentRequest request) {
		student.setName(request.name());
		student.setAge(request.age());
		student.setCourse(request.course());
		student.setContactNumber(request.contactNumber());
	}

	public StudentResponse toResponse(Student student) {
		return new StudentResponse(
				student.getStudentId(),
				student.getName(),
				student.getAge(),
				student.getCourse(),
				student.getContactNumber());
	}
}