import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-section',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './auth-section.html',
  styleUrl: './auth-section.css',
})
export class AuthSection {
  @Input() title: string = '';
  @Input() text: string = '';
  @Input() textLink: string = '';
  @Input() link: string = '';
  @Input() formGroup!: FormGroup;
  @Input() onSubmit!: () => void;
  @Input() buttonText: string = '';
  @Input() isLoading: boolean = false;
  @Input() errorMessage: string = '';
}
