# Amp Arena Competitor API Documentation

## Overview
The Competitor API provides endpoints for managing Amp Arena competitors, including registration, profile management, file uploads, and status tracking.

## Authentication
The Competitor API uses a separate authentication system from the main admin panel:
- Environment variable: `COMPETITOR_ADMIN_PASSCODE`
- Header: `competitor-admin-key`

## Database Schema

### Competitors Table
```sql
CREATE TABLE competitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    github_username TEXT,
    twitter_username TEXT,
    profile_photo_url TEXT,
    bio TEXT,
    submission_files TEXT, -- JSON array stored as string
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'qualified', 'finalist', 'eliminated')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## API Endpoints

### Authentication

#### POST /api/competitor-admin-auth
Authenticate to access admin-protected competitor endpoints.

**Request:**
```json
{
    "passcode": "your_competitor_admin_passcode"
}
```

**Response:**
```json
{
    "competitorAdminKey": "your_competitor_admin_passcode",
    "message": "Competitor admin authentication successful"
}
```

### Competitor Management

#### POST /api/competitors
Create a new competitor. No authentication required for registration.

**Request:**
```json
{
    "email": "competitor@example.com",
    "full_name": "John Doe",
    "github_username": "johndoe",
    "twitter_username": "johndoe",
    "profile_photo_url": "https://example.com/photo.jpg",
    "bio": "Passionate developer and builder"
}
```

**Response:**
```json
{
    "message": "Competitor registered successfully!",
    "id": 1
}
```

#### GET /api/competitors
List all competitors. **Requires admin authentication.**

**Headers:**
```
competitor-admin-key: your_competitor_admin_passcode
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, qualified, finalist, eliminated)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
[
    {
        "id": 1,
        "email": "competitor@example.com",
        "full_name": "John Doe",
        "github_username": "johndoe",
        "twitter_username": "johndoe",
        "profile_photo_url": "https://example.com/photo.jpg",
        "bio": "Passionate developer and builder",
        "submission_files": ["uploads/competitors/file1.pdf"],
        "status": "qualified",
        "created_at": "2025-01-01 12:00:00",
        "updated_at": "2025-01-02 12:00:00"
    }
]
```

#### GET /api/competitors/:id
Get a single competitor's profile. No authentication required.

**Response:**
```json
{
    "id": 1,
    "email": "competitor@example.com",
    "full_name": "John Doe",
    "github_username": "johndoe",
    "twitter_username": "johndoe",
    "profile_photo_url": "https://example.com/photo.jpg",
    "bio": "Passionate developer and builder",
    "submission_files": ["uploads/competitors/file1.pdf"],
    "status": "qualified",
    "created_at": "2025-01-01 12:00:00",
    "updated_at": "2025-01-02 12:00:00"
}
```

#### PUT /api/competitors/:id
Update a competitor's profile. **Requires admin authentication.**

**Headers:**
```
competitor-admin-key: your_competitor_admin_passcode
```

**Request:**
```json
{
    "email": "newemail@example.com",
    "full_name": "John Updated Doe",
    "github_username": "johndoe",
    "twitter_username": "johndoe",
    "profile_photo_url": "https://example.com/newphoto.jpg",
    "bio": "Updated bio",
    "status": "finalist"
}
```

**Response:**
```json
{
    "message": "Competitor updated successfully"
}
```

#### DELETE /api/competitors/:id
Delete a competitor and their uploaded files. **Requires admin authentication.**

**Headers:**
```
competitor-admin-key: your_competitor_admin_passcode
```

**Response:**
```json
{
    "message": "Competitor deleted successfully"
}
```

### File Management

#### POST /api/competitors/:id/upload
Upload submission files for a competitor. No authentication required.

**Request:** Multipart form data with up to 5 files
- Field name: `files`
- Supported formats: PDF, ZIP, DOC, DOCX, JPEG, JPG, PNG
- Max file size: 10MB per file

**Response:**
```json
{
    "message": "Files uploaded successfully",
    "files": [
        "uploads/competitors/files-1641234567890-123456789.pdf",
        "uploads/competitors/files-1641234567890-987654321.zip"
    ]
}
```

## File Access
Uploaded files are served statically at `/uploads/competitors/filename`

Example: `http://localhost:3000/uploads/competitors/files-1641234567890-123456789.pdf`

## Status Values
- `pending`: Initial status for new competitors
- `qualified`: Competitor has passed initial review
- `finalist`: Competitor has made it to final round
- `eliminated`: Competitor has been eliminated

## Error Responses

All endpoints return appropriate HTTP status codes:
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Invalid or missing authentication
- `404`: Not Found - Resource doesn't exist
- `409`: Conflict - Email already exists
- `500`: Internal Server Error

Example error response:
```json
{
    "error": "Email already registered as competitor"
}
```

## Environment Variables

Add to your `.env` file:
```
# Required for competitor admin authentication
COMPETITOR_ADMIN_PASSCODE=your_secure_passcode_here
```

## Frontend Routes
- `/competitors` - Competitor dashboard (admin)
- `/competitors/profile/:id` - Individual competitor profile

## Security Notes
- Competitor registration is open (no auth required)
- Admin functions require `COMPETITOR_ADMIN_PASSCODE`
- File uploads are validated for type and size
- Uploaded files are automatically cleaned up when competitors are deleted
- SQL injection protection via parameterized queries
- Input validation on all endpoints
