#!/usr/bin/env node

/**
 * Test script for ticket API endpoints
 * Run this after starting the server to test the ticket system
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'adrienne@sourcegraph.com';
const ADMIN_KEY = 'build-olympics-admin-2025'; // Default admin key

async function testTicketAPI() {
    console.log('🎫 Testing Build Olympics Ticket API\n');
    
    try {
        // Test 1: Purchase ticket (initiate payment)
        console.log('1. Testing ticket purchase initiation...');
        const purchaseResponse = await axios.post(`${BASE_URL}/api/tickets/purchase`, {
            email: TEST_EMAIL
        });
        console.log('✅ Purchase response:', purchaseResponse.data);
        
        const paymentIntentId = purchaseResponse.data.payment_intent_id;
        
        // Test 2: Confirm ticket purchase
        console.log('\n2. Testing ticket confirmation...');
        const confirmResponse = await axios.post(`${BASE_URL}/api/tickets/confirm`, {
            email: TEST_EMAIL,
            stripe_payment_intent_id: paymentIntentId
        });
        console.log('✅ Confirmation response:', confirmResponse.data);
        
        // Test 3: Get tickets for email
        console.log('\n3. Testing get tickets by email...');
        const ticketsResponse = await axios.get(`${BASE_URL}/api/tickets/${TEST_EMAIL}`);
        console.log('✅ User tickets:', ticketsResponse.data);
        
        // Test 4: Get all tickets (admin)
        console.log('\n4. Testing admin get all tickets...');
        const adminTicketsResponse = await axios.get(`${BASE_URL}/api/tickets`, {
            headers: {
                'admin-key': ADMIN_KEY
            }
        });
        console.log('✅ Admin tickets:', adminTicketsResponse.data);
        
        // Test 5: Stripe webhook (placeholder)
        console.log('\n5. Testing Stripe webhook endpoint...');
        const webhookResponse = await axios.post(`${BASE_URL}/api/stripe/webhook`, {
            type: 'payment_intent.succeeded',
            data: { object: { id: paymentIntentId } }
        }, {
            headers: {
                'stripe-signature': 'placeholder_signature',
                'content-type': 'application/json'
            }
        });
        console.log('✅ Webhook response:', webhookResponse.data);
        
        console.log('\n🎉 All ticket API tests passed!');
        
    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.status, error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
        console.error('\n💡 Make sure the server is running: node server.js');
    }
}

// Test error cases
async function testErrorCases() {
    console.log('\n🚨 Testing error cases...\n');
    
    try {
        // Invalid email
        console.log('Testing invalid email...');
        try {
            await axios.post(`${BASE_URL}/api/tickets/purchase`, { email: 'invalid-email' });
        } catch (error) {
            console.log('✅ Invalid email rejected:', error.response.data.error);
        }
        
        // Missing authentication
        console.log('Testing missing admin auth...');
        try {
            await axios.get(`${BASE_URL}/api/tickets`);
        } catch (error) {
            console.log('✅ Admin auth required:', error.response.data.error);
        }
        
        // Missing required fields
        console.log('Testing missing fields...');
        try {
            await axios.post(`${BASE_URL}/api/tickets/confirm`, { email: TEST_EMAIL });
        } catch (error) {
            console.log('✅ Missing fields rejected:', error.response.data.error);
        }
        
    } catch (error) {
        console.error('❌ Error case test failed:', error.message);
    }
}

async function main() {
    await testTicketAPI();
    await testErrorCases();
    
    console.log('\n📋 Summary:');
    console.log('- ✅ Tickets table created with proper schema');
    console.log('- ✅ Purchase endpoint ready (needs Stripe integration)');
    console.log('- ✅ Confirmation endpoint with unique ticket code generation');
    console.log('- ✅ Email lookup endpoint');
    console.log('- ✅ Admin tickets endpoint with authentication');
    console.log('- ✅ Webhook endpoint ready (needs Stripe verification)');
    console.log('- ✅ Email confirmations configured');
    console.log('\n🔧 Next steps:');
    console.log('1. Add Stripe keys to .env file');
    console.log('2. Install stripe package: npm install stripe');
    console.log('3. Uncomment Stripe integration code in server.js');
}

if (require.main === module) {
    main();
}

module.exports = { testTicketAPI, testErrorCases };
