# SplitEase Backend

Expense-splitting API built with Node.js 20, Express, TypeScript, MongoDB, Redis, JWT, Zod, and Winston.

## Features

- Auth with access/refresh tokens, Redis sessions, refresh rotation, reuse detection
- User profile and account deactivation
- Groups with membership controls
- Expenses with EQUAL / EXACT / PERCENT splits (stored in integer paise)
- Settlements and balance calculation with Redis caching
- Group activity feed
- Async CSV export without Worker Threads or RabbitMQ consumers

## Requirements

- Node.js 20+
- Docker and Docker Compose (recommended)
- Or local MongoDB + Redis

## Setup

```bash
cp .env.example .env
npm install
npm run build
npm run dev
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `3000`) |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `RABBITMQ_URL` | Present for existing infra compatibility |
| `JWT_ACCESS_SECRET` | Access token secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |

### Docker

```bash
docker compose up --build
```

Services:

- API on `http://localhost:3000`
- MongoDB on `27017`
- Redis on `6379`
- RabbitMQ remains in compose for existing setup; this app does not add consumers or Worker Threads

Swagger UI: `http://localhost:3000/api-docs`

Health check (no device headers): `GET /health`

## Required headers

Except `GET /health` and Swagger:

| Header | Values |
|--------|--------|
| `device_id` | Non-empty string |
| `device_type` | `1` Android, `2` iOS, `3` Web |
| `timezone` | IANA timezone, e.g. `Asia/Kolkata` |
| `lang` | `en` or `hi` |

Protected routes also require:

```http
Authorization: Bearer <accessToken>
```

## Financial rules

- Store money as **integer paise** (`₹100.50` → `10050`)
- Never use floating-point arithmetic for money math
- Equal splits distribute remainders to the first members:

```text
1000 paise / 3 → [334, 333, 333]
```

API request bodies accept amounts in **rupees** (for example `100.5`). Services convert with `CommonUtils.rupeesToPaise`.

## Authentication flow

1. `POST /api/v1/auth/signup`
2. `POST /api/v1/auth/login`
3. Use `accessToken` on protected routes
4. `POST /api/v1/auth/refresh` when access token expires
5. `POST /api/v1/auth/logout` to revoke the current session

## API endpoints

### Auth

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### Users

- `GET /api/v1/users/profile`
- `PATCH /api/v1/users/profile`
- `DELETE /api/v1/users/account`

### Groups

- `POST /api/v1/groups`
- `GET /api/v1/groups?page=1&limit=20`
- `GET /api/v1/groups/:groupId`
- `PATCH /api/v1/groups/:groupId`
- `DELETE /api/v1/groups/:groupId`
- `POST /api/v1/groups/:groupId/members`
- `DELETE /api/v1/groups/:groupId/members/:userId`
- `GET /api/v1/groups/:groupId/activities`

### Expenses

- `POST /api/v1/groups/:groupId/expenses`
- `GET /api/v1/groups/:groupId/expenses`
- `GET /api/v1/expenses/:expenseId`
- `PATCH /api/v1/expenses/:expenseId`
- `DELETE /api/v1/expenses/:expenseId`

### Balances

- `GET /api/v1/groups/:groupId/balances`
- `GET /api/v1/groups/:groupId/balances/me`

### Settlements

- `POST /api/v1/groups/:groupId/settlements`
- `GET /api/v1/groups/:groupId/settlements`
- `GET /api/v1/settlements/:settlementId`

### Exports

- `POST /api/v1/groups/:groupId/exports` body `{ "type": "EXPENSES" | "SETTLEMENTS" }`
- `GET /api/v1/exports/:exportId`
- `GET /api/v1/exports/:exportId/download`

Pagination defaults: `page=1`, `limit=20`, max `limit=100`.

## Example curl requests

```bash
BASE=http://localhost:3000/api/v1
HEADERS=(-H "device_id: web-1" -H "device_type: 3" -H "timezone: Asia/Kolkata" -H "lang: en" -H "Content-Type: application/json")

# Signup
curl -s "$BASE/auth/signup" "${HEADERS[@]}" \
  -d '{"name":"Ashish","email":"ashish@example.com","password":"Password1!"}'

# Login
curl -s "$BASE/auth/login" "${HEADERS[@]}" \
  -d '{"email":"ashish@example.com","password":"Password1!"}'

TOKEN="<accessToken>"
AUTH=(-H "Authorization: Bearer $TOKEN")

# Create group
curl -s "$BASE/groups" "${HEADERS[@]}" "${AUTH[@]}" \
  -d '{"name":"Trip","description":"Goa trip"}'

GROUP_ID="<groupId>"

# Add member
curl -s "$BASE/groups/$GROUP_ID/members" "${HEADERS[@]}" "${AUTH[@]}" \
  -d '{"userId":"<otherUserId>"}'

# Create equal expense of ₹100.50
curl -s "$BASE/groups/$GROUP_ID/expenses" "${HEADERS[@]}" "${AUTH[@]}" \
  -d '{
    "description":"Dinner",
    "amount":100.5,
    "paidBy":"<userId>",
    "splitType":"EQUAL",
    "participants":[{"userId":"<userId>"},{"userId":"<otherUserId>"}]
  }'

# Balances
curl -s "$BASE/groups/$GROUP_ID/balances" "${HEADERS[@]}" "${AUTH[@]}"

# Settlement
curl -s "$BASE/groups/$GROUP_ID/settlements" "${HEADERS[@]}" "${AUTH[@]}" \
  -d '{"fromUserId":"<debtorId>","toUserId":"<creditorId>","amount":50.25,"note":"UPI"}'

# Export expenses
curl -s "$BASE/groups/$GROUP_ID/exports" "${HEADERS[@]}" "${AUTH[@]}" \
  -d '{"type":"EXPENSES"}'
```

## Testing

```bash
npm run build
npm run test:money
```

`test:money` verifies paise conversion and equal-split remainder distribution.

Manual checks to cover:

- Auth signup/login/refresh/logout
- Group membership authorization
- Expense split total validation
- Balance sum-to-zero and cache invalidation after expense/settlement
- Export job lifecycle (`QUEUED` → `PROCESSING` → `DONE`)
- Pagination limits

## Architecture

```text
Routes → Middleware → Controller → Service → Repository → Schema
```

- Controllers handle HTTP only
- Services own business rules
- Repositories own MongoDB access
- Redis is used for sessions and balance cache
- Activities are written directly from application services

## Project layout

```text
src/
  modules/v1/{auth,user,group,expense,balance,settlement,activity,export}/
  repositories/
  schemas/
  middlewares/
  providers/{database,redis,rabbitmq}/
  common/
```
