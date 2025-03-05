# IIIF Data Extractor

Extract and process IIIF manifest data with configurable project settings.

## Configuration

### Project ID

The project ID can be configured in `src/index.ts`:

```typescript
const canvasProcessor = new CanvasProcessor(
  fileSystem,
  errorLogger,
  emptyModelLogger,
  progressTracker,
  YOUR_PROJECT_ID // Replace with your project ID (e.g., 21)
);
```

### Discovery API URL

The IIIF Discovery API endpoint can be configured in `src/services/iiifDiscovery.ts`:

```typescript
const API_ENDPOINT = 'YOUR_DISCOVERY_API_URL';
// Example: https://example.org/iiif/activity/collection
```

### Processing Settings

#### Batch Size

The number of canvases processed in each batch can be configured in `src/services/manifestProcessor.ts`:

```typescript
const BATCH_SIZE = 100; // Number of canvases to process per batch
```

The script processes canvases in batches to manage memory usage and provide progress updates. After completing each batch, it automatically continues with the next batch until all canvases are processed.

#### Rate Limiting

To prevent overwhelming the API, the script implements rate limiting in two places:

1. Manifest Fetching (`src/services/iiifDiscovery.ts`):
```typescript
const RATE_LIMIT = 5; // Maximum concurrent manifest requests
```

2. Canvas Processing (`src/services/canvasProcessor.ts`):
```typescript
const CONCURRENT_LIMIT = 3; // Maximum concurrent canvas processing operations
```

These limits ensure stable operation while maintaining good performance. Adjust them based on your API's requirements and system capabilities.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Update configuration values as described above

3. Run the extractor:
```bash
npm start
```

## Features

- Extracts IIIF manifest data with configurable batch processing
- Organizes data by project and manifest IDs
- Tracks progress and handles errors gracefully
- Supports concurrent processing with rate limiting
- Automatically resumes from last processed canvas
- Processes manifests in configurable batch sizes

## Data Structure

Extracted data is stored in:
```
data/
  projects/
    <project_id>/
      <manifest_id>/
        <canvas_id>.json
```

## Error Handling

Errors are logged to:
```
data/error.log.json
```

Empty models are logged to:
```
data/empty-models.log.json
```

Progress is tracked in:
```
data/progress.json
```

## Progress Tracking

The script maintains progress information in `data/progress.json`, allowing it to:
- Resume from the last processed manifest
- Skip already processed canvases
- Continue processing after interruptions

This ensures no work is duplicated and processing can be safely stopped and resumed.
**Note**: Ensure all instances are updated before deploying the application.


[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/NLW-paulm/IIIF-discovery-extraction)