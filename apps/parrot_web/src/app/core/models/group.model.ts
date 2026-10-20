export interface GroupSummary {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

export interface Group extends GroupSummary {
  ownerName: string;
  members: string[];
  joined: boolean;
}
