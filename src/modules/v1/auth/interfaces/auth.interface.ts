import type { SignupDto } from "../dto/signup.dto";
import type { LoginDto } from "../dto/login.dto";
import type { AuthResponse } from "./auth-response.interface";

export interface IAuthService {
    signup(
        payload: SignupDto,
        deviceId: string,
        deviceType: number
      ): Promise<AuthResponse>;
      
    login(
        payload: LoginDto,
        deviceId: string,
        deviceType: number
    ): Promise<AuthResponse>;

    refreshTokens(refreshToken: string): Promise<AuthResponse>;

    logout(userId: string, sessionId: string): Promise<void>;
}