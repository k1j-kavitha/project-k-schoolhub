import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Student, StudentRequest } from '../models/student.model';

@Injectable({ providedIn: 'root' })
export class StudentApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/students';

  getStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(this.endpoint);
  }

  getStudent(studentId: number): Observable<Student> {
    return this.http.get<Student>(`${this.endpoint}/${studentId}`);
  }

  createStudent(request: StudentRequest): Observable<Student> {
    return this.http.post<Student>(this.endpoint, request);
  }

  updateStudent(studentId: number, request: StudentRequest): Observable<Student> {
    return this.http.put<Student>(`${this.endpoint}/${studentId}`, request);
  }

  deleteStudent(studentId: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${studentId}`);
  }
}
