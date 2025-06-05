import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testIngestionAPI() {
    console.log('Starting API tests...\n');

    // Test 1: Submit a medium priority request
    console.log('Test 1: Submitting medium priority request...');
    const mediumResponse = await fetch(`${API_URL}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ids: [1, 2, 3, 4, 5],
            priority: 'MEDIUM'
        })
    });
    const mediumData = await mediumResponse.json();
    console.log('Medium priority ingestion ID:', mediumData.ingestion_id);
    await sleep(1000);

    // Test 2: Submit a high priority request
    console.log('\nTest 2: Submitting high priority request...');
    const highResponse = await fetch(`${API_URL}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ids: [6, 7, 8, 9],
            priority: 'HIGH'
        })
    });
    const highData = await highResponse.json();
    console.log('High priority ingestion ID:', highData.ingestion_id);

    // Test 3: Check status of both requests
    console.log('\nTest 3: Checking status of both requests...');
    for (let i = 0; i < 3; i++) {
        console.log(`\nStatus check ${i + 1}:`);
        
        const mediumStatus = await fetch(`${API_URL}/status/${mediumData.ingestion_id}`);
        const mediumStatusData = await mediumStatus.json();
        console.log('Medium priority status:', mediumStatusData.status);
        console.log('Medium priority batches:', mediumStatusData.batches);

        const highStatus = await fetch(`${API_URL}/status/${highData.ingestion_id}`);
        const highStatusData = await highStatus.json();
        console.log('High priority status:', highStatusData.status);
        console.log('High priority batches:', highStatusData.batches);

        await sleep(5000);
    }

    // Test 4: Submit a low priority request
    console.log('\nTest 4: Submitting low priority request...');
    const lowResponse = await fetch(`${API_URL}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ids: [10, 11, 12],
            priority: 'LOW'
        })
    });
    const lowData = await lowResponse.json();
    console.log('Low priority ingestion ID:', lowData.ingestion_id);

    // Test 5: Final status check
    console.log('\nTest 5: Final status check...');
    await sleep(5000);
    
    const finalMediumStatus = await fetch(`${API_URL}/status/${mediumData.ingestion_id}`);
    const finalMediumData = await finalMediumStatus.json();
    console.log('Final medium priority status:', finalMediumData.status);
    console.log('Final medium priority batches:', finalMediumData.batches);

    const finalHighStatus = await fetch(`${API_URL}/status/${highData.ingestion_id}`);
    const finalHighData = await finalHighStatus.json();
    console.log('Final high priority status:', finalHighData.status);
    console.log('Final high priority batches:', finalHighData.batches);

    const finalLowStatus = await fetch(`${API_URL}/status/${lowData.ingestion_id}`);
    const finalLowData = await finalLowStatus.json();
    console.log('Final low priority status:', finalLowData.status);
    console.log('Final low priority batches:', finalLowData.batches);
}

testIngestionAPI().catch(console.error); 