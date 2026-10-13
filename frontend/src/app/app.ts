import { Component } from '@angular/core';
import { StudentRegistrationComponent } from './student-registration/student-registration.component';

@Component({
  selector: 'app-root',
  imports: [StudentRegistrationComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
