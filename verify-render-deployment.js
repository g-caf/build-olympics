#!/usr/bin/env node

/**
 * Render Deployment Verification Script
 * Run this after deploying to Render to verify all functionality
 * 
 * Usage: node verify-render-deployment.js [SERVICE_URL]
 * Example: node verify-render-deployment.js https://build-olympics.onrender.com
 */

const https = require('https');
const http = require('http');

class RenderVerifier {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || process.argv[2];
        if (!this.baseUrl) {
            console.error('❌ Please provide the Render service URL');
            console.log('Usage: node verify-render-deployment.js https://your-service.onrender.com');
            process.exit(1);
        }
        
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    async makeRequest(path, options = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const protocol = url.protocol === 'https:' ? https : http;
            
            const requestOptions = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: options.method || 'GET',
                headers: {
                    'User-Agent': 'RenderVerifier/1.0',
                    ...options.headers
                }
            };

            const req = protocol.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                });
            });

            req.on('error', reject);
            
            if (options.data) {
                req.write(options.data);
            }
            
            req.end();
        });
    }

    log(result, test, message, details = '') {
        const status = result ? '✅' : '❌';
        console.log(`${status} ${test}: ${message}`);
        if (details && !result) {
            console.log(`   Details: ${details}`);
        }
        
        this.results.tests.push({ result, test, message, details });
        if (result) this.results.passed++;
        else this.results.failed++;
    }

    async testBasicConnectivity() {
        console.log('\n🌐 Testing Basic Connectivity...');
        
        try {
            const response = await this.makeRequest('/');
            this.log(
                response.statusCode === 200,
                'Homepage Load',
                'Homepage loads successfully',
                `Status: ${response.statusCode}`
            );
            
            this.log(
                response.data.includes('Amp Arena'),
                'Homepage Content',
                'Homepage contains expected content',
                'Looking for "Amp Arena" text'
            );
        } catch (error) {
            this.log(false, 'Basic Connectivity', 'Failed to connect to service', error.message);
        }
    }

    async testRoutes() {
        console.log('\n📄 Testing Page Routes...');
        
        const routes = [
            { path: '/attendees', name: 'Attendee Dashboard' },
            { path: '/terms', name: 'Terms Page' },
            { path: '/attend', name: 'Attend Page' }
        ];

        for (const route of routes) {
            try {
                const response = await this.makeRequest(route.path);
                this.log(
                    response.statusCode === 200,
                    `${route.name} Route`,
                    `${route.path} loads successfully`,
                    `Status: ${response.statusCode}`
                );
            } catch (error) {
                this.log(false, `${route.name} Route`, `Failed to load ${route.path}`, error.message);
            }
        }
    }

    async testAPIEndpoints() {
        console.log('\n🔌 Testing API Endpoints...');
        
        // Test signup count endpoint
        try {
            const response = await this.makeRequest('/api/count');
            const parsed = JSON.parse(response.data);
            this.log(
                response.statusCode === 200 && typeof parsed.count === 'number',
                'Signup Count API',
                'Count endpoint returns valid data',
                `Count: ${parsed.count}`
            );
        } catch (error) {
            this.log(false, 'Signup Count API', 'Count endpoint failed', error.message);
        }

        // Test admin authentication
        try {
            const response = await this.makeRequest('/api/admin-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ passcode: '102925' })
            });
            
            const parsed = JSON.parse(response.data);
            this.log(
                response.statusCode === 200 && parsed.adminKey,
                'Admin Authentication',
                'Admin auth works with correct passcode',
                `Admin key length: ${parsed.adminKey?.length}`
            );
        } catch (error) {
            this.log(false, 'Admin Authentication', 'Admin auth failed', error.message);
        }
    }

    async testSignupFlow() {
        console.log('\n📝 Testing Signup Flow...');
        
        const testEmail = `test-${Date.now()}@example.com`;
        
        try {
            const response = await this.makeRequest('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ email: testEmail })
            });
            
            const parsed = JSON.parse(response.data);
            this.log(
                response.statusCode === 200 && parsed.id,
                'Signup Submission',
                'Email signup works correctly',
                `Signup ID: ${parsed.id}`
            );

            // Test duplicate email handling
            const duplicateResponse = await this.makeRequest('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ email: testEmail })
            });
            
            this.log(
                duplicateResponse.statusCode === 409,
                'Duplicate Email Handling',
                'Duplicate emails are properly rejected',
                `Status: ${duplicateResponse.statusCode}`
            );

        } catch (error) {
            this.log(false, 'Signup Flow', 'Signup functionality failed', error.message);
        }
    }

    async testSecurityHeaders() {
        console.log('\n🔒 Testing Security Configuration...');
        
        try {
            const response = await this.makeRequest('/');
            const headers = response.headers;
            
            this.log(
                headers['x-content-type-options'] === 'nosniff',
                'Security Headers',
                'Content type options header present',
                'X-Content-Type-Options: nosniff'
            );
            
            this.log(
                !!headers['x-frame-options'],
                'Frame Options',
                'Frame options header present',
                `X-Frame-Options: ${headers['x-frame-options']}`
            );

            this.log(
                !!headers['content-security-policy'],
                'Content Security Policy',
                'CSP header present',
                'CSP configured'
            );
        } catch (error) {
            this.log(false, 'Security Headers', 'Failed to check security headers', error.message);
        }
    }

    async testEnvironmentConfig() {
        console.log('\n⚙️  Testing Environment Configuration...');
        
        try {
            // Test if admin endpoints require proper authentication
            const response = await this.makeRequest('/api/signups');
            
            this.log(
                response.statusCode === 401,
                'Admin Protection',
                'Admin endpoints properly protected',
                'Unauthorized access rejected'
            );

            // Test invalid admin auth
            const badAuthResponse = await this.makeRequest('/api/admin-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ passcode: 'wrong' })
            });
            
            this.log(
                badAuthResponse.statusCode === 401,
                'Auth Validation',
                'Invalid credentials rejected',
                'Wrong passcode properly rejected'
            );

        } catch (error) {
            this.log(false, 'Environment Config', 'Failed to test environment config', error.message);
        }
    }

    async runAllTests() {
        console.log(`\n🚀 Starting Render Deployment Verification for: ${this.baseUrl}\n`);
        console.log('=' .repeat(60));
        
        await this.testBasicConnectivity();
        await this.testRoutes();
        await this.testAPIEndpoints();
        await this.testSignupFlow();
        await this.testSecurityHeaders();
        await this.testEnvironmentConfig();
        
        this.showSummary();
    }

    showSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 DEPLOYMENT VERIFICATION SUMMARY');
        console.log('='.repeat(60));
        
        const total = this.results.passed + this.results.failed;
        const passRate = ((this.results.passed / total) * 100).toFixed(1);
        
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📈 Pass Rate: ${passRate}%`);
        
        if (this.results.failed === 0) {
            console.log('\n🎉 All tests passed! Deployment is ready for production.');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the issues above.');
            console.log('   Check the migration guide for troubleshooting steps.');
        }
        
        console.log('\n📋 Next Steps:');
        console.log('1. If all tests pass, proceed with domain DNS configuration');
        console.log('2. Test email notifications manually by submitting a signup');
        console.log('3. Verify admin dashboard functionality');
        console.log('4. Monitor Render logs for any errors');
        
        console.log('\n' + '='.repeat(60));
        
        process.exit(this.results.failed > 0 ? 1 : 0);
    }
}

// Run the verification
const verifier = new RenderVerifier();
verifier.runAllTests().catch(error => {
    console.error('❌ Verification script failed:', error.message);
    process.exit(1);
});
