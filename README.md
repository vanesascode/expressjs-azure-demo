# Contacts API

REST API for contact management built with Express.js that uses a JSON file as database.

## Installation

```bash
npm install
```

## Running the application

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3001`

## Endpoints

### GET /contacts

Gets all contacts.

**Response:**

```json
{
  "success": true,
  "data": [...],
  "count": 50
}
```

### GET /contacts-paginated

Gets paginated contacts with sorting and search functionality (specific for Nuxt.js frontend).

**Optional query parameters:**

- `page` - Page number (default: 1)
- `size` - Items per page (default: 10, maximum: 100)
- `sortBy` - Sorting field: id, name, email, company, status, stage, position, phone1, phone2 (default: id)
- `sortDirection` - Direction: asc, desc (default: asc)
- `search` - Search term to filter contacts (searches in: id, name, position, email, company, phone1, phone2)
- `company` - Filter by company (reserved for future use)

**Examples:**

- `GET /contacts-paginated?page=2&size=5&sortBy=name&sortDirection=desc`
- `GET /contacts-paginated?page=1&size=8&search=sarah`
- `GET /contacts-paginated?search=microsoft&sortBy=name`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1001,
      "name": "Sarah Johnson",
      "email": "sarah.johnson@microsoft.com",
      "company": "Microsoft Corporation",
      "phone1": "+1 (206) 555-0123",
      "phone2": "+1 (206) 555-0124"
    }
  ],
  "pagination": {
    "page": 2,
    "size": 5,
    "total": 50,
    "totalAll": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": true
  },
  "sort": {
    "field": "name",
    "direction": "desc"
  }
}
```

### GET /contacts/:id

Gets a specific contact by ID.

**Example:** `GET /contacts/1001`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1001,
    "name": "Sarah Johnson",
    "email": "sarah.johnson@microsoft.com",
    "company": "Microsoft Corporation",
    "phone1": "+1 (206) 555-0123",
    "phone2": "+1 (206) 555-0124"
  }
}
```

### POST /contacts

Creates a new contact.

**Required fields:** `name`

**Request body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "company": "Example Corp",
  "phone1": "+1 555-0123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Contact created successfully",
  "data": {
    "id": 1050,
    "name": "John Doe",
    "email": "john.doe@example.com",
    ...
  }
}
```

### PUT /contacts/:id

Updates a contact completely.

**Example:** `PUT /contacts/1001`

**Request body:** (all contact fields)

```json
{
  "name": "Sarah Johnson Updated",
  "email": "sarah.johnson.updated@microsoft.com",
  "company": "Microsoft Corporation",
  "phone1": "+1 (206) 555-0123",
  "phone2": "+1 (206) 555-0124"
}
```

### PATCH /contacts/:id

Updates a contact partially.

**Example:** `PATCH /contacts/1001`

**Request body:** (only fields to update)

```json
{
  "phone1": "+1 (206) 555-9999"
}
```

### DELETE /contacts/:id

Deletes a specific contact.

**Example:** `DELETE /contacts/1001`

**Response:**

```json
{
  "success": true,
  "message": "Contact deleted successfully",
  "data": {
    // deleted contact data
  }
}
```

### DELETE /contacts

Deletes multiple contacts (for bulk operations from frontend).

**Request body:**

```json
{
  "ids": [1001, 1007, 1010]
}
```

**Successful response:**

```json
{
  "success": true,
  "message": "3 contact(s) deleted successfully",
  "data": {
    "deletedContacts": [
      {
        "id": 1001,
        "name": "Sarah Johnson"
        // ... rest of contact data
      }
    ],
    "deletedCount": 3,
    "notFoundIds": [1999]
  }
}
```

**Error response (invalid IDs):**

```json
{
  "success": false,
  "message": "IDs array is required and must not be empty"
}
```

## HTTP Status Codes

- `200` - OK (GET, PUT, PATCH successful)
- `201` - Created (POST successful)
- `400` - Bad Request (invalid data)
- `404` - Not Found (contact not found)
- `409` - Conflict (duplicate email)
- `500` - Internal Server Error

## Validations

- **Required fields:** `name`
- **Unique email:** Duplicate emails not allowed (only if email is provided)
- **Email format:** Must be a valid email format
- **Automatic ID:** Automatically generated for new contacts

## Contact Structure

```json
{
  "id": "unique number (automatically generated)",
  "name": "string (required)",
  "email": "string (optional, unique, email format)",
  "company": "string (optional)",
  "phone1": "string (optional)",
  "phone2": "string (optional)"
}
```

## Usage Examples with curl

```bash
# Get all contacts
curl http://localhost:3001/contacts

# Get a specific contact
curl http://localhost:3001/contacts/1001

# Create a new contact
curl -X POST http://localhost:3001/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "company": "Example Inc",
    "position": "Manager"
  }'

# Update a contact completely
curl -X PUT http://localhost:3001/contacts/1001 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Johnson Updated",
    "email": "sarah.updated@microsoft.com",
    "company": "Microsoft Corporation",
    "status": "premium"
  }'

# Update a contact partially
curl -X PATCH http://localhost:3001/contacts/1001 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "premium"
  }'

# Delete a contact
curl -X DELETE http://localhost:3001/contacts/1001

# Delete multiple contacts
curl -X DELETE http://localhost:3001/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [1001, 1007, 1010]
  }'
```
