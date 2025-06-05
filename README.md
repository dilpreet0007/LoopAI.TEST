# Data Ingestion API System

A RESTful API system for handling data ingestion requests with priority-based processing and rate limiting.

## Features

- Asynchronous batch processing
- Priority-based request handling (HIGH, MEDIUM, LOW)
- Rate limiting (1 batch per 5 seconds)
- Batch size limit (3 IDs per batch)
- Status tracking for ingestion requests
- Comprehensive error handling
- Input validation

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd data-ingestion-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```bash
PORT=5000
```

## Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### 1. Submit Ingestion Request

**Endpoint:** `POST /ingest`

**Request Body:**
```json
{
    "ids": [1, 2, 3, 4, 5],
    "priority": "HIGH"
}
```

**Response:**
```json
{
    "ingestion_id": "uuid-string"
}
```

### 2. Check Ingestion Status

**Endpoint:** `GET /status/:ingestionId`

**Response:**
```json
{
    "ingestion_id": "uuid-string",
    "status": "triggered",
    "batches": [
        {
            "batch_id": "uuid-string",
            "ids": [1, 2, 3],
            "status": "completed"
        },
        {
            "batch_id": "uuid-string",
            "ids": [4, 5],
            "status": "triggered"
        }
    ]
}
```

## Status Values

### Batch Status
- `yet_to_start`: Batch hasn't started processing
- `triggered`: Batch is currently being processed
- `completed`: Batch processing is complete

### Overall Status
- `yet_to_start`: All batches are yet to start
- `triggered`: At least one batch is triggered
- `completed`: All batches are completed

## Constraints

1. **ID Range:** 1 to 10^9 + 7
2. **Batch Size:** Maximum 3 IDs per batch
3. **Rate Limit:** 1 batch per 5 seconds
4. **Priorities:** HIGH, MEDIUM, LOW

## Priority Processing

- Higher priority requests are processed before lower priority ones
- Within the same priority, requests are processed in order of submission (FIFO)
- Example:
  - Request 1 (T0): [1,2,3,4,5] - MEDIUM
  - Request 2 (T4): [6,7,8,9] - HIGH
  - Processing order:
    1. T0-T5: [1,2,3] (from Request 1)
    2. T5-T10: [6,7,8] (from Request 2)
    3. T10-T15: [9,4,5] (remaining IDs)

## Testing

Run the test suite:
```bash
npm test
```

The test suite verifies:
- Basic request handling
- Priority-based processing
- Rate limiting
- Large batch processing
- Error handling

## Error Handling

The API handles various error cases:
- Invalid ID range
- Empty ID array
- Invalid priority
- Non-existent ingestion ID
- Server errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 