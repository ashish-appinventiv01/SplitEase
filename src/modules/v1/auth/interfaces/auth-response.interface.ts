export interface AuthUserResponse {
    id: string;
    name: string;
    email: string;
  }
  
  export interface AuthTokenResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: "Bearer";
    expiresIn: number;
  }
  
  export interface AuthResponse {
    user: AuthUserResponse;
    tokens: AuthTokenResponse;
  }