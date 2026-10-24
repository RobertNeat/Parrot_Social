export interface EventItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  startsAt: string;
  location?: string | null;
  organizerId: string;
  organizerName: string;
  interestedCount: number;
  interested: boolean;
}
