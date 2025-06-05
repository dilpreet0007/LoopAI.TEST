import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory storage for ingestion requests and their status
const ingestionStore = new Map();

// Priority queue for processing batches
const priorityQueue = {
    HIGH: [],
    MEDIUM: [],
    LOW: []
};

// Process batches with rate limiting
let isProcessing = false;
const RATE_LIMIT_MS = 5000; // 5 seconds
const BATCH_SIZE = 3;
const MAX_ID = 1000000007; // 10^9 + 7

// Validation functions
function validateIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('IDs must be a non-empty array');
    }
    
    for (const id of ids) {
        if (!Number.isInteger(id) || id < 1 || id > MAX_ID) {
            throw new Error(`ID must be an integer between 1 and ${MAX_ID}`);
        }
    }
}

function validatePriority(priority) {
    if (!['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
        throw new Error('Priority must be HIGH, MEDIUM, or LOW');
    }
}

async function processNextBatch() {
    if (isProcessing) return;
    isProcessing = true;

    try {
        // Get the next batch to process based on priority and timestamp
        let nextBatch = null;
        let selectedPriority = null;

        for (const priority of ['HIGH', 'MEDIUM', 'LOW']) {
            if (priorityQueue[priority].length > 0) {
                // Sort by timestamp for same priority
                priorityQueue[priority].sort((a, b) => a.timestamp - b.timestamp);
                nextBatch = priorityQueue[priority].shift();
                selectedPriority = priority;
                break;
            }
        }

        if (nextBatch) {
            const { ingestionId, batchId, ids } = nextBatch;
            
            // Update batch status to triggered
            const ingestion = ingestionStore.get(ingestionId);
            const batch = ingestion.batches.find(b => b.batch_id === batchId);
            if (batch) {
                batch.status = 'triggered';
            }

            // Simulate processing each ID
            for (const id of ids) {
                try {
                    // Simulate external API call
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    console.log(`Processed ID: ${id}`);
                } catch (error) {
                    console.error(`Error processing ID ${id}:`, error);
                    // Continue processing other IDs even if one fails
                }
            }

            // Update batch status to completed
            if (batch) {
                batch.status = 'completed';
            }

            // Update overall ingestion status
            updateIngestionStatus(ingestionId);
        }
    } catch (error) {
        console.error('Error processing batch:', error);
    } finally {
        isProcessing = false;
        // Schedule next batch processing
        setTimeout(processNextBatch, RATE_LIMIT_MS);
    }
}

function updateIngestionStatus(ingestionId) {
    const ingestion = ingestionStore.get(ingestionId);
    if (!ingestion) return;

    const allCompleted = ingestion.batches.every(batch => batch.status === 'completed');
    const anyTriggered = ingestion.batches.some(batch => batch.status === 'triggered');
    const allYetToStart = ingestion.batches.every(batch => batch.status === 'yet_to_start');

    if (allCompleted) {
        ingestion.status = 'completed';
    } else if (anyTriggered) {
        ingestion.status = 'triggered';
    } else if (allYetToStart) {
        ingestion.status = 'yet_to_start';
    }
}

// POST /ingest endpoint
app.post('/ingest', (req, res) => {
    try {
        const { ids, priority } = req.body;

        // Validate input
        validateIds(ids);
        validatePriority(priority);

        const ingestionId = uuidv4();
        const batches = [];
        const timestamp = Date.now();

        // Split IDs into batches of 3
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
            const batchIds = ids.slice(i, i + BATCH_SIZE);
            const batchId = uuidv4();
            batches.push({
                batch_id: batchId,
                ids: batchIds,
                status: 'yet_to_start'
            });

            // Add to priority queue
            priorityQueue[priority].push({
                ingestionId,
                batchId,
                ids: batchIds,
                timestamp
            });
        }

        // Store ingestion request
        ingestionStore.set(ingestionId, {
            ingestion_id: ingestionId,
            status: 'yet_to_start',
            batches,
            created_at: timestamp
        });

        // Start processing if not already running
        if (!isProcessing) {
            processNextBatch();
        }

        res.json({ ingestion_id: ingestionId });
    } catch (error) {
        console.error('Error in /ingest:', error);
        res.status(400).json({ error: error.message });
    }
});

// GET /status/:ingestionId endpoint
app.get('/status/:ingestionId', (req, res) => {
    try {
        const { ingestionId } = req.params;
        const ingestion = ingestionStore.get(ingestionId);

        if (!ingestion) {
            return res.status(404).json({ error: 'Ingestion request not found' });
        }

        res.json({
            ingestion_id: ingestion.ingestion_id,
            status: ingestion.status,
            batches: ingestion.batches
        });
    } catch (error) {
        console.error('Error in /status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 