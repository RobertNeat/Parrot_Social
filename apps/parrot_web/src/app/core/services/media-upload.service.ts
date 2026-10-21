import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { MediaDto } from '@parrot-social/shared-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MediaUploadService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/media`;

  /** POSTs a FormData multipart body - do not set Content-Type manually, HttpClient/the browser
   * need to generate the multipart boundary themselves. */
  async upload(file: File): Promise<MediaDto> {
    const formData = new FormData();
    formData.append('file', file);
    return firstValueFrom(this.http.post<MediaDto>(`${this.baseUrl}/upload`, formData));
  }
}
