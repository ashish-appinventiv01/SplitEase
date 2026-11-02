export interface CreateGroupPayload {
    name: string;
    description?: string;
    members?: string[];
  }
  
  export interface GroupMemberResponse {
    userId: string;
    name: string;
    email: string;
  }
  
  export interface GroupResponse {
    id: string;
    name: string;
    description?: string;
    createdBy: string;
    members: GroupMemberResponse[];
    createdAt: Date;
    updatedAt: Date;
  }