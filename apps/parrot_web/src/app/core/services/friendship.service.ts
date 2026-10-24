import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { FriendshipDto, FriendshipStatusDto } from '@parrot-social/shared-dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FriendshipService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/friendship`;

  async getStatus(userId: string): Promise<FriendshipStatusDto> {
    return firstValueFrom(this.http.get<FriendshipStatusDto>(`${this.baseUrl}/status/${userId}`));
  }

  async sendRequest(userId: string): Promise<FriendshipDto | null> {
    try {
      return await firstValueFrom(
        this.http.post<FriendshipDto>(`${this.baseUrl}/requests`, { addresseeId: userId }),
      );
    } catch {
      return null;
    }
  }

  async accept(requestId: string): Promise<FriendshipDto | null> {
    try {
      return await firstValueFrom(
        this.http.post<FriendshipDto>(`${this.baseUrl}/requests/${requestId}/accept`, {}),
      );
    } catch {
      return null;
    }
  }

  async decline(requestId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.baseUrl}/requests/${requestId}/decline`, {}));
      return true;
    } catch {
      return false;
    }
  }

  async unfriend(userId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.baseUrl}/${userId}`));
      return true;
    } catch {
      return false;
    }
  }
}
