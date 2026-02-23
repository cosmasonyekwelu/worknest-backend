# Notification API Documentation

## Overview

The Notification API provides a complete notification system for the Worknest platform. Users can manage notifications, mark them as read, and track different types of notifications.

## Base URL

```
/api/v1/notifications
```

## Authentication

All endpoints require authentication via the `verifyAuth` middleware. Include an Authorization token in the request headers.

---

## Endpoints

### 1. Create Notification

**POST** `/create`

Creates a new notification. This endpoint is typically called by the system or admins.

**Request Body:**

```json
{
  "recipient": "userId",
  "sender": "senderId",
  "type": "application_received",
  "title": "New Application",
  "message": "You have received a new application for your job posting",
  "relatedData": {
    "jobId": "jobId",
    "applicationId": "applicationId",
    "userId": "userId"
  },
  "priority": "high",
  "actionUrl": "/jobs/123/applications"
}
```

**Notification Types:**

- `application_received` - When a new application is received
- `application_status` - When application status changes
- `job_posted` - When a new job is posted
- `profile_viewed` - When someone views a profile
- `message` - Direct messages
- `job_alert` - Job alerts for applicants
- `system` - System notifications

**Priority Levels:**

- `low`
- `medium` (default)
- `high`

**Response:**

```json
{
  "status": "success",
  "message": "Notification created successfully",
  "data": {
    "_id": "notificationId",
    "recipient": "userId",
    "sender": "senderId",
    "type": "application_received",
    "title": "New Application",
    "message": "You have received a new application",
    "isRead": false,
    "priority": "high",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

---

### 2. Get User Notifications

**GET** `/`

Retrieves all notifications for the authenticated user with pagination.

**Query Parameters:**

- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page
- `isRead` (optional) - Filter by read status (true/false)

**Example Request:**

```
GET /api/v1/notifications?page=1&limit=20&isRead=false
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "_id": "notificationId",
      "recipient": {
        "_id": "userId",
        "fullname": "John Doe",
        "avatar": "url"
      },
      "sender": {
        "_id": "senderId",
        "fullname": "Jane Doe",
        "avatar": "url"
      },
      "type": "application_received",
      "title": "New Application",
      "message": "You have received a new application",
      "isRead": false,
      "priority": "high",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "totalNotifications": 42,
  "totalPages": 3,
  "currentPage": 1
}
```

---

### 3. Get Notification By ID

**GET** `/:id`

Retrieves a specific notification by its ID.

**Response:**

```json
{
  "status": "success",
  "data": {
    "_id": "notificationId",
    "recipient": { ... },
    "sender": { ... },
    "type": "application_received",
    "title": "New Application",
    "message": "You have received a new application",
    "relatedData": {
      "jobId": { "title": "Software Engineer" },
      "applicationId": { "status": "pending" }
    },
    "isRead": false,
    "priority": "high",
    "actionUrl": "/jobs/123/applications",
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

---

### 4. Mark Notification as Read

**PATCH** `/:id/read`

Marks a single notification as read.

**Response:**

```json
{
  "status": "success",
  "message": "Notification marked as read",
  "data": {
    "_id": "notificationId",
    "isRead": true,
    ...
  }
}
```

---

### 5. Mark All Notifications as Read

**PATCH** `/mark/all-read`

Marks all unread notifications for the user as read.

**Response:**

```json
{
  "status": "success",
  "message": "All notifications marked as read",
  "data": {
    "modifiedCount": 5
  }
}
```

---

### 6. Delete Notification

**DELETE** `/:id`

Deletes a specific notification. User can only delete their own notifications.

**Response:**

```json
{
  "status": "success",
  "message": "Notification deleted successfully"
}
```

---

### 7. Delete All Notifications

**DELETE** `/`

Deletes all notifications for the authenticated user.

**Response:**

```json
{
  "status": "success",
  "message": "All notifications deleted successfully",
  "data": {
    "deletedCount": 42
  }
}
```

---

### 8. Get Unread Count

**GET** `/unread/count`

Retrieves the count of unread notifications for the user.

**Response:**

```json
{
  "status": "success",
  "data": {
    "unreadCount": 5
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "status": "error",
  "message": "Please provide all required fields"
}
```

### 403 Forbidden

```json
{
  "status": "error",
  "message": "You are not authorized to perform this action"
}
```

### 404 Not Found

```json
{
  "status": "error",
  "message": "Notification not found"
}
```

---

## Example Usage

### Create a notification when an application is received

```javascript
const response = await fetch("/api/v1/notifications/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer your_token",
  },
  body: JSON.stringify({
    recipient: jobOwnerUserId,
    sender: applicantUserId,
    type: "application_received",
    title: "New Application Received",
    message: `${applicantName} applied for ${jobTitle}`,
    relatedData: {
      jobId: jobId,
      applicationId: applicationId,
      userId: applicantUserId,
    },
    priority: "high",
    actionUrl: `/jobs/${jobId}/applications`,
  }),
});
```

### Get unread notifications

```javascript
const response = await fetch("/api/v1/notifications?isRead=false", {
  method: "GET",
  headers: {
    Authorization: "Bearer your_token",
  },
});
```

### Mark all as read

```javascript
const response = await fetch("/api/v1/notifications/mark/all-read", {
  method: "PATCH",
  headers: {
    Authorization: "Bearer your_token",
  },
});
```

---

## Data Model

### Notification Schema

```javascript
{
  recipient: ObjectId (required) - User receiving the notification
  sender: ObjectId - User sending the notification
  type: String (required) - Type of notification
  title: String (required) - Notification title (max 100 chars)
  message: String (required) - Notification message (max 500 chars)
  relatedData: {
    jobId: ObjectId - Related job ID
    applicationId: ObjectId - Related application ID
    userId: ObjectId - Related user ID
  }
  isRead: Boolean - Whether notification has been read (default: false)
  priority: String - Priority level (low, medium, high)
  actionUrl: String - URL to navigate to when clicking notification
  createdAt: Date - Creation timestamp
  updatedAt: Date - Last update timestamp
}
```

---

## Indexes

The notification collection has the following indexes for optimal query performance:

- `recipient + createdAt` - For fetching user notifications
- `recipient + isRead` - For filtering read status
- `createdAt` - For sorting by date
- `type` - For filtering by notification type
