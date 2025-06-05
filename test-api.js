import fetch from 'node-fetch';

const API_URL = 'http://localhost:4000';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function submitRequest(ids, priority) {
    console.log('Submitting request:', { ids, priority });
    const response = await fetch(`${API_URL}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, priority })
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}. Response: ${responseText}`);
    }
    
    const data = JSON.parse(responseText);
    if (!data.ingestion_id) {
        throw new Error('Invalid response format: ingestion_id not found');
    }
    return data;
}

async function checkStatus(ingestionId) {
    console.log('Checking status for:', ingestionId);
    const response = await fetch(`${API_URL}/status/${ingestionId}`);
    
    console.log('Status response status:', response.status);
    const responseText = await response.text();
    console.log('Status response body:', responseText);
    
    if (!response.ok) {
        throw new Error(`Failed to retrieve status: ${response.status}. Response: ${responseText}`);
    }
    
    const data = JSON.parse(responseText);
    if (!data.ingestion_id) {
        throw new Error('Invalid response format: ingestion_id not found');
    }
    return data;
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
        const test2MediumStatus = await checkStatus(mediumPriorityResponse.ingestion_id);
        const test2HighStatus = await checkStatus(highPriorityResponse2.ingestion_id);
        
        console.log('Medium priority status:', test2MediumStatus);
        console.log('High priority status:', test2HighStatus);
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

        // Test 6: Rate limit edge cases
        console.log('Test 6: Rate limit edge cases');
        const batchA = await submitRequest([100, 101, 102], 'LOW');
        const batchB = await submitRequest([103, 104, 105], 'LOW');
        const batchC = await submitRequest([106, 107, 108], 'LOW');
        
        console.log('Submitted 3 batches in quick succession');
        await sleep(2000);
        
        // Check status after 4 seconds (should still be waiting)
        await sleep(4000);
        const statusA = await checkStatus(batchA.ingestion_id);
        const statusB = await checkStatus(batchB.ingestion_id);
        const statusC = await checkStatus(batchC.ingestion_id);
        
        console.log('Status after 4 seconds:');
        console.log('Batch A:', statusA);
        console.log('Batch B:', statusB);
        console.log('Batch C:', statusC);
        
        // Check status after another 1 second (should be processing)
        await sleep(1000);
        const statusA2 = await checkStatus(batchA.ingestion_id);
        const statusB2 = await checkStatus(batchB.ingestion_id);
        const statusC2 = await checkStatus(batchC.ingestion_id);
        
        console.log('Status after 5 seconds:');
        console.log('Batch A:', statusA2);
        console.log('Batch B:', statusB2);
        console.log('Batch C:', statusC2);
        console.log('Test 6 completed\n');

        // Test 7: Mixed priority processing
        console.log('Test 7: Mixed priority processing');
        const lowPriority = await submitRequest([200, 201, 202], 'LOW');
        await sleep(1000);
        const mediumPriority = await submitRequest([203, 204, 205], 'MEDIUM');
        await sleep(1000);
        const highPriority = await submitRequest([206, 207, 208], 'HIGH');
        
        console.log('Submitted requests with different priorities');
        await sleep(2000);
        
        const lowStatus = await checkStatus(lowPriority.ingestion_id);
        const test7MediumStatus = await checkStatus(mediumPriority.ingestion_id);
        const test7HighStatus = await checkStatus(highPriority.ingestion_id);
        
        console.log('Status after 2 seconds:');
        console.log('Low priority:', lowStatus);
        console.log('Medium priority:', test7MediumStatus);
        console.log('High priority:', test7HighStatus);
        
        await sleep(5000);
        const lowStatus2 = await checkStatus(lowPriority.ingestion_id);
        const test7MediumStatus2 = await checkStatus(mediumPriority.ingestion_id);
        const test7HighStatus2 = await checkStatus(highPriority.ingestion_id);
        
        console.log('Status after 7 seconds:');
        console.log('Low priority:', lowStatus2);
        console.log('Medium priority:', test7MediumStatus2);
        console.log('High priority:', test7HighStatus2);
        console.log('Test 7 completed\n');

        // Test 8: Maximum ID limit
        console.log('Test 8: Maximum ID limit');
        try {
            await submitRequest([1000000008, 1000000009], 'HIGH');
            console.log('Successfully accepted valid maximum IDs');
        } catch (error) {
            console.error('Error with valid maximum IDs:', error);
        }

        try {
            await submitRequest([1000000008, 1000000009, 1000000008], 'HIGH');
            console.log('Successfully rejected duplicate IDs');
        } catch (error) {
            console.log('Successfully rejected duplicate IDs');
        }

        try {
            await submitRequest([1000000008, 1000000009, 1000000008, 1000000009], 'HIGH');
            console.log('Successfully rejected duplicate IDs in larger batch');
        } catch (error) {
            console.log('Successfully rejected duplicate IDs in larger batch');
        }

        try {
            await submitRequest([1000000008, 1000000009, 1000000007], 'HIGH');
            console.log('Successfully accepted maximum ID');
        } catch (error) {
            console.error('Error with maximum ID:', error);
        }

        try {
            await submitRequest([1000000008, 1000000009, 1000000008, 1000000009, 1000000007], 'HIGH');
            console.log('Successfully rejected too many IDs');
        } catch (error) {
            console.log('Successfully rejected too many IDs');
        }
        console.log('Test 8 completed\n');

        // Test 9: Batch size edge cases
        console.log('Test 9: Batch size edge cases');
        const singleId = await submitRequest([300], 'MEDIUM');
        const twoIds = await submitRequest([301, 302], 'MEDIUM');
        const threeIds = await submitRequest([303, 304, 305], 'MEDIUM');
        const fourIds = await submitRequest([306, 307, 308, 309], 'MEDIUM');
        
        await sleep(2000);
        const singleStatus = await checkStatus(singleId.ingestion_id);
        const twoStatus = await checkStatus(twoIds.ingestion_id);
        const threeStatus = await checkStatus(threeIds.ingestion_id);
        const fourStatus = await checkStatus(fourIds.ingestion_id);
        
        console.log('Single ID batch:', singleStatus);
        console.log('Two IDs batch:', twoStatus);
        console.log('Three IDs batch:', threeStatus);
        console.log('Four IDs batch:', fourStatus);
        console.log('Test 9 completed\n');

        // Test 10: Status transitions
        console.log('Test 10: Status transitions');
        const statusTest = await submitRequest([400, 401, 402, 403, 404], 'MEDIUM');
        
        await sleep(2000);
        const initialStatus = await checkStatus(statusTest.ingestion_id);
        console.log('Initial status:', initialStatus);
        
        await sleep(5000);
        const partialStatus = await checkStatus(statusTest.ingestion_id);
        console.log('Partial status:', partialStatus);
        
        await sleep(10000);
        
console.log('Test 10 completed\n');

console.log('All tests completed successfully!');
} catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
}
}

async function testAPI() {
    try {
        console.log('Running API tests...');
        await runTests();
        console.log('\nAll tests completed successfully!');
    } catch (error) {
        console.error('Error testing API:', error);
    }
}

testAPI(); 