import { APP_CONSTANTS } from "../common/constant";
import { configuration } from "../config/configuration";

const deviceParameters = [
  { $ref: "#/components/parameters/DeviceId" },
  { $ref: "#/components/parameters/DeviceType" },
  { $ref: "#/components/parameters/Timezone" },
  { $ref: "#/components/parameters/Lang" },
];

const errorResponse = {
  description: "Request failed",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
    },
  },
};

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "SplitEase API",
    version: "1.0.0",
    description:
      "SplitEase HTTP API. Every route requires the device headers listed below.",
  },
  servers: [
    {
      url: `http://localhost:${configuration.PORT}`,
      description: "Local server",
    },
  ],
  tags: [
    { name: "General", description: "Health and sample responses" },
    {
      name: "Auth",
      description: "Sign up, sign in, refresh tokens, and log out",
    },
    {
      name: "Users",
      description: "Profile and account management for the signed-in user",
    },
  ],
  paths: {
    "/": {
      get: {
        tags: ["General"],
        summary: "Root greeting",
        parameters: deviceParameters,
        responses: {
          "200": {
            description: "Plain text greeting",
            content: {
              "text/plain": {
                schema: { type: "string", example: "Hello World" },
              },
            },
          },
          "400": errorResponse,
        },
      },
    },
    [`${APP_CONSTANTS.API_PREFIX}/test`]: {
      get: {
        tags: ["General"],
        summary: "API version",
        parameters: deviceParameters,
        responses: {
          "200": {
            description: "Current API version",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VersionResponse" },
              },
            },
          },
          "400": errorResponse,
        },
      },
    },
    "/test-created": {
      get: {
        tags: ["General"],
        summary: "Sample created response",
        parameters: deviceParameters,
        responses: {
          "201": {
            description: "Resource created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreatedUserResponse" },
              },
            },
          },
          "400": errorResponse,
        },
      },
    },
    [`${APP_CONSTANTS.API_PREFIX}/auth/signup`]: {
      post: {
        tags: ["Auth"],
        summary: "Create an account",
        description:
          "Registers a user. Tokens in the response are empty until the user signs in.",
        parameters: deviceParameters,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignupRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Account created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthCreatedResponse" },
              },
            },
          },
          "400": errorResponse,
          "409": {
            description: "Email is already registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  statusCode: 409,
                  code: "CONFLICT",
                  message: "An account with this email already exists",
                },
              },
            },
          },
        },
      },
    },
    [`${APP_CONSTANTS.API_PREFIX}/auth/login`]: {
      post: {
        tags: ["Auth"],
        summary: "Sign in",
        description:
          "Checks email and password, then starts a session for the device in the request headers. A new login on the same device replaces the previous session.",
        parameters: deviceParameters,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthSuccessResponse" },
                example: {
                  statusCode: 200,
                  message: "Login successful",
                  data: {
                    user: {
                      id: "674a1c2e8f0b9a0012345678",
                      name: "Rahul",
                      email: "rahul@example.com",
                    },
                    tokens: {
                      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                      tokenType: "Bearer",
                      expiresIn: 900,
                    },
                  },
                },
              },
            },
          },
          "400": errorResponse,
          "401": {
            description: "Unknown email or wrong password",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  statusCode: 401,
                  code: "UNAUTHORIZED",
                  message: "Invalid email or password",
                },
              },
            },
          },
          "403": {
            description: "Account is inactive",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  statusCode: 403,
                  code: "UNAUTHORIZED",
                  message: "This account is inactive",
                },
              },
            },
          },
        },
      },
    },
    [`${APP_CONSTANTS.API_PREFIX}/auth/refresh`]: {
      post: {
        tags: ["Auth"],
        summary: "Refresh tokens",
        description:
          "Exchanges a valid refresh token for a new access token and refresh token. Reusing an old refresh token revokes the session.",
        parameters: [
          ...deviceParameters,
          { $ref: "#/components/parameters/RefreshToken" },
        ],
        responses: {
          "200": {
            description: "Tokens refreshed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthSuccessResponse" },
                example: {
                  statusCode: 200,
                  message: "Tokens refreshed successfully",
                  data: {
                    user: {
                      id: "674a1c2e8f0b9a0012345678",
                      name: "Rahul",
                      email: "rahul@example.com",
                    },
                    tokens: {
                      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                      tokenType: "Bearer",
                      expiresIn: 900,
                    },
                  },
                },
              },
            },
          },
          "400": errorResponse,
          "401": {
            description: "Refresh token is missing, invalid, expired, or reused",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  missing: {
                    summary: "Header missing",
                    value: {
                      statusCode: 401,
                      message: "Refresh token is required",
                    },
                  },
                  invalid: {
                    summary: "Invalid or expired",
                    value: {
                      statusCode: 401,
                      code: "UNAUTHORIZED",
                      message: "Invalid or expired refresh token",
                    },
                  },
                  reused: {
                    summary: "Token already used",
                    value: {
                      statusCode: 401,
                      code: "UNAUTHORIZED",
                      message: "Refresh token reuse detected",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    [`${APP_CONSTANTS.API_PREFIX}/auth/logout`]: {
      post: {
        tags: ["Auth"],
        summary: "Log out",
        description: "Revokes the session attached to the access token.",
        security: [{ bearerAuth: [] }],
        parameters: deviceParameters,
        responses: {
          "200": {
            description: "Logout successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LogoutResponse" },
              },
            },
          },
          "400": errorResponse,
          "401": {
            description: "Access token is missing, invalid, or the session is inactive",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  statusCode: 401,
                  code: "UNAUTHORIZED",
                  message: "Access token is required",
                },
              },
            },
          },
          "403": {
            description: "Session does not belong to the authenticated user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  statusCode: 403,
                  code: "UNAUTHORIZED",
                  message: "Session does not belong to this user",
                },
              },
            },
          },
        },
      },
    },
    [`${APP_CONSTANTS.API_PREFIX}/users/profile`]: {
      get: {
        tags: ["Users"],
        summary: "Get the current user's profile",
        security: [{ bearerAuth: [] }],
        parameters: deviceParameters,
        responses: {
          "200": {
            description: "Profile fetched",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserProfileResponse" },
                example: {
                  statusCode: 200,
                  message: "Profile fetched successfully",
                  data: {
                    id: "674a1c2e8f0b9a0012345678",
                    name: "Rahul",
                    email: "rahul@example.com",
                    isEmailVerified: false,
                    createdAt: "2026-11-02T08:00:00.000Z",
                    updatedAt: "2026-11-02T08:00:00.000Z",
                  },
                },
              },
            },
          },
          "400": errorResponse,
          "401": {
            description: "Access token is missing, invalid, or the session is inactive",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  statusCode: 401,
                  code: "UNAUTHORIZED",
                  message: "Access token is required",
                },
              },
            },
          },
          "404": {
            description: "User does not exist or the account is inactive",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  statusCode: 404,
                  code: "NOT_FOUND",
                  message: "User not found",
                },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update the current user's profile",
        description: "Updates the signed-in user's name. A name is required.",
        security: [{ bearerAuth: [] }],
        parameters: deviceParameters,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateUserRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Profile updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserProfileResponse" },
                example: {
                  statusCode: 200,
                  message: "Profile updated successfully",
                  data: {
                    id: "674a1c2e8f0b9a0012345678",
                    name: "Rahul Sharma",
                    email: "rahul@example.com",
                    isEmailVerified: false,
                    createdAt: "2026-11-02T08:00:00.000Z",
                    updatedAt: "2026-11-02T09:30:00.000Z",
                  },
                },
              },
            },
          },
          "400": {
            description: "Name is missing or does not meet the length rules",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  missing: {
                    summary: "Name omitted",
                    value: {
                      statusCode: 400,
                      code: "VALIDATION_ERROR",
                      message: "At least one field is required",
                    },
                  },
                  invalid: {
                    summary: "Name length",
                    value: {
                      statusCode: 400,
                      code: "VALIDATION_ERROR",
                      message: "Name must contain at least 2 characters",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Access token is missing, invalid, or the session is inactive",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  statusCode: 401,
                  code: "UNAUTHORIZED",
                  message: "Access token is required",
                },
              },
            },
          },
          "404": {
            description: "User does not exist",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  statusCode: 404,
                  code: "NOT_FOUND",
                  message: "User not found",
                },
              },
            },
          },
        },
      },
    },
    [`${APP_CONSTANTS.API_PREFIX}/users/account`]: {
      delete: {
        tags: ["Users"],
        summary: "Deactivate the current user's account",
        description: "Marks the signed-in user's account as inactive.",
        security: [{ bearerAuth: [] }],
        parameters: deviceParameters,
        responses: {
          "200": {
            description: "Account deactivated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DeactivateAccountResponse" },
              },
            },
          },
          "400": errorResponse,
          "401": {
            description: "Access token is missing, invalid, or the session is inactive",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  statusCode: 401,
                  code: "UNAUTHORIZED",
                  message: "Access token is required",
                },
              },
            },
          },
          "404": {
            description: "Account could not be deactivated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  statusCode: 404,
                  code: "NOT_FOUND",
                  message: "Unable to deactivate account",
                },
              },
            },
          },
        },
      },
    },
    "/test-error": {
      get: {
        tags: ["General"],
        summary: "Sample validation error",
        parameters: deviceParameters,
        responses: {
          "400": {
            description: "Always returns a validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  statusCode: 400,
                  code: "VALIDATION_ERROR",
                  message: "This is a test error",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    parameters: {
      DeviceId: {
        name: "device_id",
        in: "header",
        required: true,
        description: "Unique id of the client device",
        schema: { type: "string", example: "device-123" },
      },
      DeviceType: {
        name: "device_type",
        in: "header",
        required: true,
        description: "1 = Android, 2 = iOS, 3 = Web",
        schema: { type: "integer", enum: [1, 2, 3], example: 3 },
      },
      Timezone: {
        name: "timezone",
        in: "header",
        required: true,
        schema: { type: "string", example: "Asia/Kolkata" },
      },
      Lang: {
        name: "lang",
        in: "header",
        required: true,
        schema: { type: "string", enum: ["en", "hi"], example: "en" },
      },
      RefreshToken: {
        name: "x-refresh-token",
        in: "header",
        required: true,
        description: "Refresh token returned by login or a previous refresh",
        schema: {
          type: "string",
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token from login or refresh",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        required: ["statusCode", "code", "message"],
        properties: {
          statusCode: { type: "integer", example: 400 },
          code: {
            type: "string",
            example: "VALIDATION_ERROR",
            enum: [
              "VALIDATION_ERROR",
              "CONFLICT",
              "DEVICE_ID_REQUIRED",
              "DEVICE_TYPE_REQUIRED",
              "TIMEZONE_REQUIRED",
              "LANG_REQUIRED",
              "UNAUTHORIZED",
              "TOKEN_EXPIRED",
              "REFRESH_TOKEN_REUSED",
              "NOT_GROUP_MEMBER",
              "NOT_FOUND",
              "EMAIL_TAKEN",
              "ALREADY_MEMBER",
              "SPLIT_TOTAL_MISMATCH",
              "BALANCE_NOT_SETTLED",
              "TOO_MANY_ATTEMPTS",
              "INTERNAL_SERVER_ERROR",
            ],
          },
          message: { type: "string", example: "The request data is invalid." },
        },
      },
      VersionResponse: {
        type: "object",
        required: ["statusCode", "message", "data"],
        properties: {
          statusCode: { type: "integer", example: 200 },
          message: { type: "string", example: "API Version" },
          data: {
            type: "object",
            required: ["version"],
            properties: {
              version: { type: "string", example: "1.0.0" },
            },
          },
        },
      },
      SignupRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: {
            type: "string",
            minLength: 2,
            maxLength: 32,
            example: "Rahul",
          },
          email: {
            type: "string",
            format: "email",
            example: "rahul@example.com",
          },
          password: {
            type: "string",
            minLength: 8,
            maxLength: 32,
            example: "password123",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "rahul@example.com",
          },
          password: {
            type: "string",
            minLength: 1,
            maxLength: 32,
            example: "password123",
          },
        },
      },
      AuthUser: {
        type: "object",
        required: ["id", "name", "email"],
        properties: {
          id: { type: "string", example: "674a1c2e8f0b9a0012345678" },
          name: { type: "string", example: "Rahul" },
          email: { type: "string", format: "email", example: "rahul@example.com" },
        },
      },
      AuthTokens: {
        type: "object",
        required: ["accessToken", "refreshToken", "tokenType", "expiresIn"],
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
          tokenType: { type: "string", enum: ["Bearer"], example: "Bearer" },
          expiresIn: {
            type: "integer",
            description: "Access token lifetime in seconds",
            example: 900,
          },
        },
      },
      AuthPayload: {
        type: "object",
        required: ["user", "tokens"],
        properties: {
          user: { $ref: "#/components/schemas/AuthUser" },
          tokens: { $ref: "#/components/schemas/AuthTokens" },
        },
      },
      AuthSuccessResponse: {
        type: "object",
        required: ["statusCode", "message", "data"],
        properties: {
          statusCode: { type: "integer", example: 200 },
          message: { type: "string", example: "Login successful" },
          data: { $ref: "#/components/schemas/AuthPayload" },
        },
      },
      AuthCreatedResponse: {
        type: "object",
        required: ["statusCode", "message", "data"],
        properties: {
          statusCode: { type: "integer", example: 201 },
          message: { type: "string", example: "Account created successfully" },
          data: { $ref: "#/components/schemas/AuthPayload" },
        },
      },
      UpdateUserRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: {
            type: "string",
            minLength: 2,
            maxLength: 100,
            example: "Rahul Sharma",
          },
        },
      },
      UserProfile: {
        type: "object",
        required: [
          "id",
          "name",
          "email",
          "isEmailVerified",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: { type: "string", example: "674a1c2e8f0b9a0012345678" },
          name: { type: "string", example: "Rahul" },
          email: { type: "string", format: "email", example: "rahul@example.com" },
          isEmailVerified: { type: "boolean", example: false },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      UserProfileResponse: {
        type: "object",
        required: ["statusCode", "message", "data"],
        properties: {
          statusCode: { type: "integer", example: 200 },
          message: { type: "string", example: "Profile fetched successfully" },
          data: { $ref: "#/components/schemas/UserProfile" },
        },
      },
      DeactivateAccountResponse: {
        type: "object",
        required: ["statusCode", "message", "data"],
        properties: {
          statusCode: { type: "integer", example: 200 },
          message: { type: "string", example: "Account deactivated successfully" },
          data: { nullable: true, example: null },
        },
      },
      LogoutResponse: {
        type: "object",
        required: ["statusCode", "message", "data"],
        properties: {
          statusCode: { type: "integer", example: 200 },
          message: { type: "string", example: "Logout successful" },
          data: { nullable: true, example: null },
        },
      },
      CreatedUserResponse: {
        type: "object",
        required: ["statusCode", "message", "data"],
        properties: {
          statusCode: { type: "integer", example: 201 },
          message: { type: "string", example: "User created successfully" },
          data: {
            type: "object",
            required: ["id", "name"],
            properties: {
              id: { type: "string", example: "124" },
              name: { type: "string", example: "Rahul" },
            },
          },
        },
      },
    },
  },
};
