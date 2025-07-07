# Manual API Requests

This document contains `curl` commands to manually test the API endpoints this mainly for my own sake and for potential
tests from mentors (even though they probably use Windows lol).

## Base URL

All requests assume the API is running locally on `http://localhost:3000`.

## Authentication

For authenticated endpoints, you will need to replace `YOUR_ACCESS_TOKEN` and `YOUR_REFRESH_TOKEN` with actual tokens obtained from the login/register endpoints.

---

## 1. Auth Module Endpoints

### 1.1. Register New User

**Endpoint:** `POST /auth/register`

**Description:** Registers a new user with the provided credentials.

**Request Body Example:**

```json
{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "displayName": "Test User",
    "userDescription": "A test user account"
}
```

**Curl Command:**

```bash
curl -X POST \
  http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com", "username": "testuser", "password": "password123", "displayName": "Test User", "userDescription": "A test user account" }'
```

### 1.2. Login User

**Endpoint:** `POST /auth/login`

**Description:** Logs in an existing user and returns access and refresh tokens.

**Request Body Example:**

```json
{
    "email": "test@example.com",
    "password": "password123"
}
```

**Curl Command:**

```bash
curl -X POST \
  http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com", "password": "password123" }'
```

### 1.3. Logout User

**Endpoint:** `POST /auth/logout`

**Description:** Logs out the currently authenticated user by invalidating their tokens.

**Curl Command:**

```bash
curl -X POST \
  http://localhost:3000/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 1.4. Refresh Access Token

**Endpoint:** `POST /auth/refresh`

**Description:** Refreshes the access token using a valid refresh token.

**Request Body Example:**

```json
{
    "refreshToken": "YOUR_REFRESH_TOKEN"
}
```

**Curl Command:**

```bash
curl -X POST \
  http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "YOUR_REFRESH_TOKEN" }'
```

---

## 2. Users Module Endpoints

### 2.1. Find Users with Filtering, Pagination, and Sorting

**Endpoint:** `GET /users`

**Description:** Retrieves a list of users with various query parameters for filtering, pagination, and sorting.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `search`: Generic search term for username, email, or display name
- `sortBy`: Field to sort by (e.g., `createdAt`, `username`, `email`)
- `sortOrder`: Sort order (`ASC` or `DESC`, default: `DESC`)
- `fields`: Comma-separated list of fields to return (e.g., `id,username,email`)

**Curl Commands (Examples):**

**a) Get all users (default pagination and sorting):**

```bash
curl -X GET \
  http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**b) Search for users by username containing "test", page 1, limit 5:**

```bash
curl -X GET \
  "http://localhost:3000/users?search=test&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**c) Sort users by username in ascending order:**

```bash
curl -X GET \
  "http://localhost:3000/users?sortBy=username&sortOrder=ASC" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**d) Get only `id`, `email`, and `username` fields:**

```bash
curl -X GET \
  "http://localhost:3000/users?fields=id,email,username" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2.2. Update User (Self Only)

**Endpoint:** `PATCH /users/:id`

**Description:** Updates the profile of the authenticated user. Requires `YOUR_USER_ID`.

**Request Body Example:**

```json
{
    "displayName": "Updated Display Name",
    "userDescription": "My updated description."
}
```

**Curl Command:**

```bash
curl -X PATCH \
  http://localhost:3000/users/YOUR_USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{ "displayName": "Updated Display Name", "userDescription": "My updated description." }'
```

### 2.3. Delete User (Self Only)

**Endpoint:** `DELETE /users/:id`

**Description:** Deletes the authenticated user's account. Requires `YOUR_USER_ID`.

**Curl Command:**

```bash
curl -X DELETE \
  http://localhost:3000/users/YOUR_USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---
