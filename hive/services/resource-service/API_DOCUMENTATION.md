# HIVE Resource Service — API Documentation

> **Port:** `3002`  
> **Base path:** `/resources`  
> **Auth:** Firebase ID token via `Authorization: Bearer <token>` header  
> **File uploads:** `multipart/form-data`, PDF only, max 50 MB  

---

## Quick Start

### 1 — Set up AWS S3

```bash
# Create bucket (ap-southeast-1 = Singapore, closest to Sri Lanka)
aws s3api create-bucket \
  --bucket hive-study-resources \
  --region ap-southeast-1 \
  --create-bucket-configuration LocationConstraint=ap-southeast-1

# Block all public access
aws s3api put-public-access-block \
  --bucket hive-study-resources \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### 2 — Configure `.env`

```env
PORT=3002
MONGO_URI=mongodb://localhost:27017/hive

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# AWS S3
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=hive-study-resources

# RAG Service
RAG_SERVICE_URL=http://localhost:8000
```

### 3 — Get a Token

```bash
# Via auth-service login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hive.lk","password":"Admin@123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "Token: $TOKEN"
```

### 4 — Start the service

```bash
cd services/resource-service
npm start         # production
npm run dev       # development (nodemon)
```

---

## Endpoints

### Public (no auth required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check — returns service status + S3 bucket name |
| `GET` | `/` | Root — lists available endpoint paths |

---

### Subject Management

| Method | Path | Auth | Role |
|--------|------|------|------|
| `POST` | `/resources/subjects` | ✅ | admin, superadmin |
| `GET` | `/resources/subjects` | ✅ | any |
| `GET` | `/resources/subjects/:subjectId` | ✅ | any |
| `PUT` | `/resources/subjects/:subjectId` | ✅ | admin, superadmin |
| `DELETE` | `/resources/subjects/:subjectId` | ✅ | superadmin only |

#### POST /resources/subjects
Create a new subject.

**Request body:**
```json
{
  "subjectId":   "SE3050",
  "subjectName": "Software Architecture",
  "subjectCode": "SE3050",
  "level":       3,
  "semester":    1,
  "description": "Advanced software architecture patterns (optional)"
}
```

**Response 201:**
```json
{
  "message": "Subject created",
  "subject": {
    "subjectId":   "SE3050",
    "subjectName": "Software Architecture",
    "subjectCode": "SE3050",
    "level":       3,
    "semester":    1,
    "description": "Advanced software architecture patterns",
    "createdBy":   "uid-of-admin",
    "isActive":    true,
    "createdAt":   "2026-03-12T05:00:00.000Z",
    "updatedAt":   "2026-03-12T05:00:00.000Z"
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:3002/resources/subjects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId":   "SE3050",
    "subjectName": "Software Architecture",
    "subjectCode": "SE3050",
    "level":       3,
    "semester":    1
  }'
```

---

#### GET /resources/subjects
List all active subjects sorted by level → semester.

**cURL:**
```bash
curl http://localhost:3002/resources/subjects \
  -H "Authorization: Bearer $TOKEN"
```

**Response 200:**
```json
{
  "count": 2,
  "subjects": [
    { "subjectId": "SE1010", "subjectName": "Programming Fundamentals", "level": 1, "semester": 1 },
    { "subjectId": "SE3050", "subjectName": "Software Architecture",    "level": 3, "semester": 1 }
  ]
}
```

---

#### GET /resources/subjects/:subjectId
Get a subject plus its resources grouped by type.

**cURL:**
```bash
curl http://localhost:3002/resources/subjects/SE3050 \
  -H "Authorization: Bearer $TOKEN"
```

**Response 200:**
```json
{
  "subject":   { "subjectId": "SE3050", "subjectName": "Software Architecture", ... },
  "resources": {
    "past_papers":    [ { "resourceId": "...", "title": "2024 Past Paper", ... } ],
    "resource_books": [],
    "notes":          [ { "resourceId": "...", "title": "Week 1 Notes", ... } ]
  }
}
```

---

### Resource Management

| Method | Path | Auth | Role |
|--------|------|------|------|
| `POST` | `/resources/upload` | ✅ | admin, superadmin |
| `GET` | `/resources/subject/:subjectId` | ✅ | any |
| `GET` | `/resources/stats` | ✅ | admin, superadmin |
| `GET` | `/resources/:resourceId` | ✅ | any |
| `GET` | `/resources/:resourceId/download` | ✅ | any |
| `DELETE` | `/resources/:resourceId` | ✅ | admin, superadmin |

#### POST /resources/upload
Upload a PDF to S3 and save metadata in MongoDB. Automatically notifies the RAG service.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ | PDF file (max 50 MB) |
| `subjectId` | string | ✅ | e.g. `SE3050` |
| `resourceType` | string | ✅ | `past_paper` \| `resource_book` \| `note` |
| `title` | string | ✅ | Human-readable title |

**cURL:**
```bash
curl -X POST http://localhost:3002/resources/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/lecture-notes.pdf" \
  -F "subjectId=SE3050" \
  -F "resourceType=note" \
  -F "title=Week 1 — Introduction to Architecture"
```

**Response 201:**
```json
{
  "message": "Resource uploaded successfully",
  "resource": {
    "resourceId":   "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "subjectId":    "SE3050",
    "subjectName":  "Software Architecture",
    "resourceType": "note",
    "title":        "Week 1 — Introduction to Architecture",
    "fileName":     "lecture-notes.pdf",
    "fileSize":     204800,
    "mimeType":     "application/pdf",
    "s3Url":        "https://hive-study-resources.s3.ap-southeast-1.amazonaws.com/resources/SE3050/note/1741756800000-lecture-notes.pdf",
    "uploadedBy":   "uid-of-admin",
    "downloadCount": 0,
    "isEmbedded":   true,
    "embeddedAt":   "2026-03-12T05:00:00.000Z",
    "isActive":     true,
    "createdAt":    "2026-03-12T05:00:00.000Z"
  }
}
```

> **isEmbedded** is set to `true` only if the RAG service responds 200/202.  
> If the RAG service is down, the upload still succeeds — embedding can be retried.

---

#### GET /resources/subject/:subjectId
Get all resources for a subject, grouped by type.

**cURL:**
```bash
curl http://localhost:3002/resources/subject/SE3050 \
  -H "Authorization: Bearer $TOKEN"
```

**Response 200:**
```json
{
  "subject": { "subjectId": "SE3050", "subjectName": "Software Architecture", ... },
  "totalResources": 3,
  "resources": {
    "past_papers":    [ ... ],
    "resource_books": [ ... ],
    "notes":          [ ... ]
  }
}
```

---

#### GET /resources/stats
Aggregated statistics for admin dashboard.

**cURL:**
```bash
curl http://localhost:3002/resources/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Response 200:**
```json
{
  "totalResources":    42,
  "embeddedCount":     38,
  "pendingEmbedding":  4,
  "byType": [
    { "_id": "note",          "count": 20, "totalDownloads": 340 },
    { "_id": "past_paper",    "count": 15, "totalDownloads": 890 },
    { "_id": "resource_book", "count":  7, "totalDownloads": 120 }
  ],
  "bySubject": [
    { "_id": "SE3050", "subjectName": "Software Architecture", "resourceCount": 12, "totalDownloads": 450 }
  ],
  "topDownloaded": [
    { "resourceId": "...", "title": "2024 Past Paper", "subjectId": "SE3050", "downloadCount": 210 }
  ]
}
```

---

#### GET /resources/:resourceId/download
Generate a **pre-signed S3 URL** valid for 1 hour. Does NOT redirect — returns the URL in JSON.

**cURL:**
```bash
curl http://localhost:3002/resources/f47ac10b-58cc-4372-a567-0e02b2c3d479/download \
  -H "Authorization: Bearer $TOKEN"
```

**Response 200:**
```json
{
  "message":     "Download URL generated (valid for 1 hour)",
  "fileName":    "lecture-notes.pdf",
  "fileSize":    204800,
  "presignedUrl": "https://hive-study-resources.s3.ap-southeast-1.amazonaws.com/resources/SE3050/note/...?X-Amz-Signature=...",
  "expiresIn":   3600
}
```

> The frontend should `window.open(presignedUrl)` or `<a href={presignedUrl} download>`.

---

#### DELETE /resources/:resourceId
Soft-delete a resource (sets `isActive: false`). Also notifies RAG service to remove embeddings.

**cURL:**
```bash
curl -X DELETE http://localhost:3002/resources/f47ac10b-58cc-4372-a567-0e02b2c3d479 \
  -H "Authorization: Bearer $TOKEN"
```

**Response 200:**
```json
{
  "message":    "Resource deleted successfully",
  "resourceId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

---

## Error Responses

| HTTP | Code | When |
|------|------|------|
| `400` | — | Validation failure, wrong file type, file too large |
| `401` | — | No `Authorization` header |
| `403` | — | Invalid/expired token, or insufficient role |
| `404` | — | Subject/resource not found, unknown route |
| `500` | — | Server error (DB, S3, etc.) |

**Example 400 — wrong file type:**
```json
{ "message": "Only PDF files are allowed" }
```

**Example 401 — no token:**
```json
{ "message": "Unauthorized: no token provided" }
```

**Example 403 — wrong role:**
```json
{ "message": "Forbidden: requires one of [admin, superadmin]" }
```

---

## MongoDB Document Examples

### Subject document
```json
{
  "_id":         "65f1a2b3c4d5e6f7a8b9c0d1",
  "subjectId":   "SE3050",
  "subjectName": "Software Architecture",
  "subjectCode": "SE3050",
  "level":       3,
  "semester":    1,
  "description": "Advanced software architecture patterns",
  "createdBy":   "uid_of_admin_user",
  "isActive":    true,
  "createdAt":   "2026-03-12T05:00:00.000Z",
  "updatedAt":   "2026-03-12T05:00:00.000Z",
  "__v":         0
}
```

### Resource document
```json
{
  "_id":          "65f1a2b3c4d5e6f7a8b9c0d2",
  "resourceId":   "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "subjectId":    "SE3050",
  "subjectName":  "Software Architecture",
  "resourceType": "past_paper",
  "title":        "SE3050 Final Exam 2024",
  "fileName":     "SE3050-final-2024.pdf",
  "fileSize":     512000,
  "mimeType":     "application/pdf",
  "s3Key":        "resources/SE3050/past_paper/1741756800000-SE3050-final-2024.pdf",
  "s3Url":        "https://hive-study-resources.s3.ap-southeast-1.amazonaws.com/resources/SE3050/past_paper/1741756800000-SE3050-final-2024.pdf",
  "uploadedBy":   "uid_of_admin_user",
  "downloadCount": 47,
  "isActive":     true,
  "isEmbedded":   true,
  "embeddedAt":   "2026-03-12T05:01:30.000Z",
  "createdAt":    "2026-03-12T05:00:00.000Z",
  "updatedAt":    "2026-03-12T05:01:30.000Z",
  "__v":          0
}
```

---

## RAG Service Integration

When a resource is uploaded, the service calls:

```
POST http://rag-service:8000/api/rag/ingest
```

**Payload:**
```json
{
  "resourceId":   "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "subjectId":    "SE3050",
  "subjectName":  "Software Architecture",
  "s3Url":        "https://...amazonaws.com/...",
  "fileName":     "lecture-notes.pdf",
  "resourceType": "note",
  "uploadedBy":   "uid_of_admin"
}
```

When a resource is deleted:
```
DELETE http://rag-service:8000/api/rag/documents/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

Both RAG calls are **non-fatal** — if the RAG service is down, the resource operation still succeeds.

### Verify RAG notification

```bash
# Check RAG service received the document
curl http://localhost:8000/api/rag/documents/f47ac10b-58cc-4372-a567-0e02b2c3d479

# Check embedding status via resource stats
curl http://localhost:3002/resources/stats \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool | grep -E "embedded|pending"
```

---

## S3 Bucket Structure

```
hive-study-resources/
└── resources/
    ├── SE1010/
    │   ├── note/
    │   │   └── 1741756800000-week1-notes.pdf
    │   └── past_paper/
    │       └── 1741756800001-2024-final.pdf
    └── SE3050/
        ├── note/
        │   └── 1741756900000-architecture-intro.pdf
        ├── past_paper/
        │   └── 1741756900001-2024-exam.pdf
        └── resource_book/
            └── 1741756900002-clean-architecture.pdf
```

S3 key format: `resources/{SUBJECT_ID}/{resourceType}/{timestamp}-{sanitized-filename}`

---

## Postman Collection

Import this collection into Postman for quick testing:

1. Create a new environment with:
   - `base_url` = `http://localhost:3002`
   - `token` = your Firebase ID token

2. All requests use `{{base_url}}` and `Authorization: Bearer {{token}}`

3. For upload requests, set Body → form-data:
   - `file` → type: **File** → select a PDF
   - `subjectId` → type: Text → e.g. `SE3050`
   - `resourceType` → type: Text → `note` | `past_paper` | `resource_book`
   - `title` → type: Text → e.g. `Week 1 Notes`

---

## Running Tests

```bash
# Public endpoints only (no token needed)
./tests/test-resource-service.sh

# Full test suite with auth
./tests/test-resource-service.sh http://localhost:3002 eyJhbGci...

# Create a minimal test PDF first
printf '%%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%%%EOF' > /tmp/test.pdf
```
