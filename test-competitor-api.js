#!/usr/bin/env node
/**
 * Test script for Competitor API endpoints
 * Run with: node test-competitor-api.js
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_ADMIN_PASSCODE = 'test-competitor-admin-2025';

// Set environment variable for testing
process.env.COMPETITOR_ADMIN_PASSCODE = TEST_ADMIN_PASSCODE;

async function testCompetitorAPI() {
    console.log('🚀 Testing Competitor API Endpoints...\n');
    
    let competitorId;
    let adminKey;
    
    try {
        // 1. Test competitor admin authentication
        console.log('1. Testing competitor admin authentication...');
        const authResponse = await axios.post(`${BASE_URL}/api/competitor-admin-auth`, {
            passcode: TEST_ADMIN_PASSCODE
        });
        adminKey = authResponse.data.competitorAdminKey;
        console.log('✅ Competitor admin auth successful\n');
        
        // 2. Test creating a new competitor
        console.log('2. Testing competitor creation...');
        const createResponse = await axios.post(`${BASE_URL}/api/competitors`, {
            email: 'test@example.com',
            full_name: 'Test Competitor',
            github_username: 'testuser',
            twitter_username: 'testuser',
            bio: 'This is a test competitor profile'
        });
        competitorId = createResponse.data.id;
        console.log(`✅ Competitor created with ID: ${competitorId}\n`);
        
        // 3. Test getting single competitor
        console.log('3. Testing get single competitor...');
        const getResponse = await axios.get(`${BASE_URL}/api/competitors/${competitorId}`);
        console.log(`✅ Retrieved competitor: ${getResponse.data.full_name}\n`);
        
        // 4. Test getting all competitors (admin required)
        console.log('4. Testing get all competitors...');
        const getAllResponse = await axios.get(`${BASE_URL}/api/competitors`, {
            headers: {
                'competitor-admin-key': adminKey
            }
        });
        console.log(`✅ Retrieved ${getAllResponse.data.length} competitors\n`);
        
        // 5. Test updating competitor
        console.log('5. Testing competitor update...');
        await axios.put(`${BASE_URL}/api/competitors/${competitorId}`, {
            email: 'test@example.com',
            full_name: 'Updated Test Competitor',
            github_username: 'testuser',
            twitter_username: 'testuser',
            bio: 'Updated bio',
            status: 'qualified'
        }, {
            headers: {
                'competitor-admin-key': adminKey
            }
        });
        console.log('✅ Competitor updated successfully\n');
        
        // 6. Test file upload (create a dummy file)
        console.log('6. Testing file upload...');
        const testFileContent = 'This is a test submission file';
        fs.writeFileSync('test-submission.txt', testFileContent);
        
        const formData = new FormData();
        formData.append('files', fs.createReadStream('test-submission.txt'));
        
        await axios.post(`${BASE_URL}/api/competitors/${competitorId}/upload`, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });
        console.log('✅ File uploaded successfully\n');
        
        // Clean up test file
        fs.unlinkSync('test-submission.txt');
        
        // 7. Test deleting competitor
        console.log('7. Testing competitor deletion...');
        await axios.delete(`${BASE_URL}/api/competitors/${competitorId}`, {
            headers: {
                'competitor-admin-key': adminKey
            }
        });
        console.log('✅ Competitor deleted successfully\n');
        
        console.log('🎉 All tests passed! Competitor API is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Check if axios is available
try {
    require.resolve('axios');
    require.resolve('form-data');
} catch (e) {
    console.log('Installing required test dependencies...');
    require('child_process').execSync('npm install axios form-data', { stdio: 'inherit' });
}

// Only run tests if this file is executed directly
if (require.main === module) {
    // Start server in background for testing
    const { spawn } = require('child_process');
    const server = spawn('node', ['server.js'], { 
        env: { ...process.env, COMPETITOR_ADMIN_PASSCODE: TEST_ADMIN_PASSCODE },
        stdio: 'pipe' 
    });
    
    // Wait for server to start
    setTimeout(async () => {
        await testCompetitorAPI();
        server.kill();
    }, 2000);
    
    server.on('exit', () => {
        process.exit(0);
    });
}
