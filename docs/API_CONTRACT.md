# CivicFix API Contract (v1)

Base URL: `/api/v1`

## Response Envelopes

### Success Envelope

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42
  }
}
```

_(The `meta` property is optional and returned on paginated or collection endpoints)._

### Error Envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable explanation of the failure.",
    "details": [
      {
        "field": "description",
        "message": "Must be at least 10 characters."
      }
    ]
  }
}
```

### Standard Error Codes

| HTTP Status | Error Code              | Description                                                               |
| ----------- | ----------------------- | ------------------------------------------------------------------------- |
| 400         | `VALIDATION_ERROR`      | Request payload, query, or path parameters failed validation.             |
| 401         | `UNAUTHORIZED`          | Missing, expired, or invalid session cookie.                              |
| 403         | `FORBIDDEN`             | Authenticated user lacks permission or ward/cycle scope.                  |
| 404         | `NOT_FOUND`             | Resource not found.                                                       |
| 409         | `CONFLICT`              | State conflict (e.g., duplicate email, invalid state machine transition). |
| 429         | `RATE_LIMITED`          | Too many requests for IP or authenticated user.                           |
| 500         | `INTERNAL_SERVER_ERROR` | Unexpected server failure.                                                |

---

## 1. Meta & Public

### `GET /health`

- **Role**: Public
- **Description**: Health check with database connectivity and latest schema migration version.
- **Response**:
  ```json
  {
    "data": {
      "status": "ok",
      "database": "connected",
      "migrationVersion": "002"
    }
  }
  ```

### `GET /meta`

- **Role**: Public
- **Description**: Returns static reference data including active wards, departments, categories, and duplicate detection configuration.
- **Response**:
  ```json
  {
    "data": {
      "wards": [
        {
          "id": 14,
          "code": "WARD-14",
          "name": "Ward 14 (Central)",
          "city": "Bengaluru",
          "centerLat": 12.9716,
          "centerLng": 77.5946
        }
      ],
      "departments": [
        {
          "id": 1,
          "code": "roads",
          "name": "Roads & Pavements",
          "description": "Street repairs, potholes, sidewalks"
        }
      ],
      "categories": [
        {
          "id": 1,
          "code": "pothole",
          "name": "Pothole / road damage",
          "icon": "construction",
          "defaultDepartmentId": 1,
          "slaHours": 72
        }
      ],
      "statuses": [
        "reported",
        "assigned",
        "in_progress",
        "awaiting_verification",
        "resolved",
        "reopened",
        "rejected"
      ],
      "config": {
        "dupRadiusM": 150,
        "maxUploadMb": 5
      }
    }
  }
  ```

### `GET /public/stats`

- **Role**: Public
- **Description**: Aggregated public statistics for the landing page. Leaks no private user or reporter data.
- **Response**:
  ```json
  {
    "data": {
      "issuesCount": 42,
      "reportsCount": 128,
      "supportersCount": 310,
      "resolvedCount": 24,
      "verifiedClosurePercent": 87.5
    }
  }
  ```

---

## 2. Authentication & User Profile

### `POST /auth/register`

- **Role**: Public
- **Body**:
  ```json
  {
    "name": "Asha Sharma",
    "email": "asha@example.com",
    "password": "Password123!",
    "wardId": 14,
    "phone": "9876543210"
  }
  ```
- **Validation**: Email valid and unique; password min 8 characters; wardId must reference an existing ward.
- **Response**:
  ```json
  {
    "data": {
      "id": 1,
      "name": "Asha Sharma",
      "email": "asha@example.com",
      "role": "citizen",
      "wardId": 14
    }
  }
  ```
- **Side Effect**: Sets httpOnly JWT cookie `civicfix_token`.

### `POST /auth/login`

- **Role**: Public
- **Body**:
  ```json
  {
    "email": "asha@example.com",
    "password": "Password123!"
  }
  ```
- **Response**: User summary. Sets httpOnly JWT cookie.

### `POST /auth/logout`

- **Role**: Authenticated
- **Response**:
  ```json
  {
    "data": { "message": "Logged out successfully" }
  }
  ```
- **Side Effect**: Clears `civicfix_token` cookie.

### `GET /auth/me`

- **Role**: Authenticated
- **Response**:
  ```json
  {
    "data": {
      "id": 1,
      "name": "Asha Sharma",
      "email": "asha@example.com",
      "phone": "9876543210",
      "role": "citizen",
      "wardId": 14,
      "departmentId": null
    }
  }
  ```

