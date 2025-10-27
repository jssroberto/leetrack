import { Component } from '@angular/core';
import { AuthSection } from "../auth-section/auth-section";

@Component({
  selector: 'app-signup',
  imports: [AuthSection],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

}
