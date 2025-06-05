import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function submitRequest(ids, priority) {
    const response = await fetch(`${API_URL}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, priority })
    });
    return response.json();
}

async function checkStatus(ingestionId) {
    const response = await fetch(`${API_URL}/status/${ingestionId}`);
    return response.json();
}

async function runTests() {
    console.log('Starting comprehensive API tests...\n');

    try {
        // Test 1: Basic request with high priority
        console.log('Test 1: Basic high priority request');
        const highPriorityResponse = await submitRequest([1, 2, 3], 'HIGH');
        console.log('High priority ingestion ID:', highPriorityResponse.ingestion_id);
        await sleep(2000);
        const highPriorityStatus = await checkStatus(highPriorityResponse.ingestion_id);
        console.log('Initial status:', highPriorityStatus);
        await sleep(5000);
        const highPriorityFinalStatus = await checkStatus(highPriorityResponse.ingestion_id);
        console.log('Final status:', highPriorityFinalStatus);
        console.log('Test 1 completed\n');

        // Test 2: Priority handling
        console.log('Test 2: Priority handling');
        const mediumPriorityResponse = await submitRequest([4, 5, 6], 'MEDIUM');
        await sleep(1000);
        const highPriorityResponse2 = await submitRequest([7, 8, 9], 'HIGH');
        
        console.log('Medium priority ingestion ID:', mediumPriorityResponse.ingestion_id);
        console.log('High priority ingestion ID:', highPriorityResponse2.ingestion_id);
        
        await sleep(2000);
        const mediumStatus = await checkStatus(mediumPriorityResponse.ingestion_id);
        const highStatus = await checkStatus(highPriorityResponse2.ingestion_id);
        
        console.log('Medium priority status:', mediumStatus);
        console.log('High priority status:', highStatus);
        console.log('Test 2 completed\n');

        // Test 3: Rate limiting
        console.log('Test 3: Rate limiting');
        const batch1 = await submitRequest([10, 11, 12], 'LOW');
        const batch2 = await submitRequest([13, 14, 15], 'LOW');
        const batch3 = await submitRequest([16, 17, 18], 'LOW');
        
        console.log('Submitted 3 batches in quick succession');
        await sleep(2000);
        
        const status1 = await checkStatus(batch1.ingestion_id);
        const status2 = await checkStatus(batch2.ingestion_id);
        const status3 = await checkStatus(batch3.ingestion_id);
        
        console.log('Batch 1 status:', status1);
        console.log('Batch 2 status:', status2);
        console.log('Batch 3 status:', status3);
        console.log('Test 3 completed\n');

        // Test 4: Large batch processing
        console.log('Test 4: Large batch processing');
        const largeBatch = await submitRequest(
            Array.from({ length: 10 }, (_, i) => i + 20),
            'MEDIUM'
        );
        console.log('Large batch ingestion ID:', largeBatch.ingestion_id);
        await sleep(2000);
        const largeBatchStatus = await checkStatus(largeBatch.ingestion_id);
        console.log('Large batch status:', largeBatchStatus);
        console.log('Test 4 completed\n');

        // Test 5: Error handling
        console.log('Test 5: Error handling');
        try {
            await submitRequest([], 'HIGH');
            console.log('Error: Empty IDs array should be rejected');
        } catch (error) {
            console.log('Successfully rejected empty IDs array');
        }

        try {
            await submitRequest([1, 2, 3], 'INVALID');
            console.log('Error: Invalid priority should be rejected');
        } catch (error) {
            console.log('Successfully rejected invalid priority');
        }

        try {
            await checkStatus('non-existent-id');
            console.log('Error: Non-existent ID should be rejected');
        } catch (error) {
            console.log('Successfully rejected non-existent ID');
        }
        console.log('Test 5 completed\n');

        console.log('All tests completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

async function testAPI() {
    try {
        // Test POST /ingest
        const response = await fetch('http://localhost:5000/ingest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ids: [1, 2, 3, 4, 5],
                priority: 'HIGH'
            })
        });

        const data = await response.json();
        console.log('POST /ingest response:', data);

        // Test GET /status
        if (data.ingestion_id) {
            const statusResponse = await fetch(`http://localhost:5000/status/${data.ingestion_id}`);
            const statusData = await statusResponse.json();
            console.log('GET /status response:', statusData);
        }
    } catch (error) {
        console.error('Error testing API:', error);
    }
}

runTests();
testAPI(); 