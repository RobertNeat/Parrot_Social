import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { UserSummaryDto } from '@parrot-social/shared-dto';
import { environment } from '../../../environments/environment';

/** The mini-chat contact list sidebar on Feed - distinct OTHER participants across all of the
 * caller's conversations. The mini-chat itself (ChatService) stays on mocks for now; this only
 * replaces the contact list's data source. */
@Injectable({ providedIn: 'root' })
export class ContactsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  async loadContacts(): Promise<UserSummaryDto[]> {
    return firstValueFrom(this.http.get<UserSummaryDto[]>(`${this.baseUrl}/me/contacts`));
  }
}
