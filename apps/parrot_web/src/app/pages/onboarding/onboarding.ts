import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  PersonalInfoForm,
  PersonalInfoValue,
} from '../../shared/components/personal-info-form/personal-info-form';

@Component({
  selector: 'app-onboarding',
  imports: [PersonalInfoForm],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
})
export class Onboarding {
  constructor(
    readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  save(value: PersonalInfoValue): void {
    this.auth.updateProfile(value);
    this.router.navigateByUrl('/feed');
  }

  skip(): void {
    this.router.navigateByUrl('/feed');
  }
}
