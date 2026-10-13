import { HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Student, StudentRequest } from '../models/student.model';
import { StudentApiService } from '../services/student-api.service';

type Feedback = { kind: 'success' | 'error'; text: string };

@Component({
  selector: 'app-student-registration',
  imports: [ReactiveFormsModule],
  templateUrl: './student-registration.component.html',
  styleUrl: './student-registration.component.css'
})
export class StudentRegistrationComponent {
  private readonly api = inject(StudentApiService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly students = signal<Student[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly feedback = signal<Feedback | null>(null);
  readonly searchTerm = signal('');
  readonly viewingStudent = signal<Student | null>(null);
  readonly detailLoading = signal(false);
  readonly editingStudentId = signal<number | null>(null);
  readonly visibleStudents = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) return this.students();
    return this.students().filter((student) =>
      [student.name, student.course ?? '', student.contactNumber ?? '', String(student.studentId)]
        .some((value) => value.toLowerCase().includes(query))
    );
  });

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    age: new FormControl<number | null>(null),
    course: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    contactNumber: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(15)] })
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) this.loadStudents();
  }

  loadStudents(): void {
    this.loading.set(true);
    this.api.getStudents().subscribe({
      next: (students) => {
        this.students.set(students);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.showError(error);
      }
    });
  }

  saveStudent(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.feedback.set({ kind: 'error', text: 'Please correct the highlighted fields.' });
      return;
    }

    const values = this.form.getRawValue();
    const request: StudentRequest = {
      name: values.name.trim(),
      age: values.age,
      course: values.course.trim() || null,
      contactNumber: values.contactNumber.trim() || null
    };
    const studentId = this.editingStudentId();
    this.saving.set(true);

    const operation = studentId === null
      ? this.api.createStudent(request)
      : this.api.updateStudent(studentId, request);

    operation.subscribe({
      next: (student) => {
        this.students.update((students) => studentId === null
          ? [student, ...students]
          : students.map((current) => current.studentId === student.studentId ? student : current));
        this.saving.set(false);
        this.feedback.set({
          kind: 'success',
          text: studentId === null ? 'Student registered successfully.' : 'Student details updated successfully.'
        });
        this.resetForm();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.showError(error);
      }
    });
  }

  editStudent(student: Student): void {
    this.viewingStudent.set(null);
    this.editingStudentId.set(student.studentId);
    this.form.setValue({
      name: student.name,
      age: student.age,
      course: student.course ?? '',
      contactNumber: student.contactNumber ?? ''
    });
    this.feedback.set(null);
  }

  deleteStudent(student: Student): void {
    if (!window.confirm(`Delete ${student.name} from student records?`)) return;

    this.api.deleteStudent(student.studentId).subscribe({
      next: () => {
        this.students.update((students) => students.filter((current) => current.studentId !== student.studentId));
        if (this.viewingStudent()?.studentId === student.studentId) this.viewingStudent.set(null);
        if (this.editingStudentId() === student.studentId) this.resetForm();
        this.feedback.set({ kind: 'success', text: `${student.name} was deleted.` });
      },
      error: (error: unknown) => this.showError(error)
    });
  }

  viewStudent(student: Student): void {
    this.viewingStudent.set(null);
    this.detailLoading.set(true);
    this.api.getStudent(student.studentId).subscribe({
      next: (record) => {
        this.viewingStudent.set(record);
        this.detailLoading.set(false);
      },
      error: (error: unknown) => {
        this.detailLoading.set(false);
        this.showError(error);
      }
    });
  }

  cancelEdit(): void {
    this.resetForm();
    this.feedback.set(null);
  }

  setSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  fieldError(field: 'name' | 'course' | 'contactNumber'): string | null {
    const control = this.form.controls[field];
    if (!control.touched) return null;
    if (control.hasError('required')) return 'Name is required.';
    if (control.hasError('maxlength')) {
      const maxLength = field === 'contactNumber' ? 15 : 100;
      return `Use no more than ${maxLength} characters.`;
    }
    return null;
  }

  private resetForm(): void {
    this.editingStudentId.set(null);
    this.form.reset({ name: '', age: null, course: '', contactNumber: '' });
  }

  private showError(error: unknown): void {
    this.feedback.set({ kind: 'error', text: this.errorMessage(error) });
  }

  private errorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) return 'The request could not be completed. Please try again.';
    if (error.status === 0) return 'Cannot connect to SchoolHub. Check that Spring Boot is running on port 8080.';

    const body = error.error as { detail?: unknown; errors?: Record<string, string>; title?: unknown } | null;
    if (error.status === 400) {
      const details = body?.errors ? Object.entries(body.errors).map(([field, message]) => `${field}: ${message}`).join(' ') : '';
      return details ? `Please check the submitted details. ${details}` : 'The submitted details were not accepted. Please review the form.';
    }
    if (error.status === 404) return 'This student was not found. The record may have been removed.';
    if (error.status >= 500) return 'The server encountered an error. Please try again in a moment.';
    if (typeof body?.detail === 'string') return body.detail;
    if (typeof body?.title === 'string') return body.title;
    return `The request failed (HTTP ${error.status}). Please try again.`;
  }
}
