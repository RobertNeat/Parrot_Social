import { Component, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import {
  PersonalInfoForm,
  PersonalInfoValue,
} from '../../shared/components/personal-info-form/personal-info-form';

@Component({
  selector: 'app-settings',
  imports: [PersonalInfoForm],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  readonly saved = signal(false);

  constructor(readonly auth: AuthService) {}

  save(value: PersonalInfoValue): void {
    this.auth.updateProfile(value);
    this.saved.set(true);
  }
}
