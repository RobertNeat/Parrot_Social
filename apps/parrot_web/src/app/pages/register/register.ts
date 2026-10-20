import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { passwordMatchValidator } from '../../core/validators/password-match.validator';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.group(
    {
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator('password', 'confirmPassword') },
  );

  readonly submitted = signal(false);

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      return;
    }
    const { username, email } = this.form.getRawValue();
    const ok = this.auth.register(username ?? '', email ?? '');
    if (ok) {
      this.router.navigateByUrl('/onboarding');
    }
  }
}
