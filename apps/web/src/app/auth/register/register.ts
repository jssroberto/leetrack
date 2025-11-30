import { AuthSection } from "../auth-section/auth-section";
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Component, inject } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from "@angular/forms";
import { Router } from "@angular/router";

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [AuthSection, ReactiveFormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService)
  private router = inject(Router)

  registerForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: [this.passwordMatchValidator],
      updateOn: 'change'
    });
  }

  private passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword?.hasError('passwordMismatch') && password?.value === confirmPassword?.value) {
      confirmPassword.setErrors(null);
    }
    return null;
  }

  // se necesita usar arrow function para mantener el contexto de 'this'
  onSubmit = () => {
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const { email, password } = this.registerForm.value;

    this.authService.register(email, password).subscribe({
      next: (user) => {
        console.log('User registered:', user);

        // Auto-login después del registro
        this.authService.login(email, password).subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigate(['/main/index']);
          },
          error: (loginError) => {
            this.isLoading = false;
            this.errorMessage = 'Registration successful but login failed. Please login manually.';

            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);

            console.error('Auto-login error:', loginError);
          }
        });
      },
      error: (error) => {
        this.isLoading = false;

        if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please verify the backend is running.';
        } else if (error.status === 400) {
          this.errorMessage = 'This email is already registered';
        } else if (error.status === 409) {
          this.errorMessage = 'This email is already in use';
        } else {
          this.errorMessage = 'Registration error. Please try again.';
        }

        console.error('Registration error:', error);
      }
    });
  }

  hasError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(field: string): string {
    const control = this.registerForm.get(field);

    if (!control || (!control.touched && !control.dirty)) {
      return '';
    }

    if (control.hasError('required')) {
      return this.getFieldLabel(field) + ' is required';
    }

    if (control.hasError('email')) {
      return 'Please enter a valid email';
    }

    if (control.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Must be at least ${minLength} characters`;
    }

    if (control.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }

    return '';
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password'
    };
    return labels[field] || 'This field';
  }
}