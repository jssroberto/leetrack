# API Workflow Guide

This guide documents the complete API flow for the Leetrack application, covering the user journey from account creation to participating in automated challenges.

## 1. Authentication

### 1.1 Register a New User

Create a new account to access the platform.

- **Endpoint**: `POST /auth/register`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Response**: Returns an access token.

### 1.2 Login

Authenticate an existing user.

- **Endpoint**: `POST /auth/login`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Response**: Returns an access token.
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```
  > **Note**: Include this token in the `Authorization` header (`Bearer <token>`) for all subsequent requests.

---

## 2. Group Management

### 2.1 Create a Group

Create a study group where members can propose and solve challenges together.

- **Endpoint**: `POST /groups`
- **Body**:
  ```json
  {
    "name": "NeetCode Grinders",
    "description": "Daily DSA practice group"
  }
  ```
- **Response**: Returns the created group object, including the `inviteCode`.

### 2.2 Join a Group

Join an existing group using an invite code shared by an admin.

- **Endpoint**: `POST /groups/join/:inviteCode`
- **Example**: `POST /groups/join/NC1234`
- **Response**: Returns the group details upon successful join.

---

## 3. Proposal System

### 3.1 Get Categories

Retrieve the list of available problem categories to base a proposal on.

- **Endpoint**: `GET /problems/categories`
- **Response**:
  ```json
  [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Arrays & Hashing",
      "slug": "arrays-hashing"
    },
    ...
  ]
  ```

### 3.2 Create a Proposal

Propose a topic (category) for the group to work on.

- **Endpoint**: `POST /groups/:groupId/proposals`
- **Body**:
  ```json
  {
    "categoryId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Array Week", // Optional
    "description": "Focus on array manipulation", // Optional
    "targetDate": "2023-12-01"
  }
  ```

### 3.3 Vote on a Proposal

Members vote for the proposals they want to tackle next.

- **Endpoint**: `POST /groups/:groupId/proposals/:proposalId/vote`
- **Response**: Toggles the user's vote for the specified proposal.

---

## 4. Automated Challenges

### 4.1 Convert Proposal to Challenge (Admin Only)

Once a proposal wins, an admin converts it into an active challenge. The system automatically selects 3 problems (1 Easy, 2 Medium) from the proposal's category.

- **Endpoint**: `POST /groups/:groupId/proposals/:proposalId/convert`
- **Response**: Returns the created challenge with the selected problems.
  ```json
  {
    "id": "challenge-uuid",
    "name": "Array Week Challenge",
    "problems": [
      { "id": "prob-1", "title": "Two Sum", "difficulty": "EASY" },
      { "id": "prob-2", "title": "Group Anagrams", "difficulty": "MEDIUM" },
      { "id": "prob-3", "title": "Top K Frequent", "difficulty": "MEDIUM" }
    ]
  }
  ```
