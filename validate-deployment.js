#!/usr/bin/env node

/**
 * Amp Arena Deployment Validation Script
 * 
 * Run this script after deployment to verify all functionality works correctly.
 * Usage: node validate-deployment.js [BASE_URL]
 * Example: node validate-deployment.js https://build-olympics.onrender.com
 */

const https = require('https');
const http = require('http');

class DeploymentValidator {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    async runAllTests() {
        console.log('🚀 Amp Arena Deployment Validation');
        console.log('==========================================');
        console.log(`Testing: ${this.baseUrl}\n`);

        const tests = [
            // Basic connectivity
            { name: 'Main page loads', test: () => this.testPageLoad('/') },
            { name: 'Attendee Dashboard page loads', test: () => this.testPageLoad('/attendees') },
            { name: 'Terms page loads', test: () => this.testPageLoad('/terms') },
            { name: 'Attend page loads', test: () => this.testPageLoad('/attend') },
            
            // API endpoints
            { name: 'Signup API responds', test: () => this.testSignupAPI() },
            { name: 'Admin auth API responds', test: () => this.testAdminAuthAPI() },
            { name: 'Count API responds', test: () => this.testCountAPI() },
            
            // Static assets
            { name: 'CSS files load', test: () => this.testStaticAsset('/wireframe-styles.css') },
            { name: 'JS files load', test: () => this.testStaticAsset('/script.js') },
            { name: 'Admin CSS loads', test: () => this.testStaticAsset('/admin-styles.css') },
            { name: 'Admin JS loads', test: () => this.testStaticAsset('/admin-script.js') },
        ];

        for (const test of tests) {
            await this.runTest(test.name, test.test);
        }

        this.printResults();
    }

    async runTest(name, testFn) {
        process.stdout.write(`Testing: ${name.padEnd(25)} `);
        try {
            await testFn();
            console.log('✅ PASS');
            this.results.passed++;
            this.results.tests.push({ name, status: 'PASS' });
        } catch (error) {
            console.log(`❌ FAIL - ${error.message}`);
            this.results.failed++;
            this.results.tests.push({ name, status: 'FAIL', error: error.message });
        }
    }

    testPageLoad(path) {
        return new Promise((resolve, reject) => {
            const url = `${this.baseUrl}${path}`;
            const client = url.startsWith('https:') ? https : http;
            
            const req = client.get(url, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve();
                } else {
                    reject(new Error(`Status ${res.statusCode}`));
                }
            });
            
            req.on('error', (error) => {
                reject(new Error(error.message));
            });
            
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
        });
    }

    testSignupAPI() {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({ email: 'test@example.com' });
            const url = new URL(`${this.baseUrl}/api/signup`);
            
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };

            const client = url.protocol === 'https:' ? https : http;
            const req = client.request(options, (res) => {
                // Accept any response that indicates the API is working
                if (res.statusCode >= 200 && res.statusCode < 500) {
                    resolve();
                } else {
                    reject(new Error(`Status ${res.statusCode}`));
                }
            });

            req.on('error', (error) => {
                reject(new Error(error.message));
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Timeout'));
            });

            req.write(data);
            req.end();
        });
    }

    testAdminAuthAPI() {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({ passcode: '102925' });
            const url = new URL(`${this.baseUrl}/api/admin-auth`);
            
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };

            const client = url.protocol === 'https:' ? https : http;
            const req = client.request(options, (res) => {
                if (res.statusCode === 200) {
                    resolve();
                } else {
                    reject(new Error(`Status ${res.statusCode}`));
                }
            });

            req.on('error', (error) => {
                reject(new Error(error.message));
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Timeout'));
            });

            req.write(data);
            req.end();
        });
    }

    testCountAPI() {
        return new Promise((resolve, reject) => {
            const url = `${this.baseUrl}/api/count`;
            const client = url.startsWith('https:') ? https : http;
            
            const req = client.get(url, (res) => {
                if (res.statusCode === 200) {
                    resolve();
                } else {
                    reject(new Error(`Status ${res.statusCode}`));
                }
            });
            
            req.on('error', (error) => {
                reject(new Error(error.message));
            });
            
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
        });
    }

    testStaticAsset(path) {
        return new Promise((resolve, reject) => {
            const url = `${this.baseUrl}${path}`;
            const client = url.startsWith('https:') ? https : http;
            
            const req = client.get(url, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve();
                } else {
                    reject(new Error(`Status ${res.statusCode}`));
                }
            });
            
            req.on('error', (error) => {
                reject(new Error(error.message));
            });
            
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
        });
    }

    printResults() {
        console.log('\n==========================================');
        console.log('DEPLOYMENT VALIDATION RESULTS');
        console.log('==========================================');
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📊 Total:  ${this.results.passed + this.results.failed}`);
        
        if (this.results.failed > 0) {
            console.log('\nFAILED TESTS:');
            this.results.tests
                .filter(test => test.status === 'FAIL')
                .forEach(test => {
                    console.log(`❌ ${test.name}: ${test.error}`);
                });
        }
        
        console.log(`\n${this.results.failed === 0 ? '🎉 ALL TESTS PASSED! Deployment looks good.' : '⚠️  Some tests failed. Check the issues above.'}`);
        
        if (this.results.failed === 0) {
            console.log('\nNext steps:');
            console.log('1. Test the lock screen manually (passcode: 102925)');
            console.log('2. Try signing up with a real email address');
            console.log('3. Check the admin dashboard');
            console.log('4. Verify email notifications are working');
        }
    }
}

// Run the validation
const baseUrl = process.argv[2] || 'http://localhost:3000';
const validator = new DeploymentValidator(baseUrl);
validator.runAllTests().catch(console.error);
