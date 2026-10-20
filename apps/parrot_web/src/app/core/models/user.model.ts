export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  coverUrl: string;
  bio: string;
  work?: string;
  education?: string;
  relationship?: string;
  inhabitance?: string;
  provenance?: string;
  memberSince: string;
}
