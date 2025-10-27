import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-auth-section',
  imports: [],
  templateUrl: './auth-section.html',
  styleUrl: './auth-section.css',
})
export class AuthSection {
  @Input() title!: string;
  @Input() text!: string;

  @Input() textLink!: string;
  @Input() link!: string;
}
