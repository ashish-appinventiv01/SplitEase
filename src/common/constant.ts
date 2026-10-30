import { ErrorCode } from "../enum/enum";

export const APP_CONSTANTS = {
    API_PREFIX: "/api/v1",
    DEFAULT_PORT: 3000,
  
    PAGINATION: {
      DEFAULT_PAGE: 1,
      DEFAULT_LIMIT: 20,
      MAX_LIMIT: 100
    },
  
    JWT: {
      ACCESS_TOKEN_EXPIRY: "15m",
      REFRESH_TOKEN_EXPIRY: "7d"
    }
  } as const;
  
  export const ErrorMessage: Record<ErrorCode, string> = {
    [ErrorCode.VALIDATION_ERROR]: "The request data is invalid.",
    [ErrorCode.DEVICE_ID_REQUIRED]: "Device id is required.",
    [ErrorCode.DEVICE_TYPE_REQUIRED]: "Device type is required.",
    [ErrorCode.TIMEZONE_REQUIRED]: "Timezone is required.",
    [ErrorCode.LANG_REQUIRED]: "Language is required.",
    [ErrorCode.UNAUTHORIZED]: "You are not authorized to perform this action.",
    [ErrorCode.TOKEN_EXPIRED]: "Your session has expired. Please sign in again.",
    [ErrorCode.REFRESH_TOKEN_REUSED]: "This refresh token has already been used. Please sign in again.",
    [ErrorCode.NOT_GROUP_MEMBER]: "You are not a member of this group.",
    [ErrorCode.NOT_FOUND]: "The requested resource was not found.",
    [ErrorCode.EMAIL_TAKEN]: "This email is already in use.",
    [ErrorCode.ALREADY_MEMBER]: "This user is already a member of the group.",
    [ErrorCode.SPLIT_TOTAL_MISMATCH]: "The split amounts do not add up to the total.",
    [ErrorCode.BALANCE_NOT_SETTLED]: "The balance has not been settled.",
    [ErrorCode.TOO_MANY_ATTEMPTS]: "Too many attempts. Please try again later.",
    [ErrorCode.INTERNAL_SERVER_ERROR]: "Internal server error.",
  };