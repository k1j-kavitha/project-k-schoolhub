package com.example.project_k_schoolhub.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.project_k_schoolhub.entity.Student;

public interface StudentRepository extends JpaRepository<Student, Long> {
}