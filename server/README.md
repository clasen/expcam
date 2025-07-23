# OCR Server

This server handles image processing for the expense camera application using the shotx WebSocket framework.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Start the server:
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

The server accepts WebSocket connections and handles the following message types:

### `process_receipt`
Process a single receipt image.

**Request:**
```javascript
{
  imageData: "base64-encoded-image-data",
  fileName: "receipt.jpg"
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    merchant: "Store Name",
    amount: 29.99,
    currency: "USD",
    date: "2024-01-15",
    category: "meals",
    // ... more receipt data
  },
  confidence: 0.92,
  processingTime: 1250
}
```

### `process_batch`
Process multiple receipt images.

**Request:**
```javascript
{
  images: [
    {
      imageData: "base64-encoded-image-data",
      fileName: "receipt1.jpg"
    },
    {
      imageData: "base64-encoded-image-data", 
      fileName: "receipt2.jpg"
    }
  ]
}
```

**Response:**
```javascript
{
  success: true,
  results: [
    {
      fileName: "receipt1.jpg",
      success: true,
      data: { /* receipt data */ }
    },
    // ... more results
  ],
  totalProcessed: 2,
  successCount: 2
}
```

### `health_check`
Check server status.

**Response:**
```javascript
{
  status: "ok",
  timestamp: "2024-01-15T10:30:00.000Z",
  auth: { userId: "..." }
}
```

## Authentication

The server uses simple token-based authentication. Tokens should start with `expcam_` prefix.

In production, replace the authentication handler with proper validation logic.

## OCR Integration

Currently uses simulated OCR data. To integrate with real OCR services:

1. Replace the logic in `ocrProcessor.js`
2. Add API credentials for your chosen OCR service (Google Vision, AWS Textract, etc.)
3. Update the processing functions to call the real OCR API

## Client Integration

The client-side code automatically falls back to simulation if the server is unavailable, ensuring the app continues to work offline.