export interface UpdateUserPayload {
    name?: string;
  }
  
  export interface UserResponse {
    id: string;
    name: string;
    email: string;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }