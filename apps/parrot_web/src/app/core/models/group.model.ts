export interface GroupSummary {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

export interface GroupMember {
  id: string;
  name: string;
}

export interface Group extends GroupSummary {
  ownerId: string;
  ownerName: string;
  members: GroupMember[];
  joined: boolean;
}