### `PATCH /users/profile`

- **Role**: Authenticated
- **Body**: `{ "name"?: string, "phone"?: string, "wardId"?: number }`
- **Response**: Updated user profile.

---

## 3. Issues & Reports (Citizen Experience)

### `GET /issues`

- **Role**: Public
- **Query Parameters**:
  - `ward`: number (optional)
  - `category`: string (code, optional)
  - `status`: string (optional)
  - `q`: string (search term, optional)
  - `sort`: `recent` | `supported` | `oldest` | `nearest` (default `recent`)
  - `lat`: float, `lng`: float, `radius`: float (optional, required if `sort=nearest`)
  - `page`: integer (default 1), `limit`: integer (default 20, max 100)
- **Response**: List of issues with `reportCount`, `supportCount`, and distance if coordinates provided. Never exposes reporter personal info.

### `GET /issues/nearby`

- **Role**: Public
- **Query Parameters**: `lat`, `lng`, `radius` (meters, default 1000), `category` (optional), `status` (optional).
- **Response**: Compact coordinate pins for map rendering.

### `GET /issues/:id`

- **Role**: Public (authenticated adds viewer flags)
- **Response**: Detailed issue view with public reports, image gallery, SLA chip state, and flags:
  ```json
  {
    "data": {
      "id": 24,
      "issueCode": "CF-024",
      "title": "Large pothole on 8th Main",
      "summary": "Deep pothole causing traffic obstruction near market.",
      "description": "Initial report description...",
      "categoryId": 1,
      "categoryCode": "pothole",
      "categoryName": "Pothole / road damage",
      "wardId": 14,
      "departmentId": 1,
      "departmentName": "Roads & Pavements",
      "status": "assigned",
      "priority": "high",
      "latitude": 12.9716,
      "longitude": 77.5946,
      "address": "8th Main, Ward 14",
      "assignedTo": 3,
      "assignedToName": "Ramesh Kumar",
      "firstAssignedAt": "2026-11-09T04:35:00Z",
      "slaDueAt": "2026-11-12T04:35:00Z",
      "slaState": "on_track",
      "slaRemainingHours": 68.5,
      "reportsCount": 5,
      "supportersCount": 12,
      "hasSupported": false,
      "isLinked": true,
      "canVerify": false,
      "canReopen": false,
      "reports": [ ... ],
      "evidence": [ ... ],
      "isSeed": true,
      "createdAt": "2026-11-09T03:50:00Z"
    }
  }
  ```

### `GET /issues/:id/timeline`

- **Role**: Public
- **Response**: List of public `issue_updates` rows ordered by `created_at` ASC.

### `POST /reports/precheck`

- **Role**: Citizen
- **Body**:
  ```json
  {
    "description": "Dangerous pothole right in front of bus stop",
    "latitude": 12.9718,
    "longitude": 77.5948,
    "categoryId": 1
  }
  ```
- **Response**:
  ```json
  {
    "data": {
      "suggestion": {
        "categoryCode": "pothole",
        "categoryId": 1,
        "title": "Pothole near bus stop",
        "summary": "Dangerous road depression impacting transit traffic.",
        "priorityHint": "high",
        "language": "en",
        "confidence": "high",
        "source": "gemini"
      },
      "candidates": [
        {
          "issueId": 24,
          "issueCode": "CF-024",
          "title": "Large pothole on 8th Main",
          "distanceM": 28,
          "status": "assigned",
          "supportersCount": 12,
          "imageUrl": "/uploads/placeholder.jpg",
          "aiVerdict": {
            "sameProblem": true,
            "confidence": "high",
            "reason": "Both reports identify the deep road crater at the bus stop junction."
          }
        }
      ]
    }
  }
  ```

### `POST /reports`

- **Role**: Citizen
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `image`: binary file (JPEG/PNG/WebP, max 5MB)
  - `description`: text (min 10 chars)
  - `latitude`: float
  - `longitude`: float
  - `address`: string (optional)
  - `categoryId`: number
  - `aiSuggestedCategoryId`: number (optional)
  - `joinIssueId`: number (optional, join existing cluster instead of creating new issue)
- **Response**: Returns the created report and linked issue summary.

### `GET /reports/my`

- **Role**: Citizen
- **Response**: List of reports submitted by the authenticated citizen with current issue status.

### `POST /issues/:id/support`

