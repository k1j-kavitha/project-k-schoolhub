export interface Student {
  studentId: number;
  name: string;
  age: number | null;
  course: string | null;
  contactNumber: string | null;
}

export interface StudentRequest {
  name: string;
  age: number | null;
  course: string | null;
  contactNumber: string | null;
}
