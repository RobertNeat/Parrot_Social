import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

// Konta z deploy/liquibase/seed/001-seed-users.xml; hasło wspólne dla wszystkich
// seed userów - zob. deploy/liquibase/seed/008-seed-dev-passwords.xml. Dostępne
// tylko gdy backend wystartował z PARROT_LIQUIBASE_CONTEXTS zawierającym "seed".
export interface DemoAccount {
  readonly label: string;
  readonly identifier: string;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { label: 'John Davis', identifier: 'john.davis' },
  { label: 'Jamal Pearson', identifier: 'jamal.pearson' },
  { label: 'Solomon Rhodes', identifier: 'solomon.rhodes' },
  { label: 'John Strong', identifier: 'john.strong' },
  { label: 'Nevaeh Arias', identifier: 'nevaeh.arias' },
  { label: 'Marvin Barlow', identifier: 'marvin.barlow' },
  { label: 'Tomas Gutierrez', identifier: 'tomas.gutierrez' },
  { label: 'Allan Bullock', identifier: 'allan.bullock' },
  { label: 'Zakaria McCoy', identifier: 'zakaria.mccoy' },
  { label: 'Seamus Ross', identifier: 'seamus.ross' },
];

const DEMO_ACCOUNT_PASSWORD = 'parrot123';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
  });

  readonly submitted = signal(false);
  readonly error = signal(false);
  readonly demoAccountsOpen = signal(false);
  readonly demoAccounts = DEMO_ACCOUNTS;

  toggleDemoAccounts(): void {
    this.demoAccountsOpen.set(!this.demoAccountsOpen());
  }

  fillDemoAccount(account: DemoAccount): void {
    this.form.setValue({ identifier: account.identifier, password: DEMO_ACCOUNT_PASSWORD });
    this.demoAccountsOpen.set(false);
  }

  async submit(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid) {
      return;
    }
    const { identifier, password } = this.form.getRawValue();
    const ok = await this.auth.login(identifier ?? '', password ?? '');
    this.error.set(!ok);
    if (ok) {
      this.router.navigateByUrl('/feed');
    }
  }
}
