import { Component, EventEmitter, OnChanges, Output, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UserProfile } from '../../../core/models/user.model';
import { MediaUploadService } from '../../../core/services/media-upload.service';

export interface PersonalInfoValue {
  firstName: string;
  lastName: string;
  bio: string;
  relationship: string;
  inhabitance: string;
  education: string;
  provenance: string;
  work: string;
  avatarAttachHandle?: string;
  coverAttachHandle?: string;
}

type ImageSlot = 'avatar' | 'cover';

@Component({
  selector: 'app-personal-info-form',
  imports: [ReactiveFormsModule],
  templateUrl: './personal-info-form.html',
  styleUrl: './personal-info-form.css',
})
export class PersonalInfoForm implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly mediaUpload = inject(MediaUploadService);

  readonly user = input<UserProfile | null>(null);
  readonly showSkip = input(false);

  @Output() save = new EventEmitter<PersonalInfoValue>();
  @Output() skip = new EventEmitter<void>();

  // Preview defaults to the current profile image (real avatar or the mapper's own fallback
  // silhouette - UserProfile can't distinguish the two, same as the Profile page's own <img>).
  readonly avatarPreviewUrl = signal<string | null>(null);
  readonly coverPreviewUrl = signal<string | null>(null);
  readonly avatarAttachHandle = signal<string | undefined>(undefined);
  readonly coverAttachHandle = signal<string | undefined>(undefined);
  readonly avatarUploading = signal(false);
  readonly coverUploading = signal(false);

  private avatarObjectUrl: string | null = null;
  private coverObjectUrl: string | null = null;

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
      if (this.avatarPreviewUrl() === null) {
        this.avatarPreviewUrl.set(user.avatarUrl);
      }
      if (this.coverPreviewUrl() === null) {
        this.coverPreviewUrl.set(user.coverUrl);
      }
    }
  }

  async onFileSelected(slot: ImageSlot, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Allow re-selecting the same file to fire change again.
    input.value = '';
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const previewSignal = slot === 'avatar' ? this.avatarPreviewUrl : this.coverPreviewUrl;
    const uploadingSignal = slot === 'avatar' ? this.avatarUploading : this.coverUploading;
    const handleSignal = slot === 'avatar' ? this.avatarAttachHandle : this.coverAttachHandle;

    this.revokeObjectUrl(slot);
    if (slot === 'avatar') {
      this.avatarObjectUrl = objectUrl;
    } else {
      this.coverObjectUrl = objectUrl;
    }
    previewSignal.set(objectUrl);
    uploadingSignal.set(true);

    try {
      const media = await this.mediaUpload.upload(file);
      handleSignal.set(media.attachHandle);
    } catch {
      // Upload failed - fall back to whatever was shown before (current profile image, or icon).
      this.revokeObjectUrl(slot);
      handleSignal.set(undefined);
      previewSignal.set(
        slot === 'avatar' ? (this.user()?.avatarUrl ?? null) : (this.user()?.coverUrl ?? null),
      );
    } finally {
      uploadingSignal.set(false);
    }
  }

  private revokeObjectUrl(slot: ImageSlot): void {
    if (slot === 'avatar' && this.avatarObjectUrl) {
      URL.revokeObjectURL(this.avatarObjectUrl);
      this.avatarObjectUrl = null;
    }
    if (slot === 'cover' && this.coverObjectUrl) {
      URL.revokeObjectURL(this.coverObjectUrl);
      this.coverObjectUrl = null;
    }
  }

  get isUploading(): boolean {
    return this.avatarUploading() || this.coverUploading();
  }

  submit(): void {
    if (this.isUploading) return;

    const value: PersonalInfoValue = {
      ...(this.form.getRawValue() as Omit<
        PersonalInfoValue,
        'avatarAttachHandle' | 'coverAttachHandle'
      >),
      // Only included when the user actually picked a new image this session - omitting the key
      // entirely (not sending it as undefined) is what makes the backend treat it as "unchanged".
      ...(this.avatarAttachHandle() ? { avatarAttachHandle: this.avatarAttachHandle() } : {}),
      ...(this.coverAttachHandle() ? { coverAttachHandle: this.coverAttachHandle() } : {}),
    };
    this.save.emit(value);
  }
}
