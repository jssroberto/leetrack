import { Component } from '@angular/core';
import { AuthSection } from '../auth-section/auth-section';

@Component({
  selector: 'app-login',
  imports: [AuthSection],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {}
