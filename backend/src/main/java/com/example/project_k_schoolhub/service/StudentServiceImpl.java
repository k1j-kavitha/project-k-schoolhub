package com.example.project_k_schoolhub.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project_k_schoolhub.dto.StudentRequest;
import com.example.project_k_schoolhub.dto.StudentResponse;
import com.example.project_k_schoolhub.entity.Student;
import com.example.project_k_schoolhub.exception.ResourceNotFoundException;
import com.example.project_k_schoolhub.mapper.StudentMapper;
import com.example.project_k_schoolhub.repository.StudentRepository;

@Service
@Transactional
public class StudentServiceImpl implements StudentService {

	private final StudentRepository studentRepository;
	private final StudentMapper studentMapper;

	public StudentServiceImpl(StudentRepository studentRepository, StudentMapper studentMapper) {
		this.studentRepository = studentRepository;
		this.studentMapper = studentMapper;
	}

	@Override
	public StudentResponse createStudent(StudentRequest request) {
		Student student = studentRepository.save(studentMapper.toEntity(request));
		return studentMapper.toResponse(student);
	}

	@Override
	@Transactional(readOnly = true)
	public List<StudentResponse> getAllStudents() {
		return studentRepository.findAll().stream().map(studentMapper::toResponse).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public StudentResponse getStudentById(Long studentId) {
		return studentMapper.toResponse(findStudent(studentId));
	}

	@Override
	public StudentResponse updateStudent(Long studentId, StudentRequest request) {
		Student student = findStudent(studentId);
		studentMapper.updateEntity(student, request);
		return studentMapper.toResponse(studentRepository.save(student));
	}

	@Override
	public void deleteStudent(Long studentId) {
		studentRepository.delete(findStudent(studentId));
	}

	private Student findStudent(Long studentId) {
		return studentRepository.findById(studentId)
				.orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));
	}
}