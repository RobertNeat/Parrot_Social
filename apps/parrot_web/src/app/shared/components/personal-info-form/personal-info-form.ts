import { Component, EventEmitter, OnChanges, Output, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UserProfile } from '../../../core/models/user.model';

export interface PersonalInfoValue {
  firstName: string;
  lastName: string;
  bio: string;
  relationship: string;
  inhabitance: string;
  education: string;
  provenance: string;
  work: string;
}

@Component({
  selector: 'app-personal-info-form',
  imports: [ReactiveFormsModule],
  templateUrl: './personal-info-form.html',
  styleUrl: './personal-info-form.css',
})
export class PersonalInfoForm implements OnChanges {
  private readonly fb = inject(FormBuilder);

  readonly user = input<UserProfile | null>(null);
  readonly showSkip = input(false);

  @Output() save = new EventEmitter<PersonalInfoValue>();
  @Output() skip = new EventEmitter<void>();

  readonly form = this.fb.group({
    firstName: [''],
    lastName: [''],
    bio: [''],
    relationship: [''],
    inhabitance: [''],
    education: [''],
    provenance: [''],
    work: [''],
  });

  ngOnChanges(): void {
    const user = this.user();
    if (user) {
      this.form.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        relationship: user.relationship ?? '',
        inhabitance: user.inhabitance ?? '',
        education: user.education ?? '',
        provenance: user.provenance ?? '',
        work: user.work ?? '',
      });
    }
  }

  submit(): void {
    this.save.emit(this.form.getRawValue() as PersonalInfoValue);
  }
}
