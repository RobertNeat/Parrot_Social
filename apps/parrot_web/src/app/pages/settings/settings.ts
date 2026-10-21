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
  readonly error = signal(false);

  constructor(readonly auth: AuthService) {}

  async save(value: PersonalInfoValue): Promise<void> {
    const ok = await this.auth.updateProfile(value);
    this.saved.set(ok);
    this.error.set(!ok);
  }
}
