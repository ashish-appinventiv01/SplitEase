
import { DeviceType } from "../enum/enum";

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
}

export interface DeviceHeaders {
  device_id: string;
  device_type: DeviceType;
  timezone: string;
  lang: "en" | "hi";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}
