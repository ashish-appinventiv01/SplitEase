
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
  