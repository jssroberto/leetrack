import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthSection } from "../auth-section/auth-section";
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [AuthSection, ReactiveFormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  registerForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit = () => {  
    this.errorMessage = '';
    this.cdr.detectChanges(); 

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.cdr.detectChanges(); 
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges(); 

    const { email, password } = this.registerForm.value;

    this.authService.register(email, password).subscribe({
      next: (user) => {
        console.log('User registered:', user);
        
        // Auto-login después del registro
        this.authService.login(email, password).subscribe({
          next: () => {
            this.isLoading = false;
            this.cdr.detectChanges(); 
            this.router.navigate(['/main/dashboard']); 
          },
          error: (loginError) => {
            this.isLoading = false;
            this.errorMessage = 'Registration successful but login failed. Please login manually.';
            this.cdr.detectChanges(); 
            
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
        
        this.cdr.detectChanges(); 
        console.error('Registration error:', error);
      }
    });
  }

  hasError(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.touched || control.dirty));
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