- **Role**: Citizen
- **Description**: Add support to an issue without submitting a new report. Idempotent.
- **Response**: `{ "data": { "supported": true, "supportersCount": 13 } }`

### `DELETE /issues/:id/support`

- **Role**: Citizen
- **Description**: Withdraw support. Fails if the user is the original reporter of any report on this issue.

### `POST /issues/:id/verify`

- **Role**: Citizen (Must be linked to the issue, issue must be in `awaiting_verification`)
- **Body**: `{ "rating"?: integer (1-5), "comment"?: string }`
- **Response**: Issue updated to `resolved`.

### `POST /issues/:id/reopen`

- **Role**: Citizen (Must be linked, within `REOPEN_WINDOW_DAYS` or from `awaiting_verification`)
- **Content-Type**: `multipart/form-data` or JSON
- **Body/Fields**: `reason` (string, required), `image` (file, optional)
- **Response**: Issue updated to `reopened`.

---

## 4. Notifications

### `GET /notifications`

- **Role**: Authenticated
- **Response**: List of notifications for current user + `unreadCount`.

### `PATCH /notifications/:id/read`

- **Role**: Authenticated
- **Response**: `{ "data": { "id": 1, "isRead": true } }`

### `POST /notifications/read-all`

- **Role**: Authenticated
- **Response**: `{ "data": { "markedRead": 4 } }`

---

## 5. Ward Team Console

### `GET /ward/issues`

- **Role**: Ward Admin (scoped by `ward_id`)
- **Query Parameters**: `status`, `category`, `department`, `priority`, `sla`, `assignedTo`, `q`, `sort`.
- **Response**: Paginated queue items including cluster counts and overdue flags.

### `GET /ward/issues/:id`

- **Role**: Ward Admin
- **Response**: Complete issue workspace payload: all reports (with reporter display name only), internal & public timeline, evidence records, assignment history, SLA state, and AI summary.

### `POST /ward/issues/:id/assign`

- **Role**: Ward Admin
- **Body**: `{ "categoryId": number, "departmentId": number, "priority": "low"|"medium"|"high"|"critical", "assigneeId"?: number, "note"?: string }`
- **Response**: Transitions status from `reported` to `assigned` (or records reassignment), sets SLA clock.

### `PATCH /ward/issues/:id/status`

- **Role**: Ward Admin
- **Body**: `{ "toStatus": string, "note"?: string, "reason"?: string }`
- **Response**: Executes state transition via `issue_state_machine`.

### `POST /ward/issues/:id/updates`

- **Role**: Ward Admin
- **Body**: `{ "note": string, "nextStep"?: string, "visibility": "public"|"internal" }`
- **Response**: Adds an `issue_updates` record.

### `POST /ward/issues/:id/evidence`

- **Role**: Ward Admin
- **Content-Type**: `multipart/form-data`
- **Fields**: `image` (file), `kind` ("before" | "progress" | "after"), `caption` (optional).
- **Response**: Evidence record.

### `POST /ward/issues/:id/ai-summary`

- **Role**: Ward Admin
- **Response**: Regenerated multi-report summary and recurring details.

### `GET /ward/team`

- **Role**: Ward Admin
- **Query Parameters**: `departmentId` (optional).
- **Response**: List of ward staff members available for assignment.

### `GET /ward/moderation`

- **Role**: Ward Admin
- **Response**: List of flagged reports and quarantined issues.

### `POST /ward/issues/:id/moderate`

- **Role**: Ward Admin
- **Body**: `{ "action": "approve"|"reject", "reason": string }`
- **Response**: Moderation action completed.

---

## 6. Ward Analytics

All analytics endpoints scoped to `ward_id` unless the admin has `ward_id=null` (city view).

- `GET /ward/analytics/overview`: KPI cards (open, resolved, reopened, awaiting_verification + deltas).
- `GET /ward/analytics/categories`: Category breakdown and median resolution hours.
- `GET /ward/analytics/timeseries?days=30`: Daily count of reports and issues created.
- `GET /ward/analytics/scorecard`: Five pilot scorecard metrics (Report quality %, Duplicate reduction %, Time to triage hours, Verified closure %, Backlog matrix).
- `GET /ward/analytics/hotspots`: Geospatial clusters binned into ~200m cells with top categories.
- `GET /ward/analytics/ageing`: Open issues binned into 0-3, 4-7, 8-14, 15+ day buckets.
- `GET /ward/analytics/wards`: Ward comparison and cross-category backlog (for city view).
