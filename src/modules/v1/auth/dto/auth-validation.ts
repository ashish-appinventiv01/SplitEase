import { signupSchema } from "./signup.dto";
import { loginSchema } from "./login.dto";
import { refreshTokenSchema } from "./refresh-token.dto";

export class AuthValidation {
  public static readonly signup = signupSchema;
  public static readonly login = loginSchema;
  public static readonly refreshToken = refreshTokenSchema;
}