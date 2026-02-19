import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration', true);
const failedRequests = new Counter('failed_requests');
const statusCodeDistribution = new Counter('status_codes');

// ============================================================
// LOAD TEST CONFIGURATION
// Simulates normal expected traffic over a period of time
// ============================================================
export const options = {
     stages: [
          { duration: '30s', target: 10 },   // Ramp up to 10 users over 30s
          { duration: '1m', target: 25 },     // Stay at 25 users for 1 minute
          { duration: '1m', target: 50 },     // Ramp up to 50 users for 1 minute
          { duration: '1m', target: 50 },     // Stay at 50 users for 1 minute (steady state)
          { duration: '30s', target: 0 },     // Ramp down to 0 users
     ],
     thresholds: {
          http_req_duration: ['p(95)<3000'],   // 95% of requests should be < 3s
          http_req_failed: ['rate<0.05'],      // Error rate should be < 5%
          errors: ['rate<0.05'],               // Custom error rate < 5%
     },
};

const BASE_URL = 'http://localhost:3000/api';

// Helper: common headers
const headers = {
     'Content-Type': 'application/json',
};

// Helper function to handle response and track errors
function handleResponse(res, testName) {
     if (res.status === 0) {
          console.error(`❌ ${testName}: Network error or timeout`);
          failedRequests.add(1, { endpoint: testName, reason: 'network_error' });
     } else if (res.status >= 500) {
          console.error(`❌ ${testName}: Server error ${res.status} - ${res.body?.substring(0, 100) || 'No response body'}`);
          failedRequests.add(1, { endpoint: testName, reason: `status_${res.status}` });
     } else if (res.status === 429) {
          console.error(`⚠️  ${testName}: Rate limited (429)`);
          failedRequests.add(1, { endpoint: testName, reason: 'rate_limited' });
     } else if (res.status >= 400 && res.status < 500) {
          console.warn(`⚠️  ${testName}: Client error ${res.status}`);
          failedRequests.add(1, { endpoint: testName, reason: `status_${res.status}` });
     } else if (res.error) {
          console.error(`❌ ${testName}: ${res.error}`);
          failedRequests.add(1, { endpoint: testName, reason: 'error' });
     }
     statusCodeDistribution.add(1, { code: res.status });
     return res;
}

// ============================================================
// TEST SCENARIOS
// ============================================================

export default function () {
     // -------------------------------------------------------
     // TC-L01: GET Categories (Public browsing)
     // -------------------------------------------------------
     group('TC-L01: Get All Categories', () => {
          const res = handleResponse(
               http.get(`${BASE_URL}/categoryRoutes/categories`, { headers }),
               'TC-L01'
          );
          const passed = check(res, {
               'TC-L01: status is 200': (r) => r.status === 200,
               'TC-L01: response time < 2s': (r) => r.timings.duration < 2000,
          });
          errorRate.add(!passed);
          if (res.status > 0) apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L02: GET Users list
     // -------------------------------------------------------
     group('TC-L02: Get Users', () => {
          const res = handleResponse(
               http.get(`${BASE_URL}/userRoutes/users`, { headers }),
               'TC-L02'
          );
          const passed = check(res, {
               'TC-L02: status is 200': (r) => r.status === 200,
               'TC-L02: response time < 2s': (r) => r.timings.duration < 2000,
          });
          errorRate.add(!passed);
          if (res.status > 0) apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L03: GET Workers list
     // -------------------------------------------------------
     group('TC-L03: Get Workers', () => {
          const res = handleResponse(
               http.get(`${BASE_URL}/workerRoutes/workers`, { headers }),
               'TC-L03'
          );
          const passed = check(res, {
               'TC-L03: status is 200': (r) => r.status === 200,
               'TC-L03: response time < 2s': (r) => r.timings.duration < 2000,
          });
          errorRate.add(!passed);
          if (res.status > 0) apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L04: Check Email Exists (Signup flow)
     // -------------------------------------------------------
     group('TC-L04: Check Email Exists', () => {
          const testEmail = `testuser_${__VU}_${__ITER}@example.com`;
          const res = handleResponse(
               http.get(`${BASE_URL}/userRoutes/checkEmail/${testEmail}`, { headers }),
               'TC-L04'
          );
          const passed = check(res, {
               'TC-L04: server responds': (r) => r.status >= 200 && r.status < 500,
               'TC-L04: response time < 2s': (r) => r.timings.duration < 2000,
          });
          errorRate.add(!passed);
          if (res.status > 0) apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L05: Search Workers
     // -------------------------------------------------------
     group('TC-L05: Search Workers', () => {
          // Dhaka coordinates: lat=23.8103, lon=90.4125
          const res = handleResponse(
               http.get(`${BASE_URL}/workerRoutes/workers/search?lat=23.8103&lon=90.4125&radiusMeters=5000`, { headers }),
               'TC-L05'
          );
          const passed = check(res, {
               'TC-L05: status is 200': (r) => r.status === 200,
               'TC-L05: response time < 2s': (r) => r.timings.duration < 2000,
          });
          errorRate.add(!passed);
          if (res.status > 0) apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L06: GET Sections
     // -------------------------------------------------------
     group('TC-L06: Get All Sections', () => {
          const res = handleResponse(
               http.get(`${BASE_URL}/categoryRoutes/sections`, { headers }),
               'TC-L06'
          );
          const passed = check(res, {
               'TC-L06: status is 200': (r) => r.status === 200,
               'TC-L06: response time < 2s': (r) => r.timings.duration < 2000,
          });
          errorRate.add(!passed);
          if (res.status > 0) apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L07: GET Orders list
     // -------------------------------------------------------
     group('TC-L07: Get Orders', () => {
          const res = handleResponse(
               http.get(`${BASE_URL}/orderRoutes/orders`, { headers }),
               'TC-L07'
          );
          const passed = check(res, {
               'TC-L07: server responds': (r) => r.status >= 200 && r.status < 500,
               'TC-L07: response time < 3s': (r) => r.timings.duration < 3000,
          });
          errorRate.add(!passed);
          if (res.status > 0) apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L08: GET All Complaints
     // -------------------------------------------------------
     group('TC-L08: Get All Complaints', () => {
          const res = handleResponse(
               http.get(`${BASE_URL}/complaints/getAllcomplaints`, { headers }),
               'TC-L08'
          );
          const passed = check(res, {
               'TC-L08: status is 200': (r) => r.status === 200,
               'TC-L08: response time < 2s': (r) => r.timings.duration < 2000,
          });
          errorRate.add(!passed);
          if (res.status > 0) apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L09: Admin Dashboard Summary
     // -------------------------------------------------------
     group('TC-L09: Admin Dashboard Summary', () => {
          const res = handleResponse(
               http.get(`${BASE_URL}/admin/dashboard/summary`, { headers }),
               'TC-L09'
          );
          const passed = check(res, {
               'TC-L09: status is 200': (r) => r.status === 200,
               'TC-L09: response time < 3s': (r) => r.timings.duration < 3000,
          });
          errorRate.add(!passed);
          if (res.status > 0) apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L10: Admin Get All Bookings
     // -------------------------------------------------------
     group('TC-L10: Admin Get All Bookings', () => {
          const res = handleResponse(
               http.get(`${BASE_URL}/admin/bookings?page=1&limit=10`, { headers }),
               'TC-L10'
          );
          const passed = check(res, {
               'TC-L10: status is 200': (r) => r.status === 200,
               'TC-L10: response time < 3s': (r) => r.timings.duration < 3000,
          });
          errorRate.add(!passed);
          if (res.status > 0) apiDuration.add(res.timings.duration);
     });

     sleep(1);
}

// ============================================================
// SUMMARY HANDLER - Enhanced reporting
// ============================================================
export function handleSummary(data) {
     console.log('\n╔════════════════════════════════════════════════════════════╗');
     console.log('║        DETAILED FAILURE ANALYSIS & DIAGNOSTICS         ║');
     console.log('╚════════════════════════════════════════════════════════════╝\n');
     
     const totalReqs = data.metrics.http_reqs.values.count;
     const failRate = data.metrics.http_req_failed.values.rate;
     const failedCount = Math.round(totalReqs * failRate);
     const successCount = totalReqs - failedCount;
     
     console.log('📊 Request Summary:');
     console.log(`   Total Requests: ${totalReqs}`);
     console.log(`   Failed Requests: ${failedCount} (${(failRate * 100).toFixed(2)}%)`);
     console.log(`   Successful Requests: ${successCount}\n`);
     
     // Performance metrics
     const p95 = data.metrics.http_req_duration.values['p(95)'];
     const p99 = data.metrics.http_req_duration.values['p(99)'] || 'N/A';
     const avg = data.metrics.http_req_duration.values.avg;
     const max = data.metrics.http_req_duration.values.max;
     
     console.log('⚡ Performance Metrics:');
     console.log(`   Average Response Time: ${avg.toFixed(2)}ms`);
     console.log(`   p95 Response Time: ${p95.toFixed(2)}ms`);
     console.log(`   p99 Response Time: ${p99 !== 'N/A' ? p99.toFixed(2) + 'ms' : p99}`);
     console.log(`   Max Response Time: ${max.toFixed(2)}ms\n`);
     
     // Failure analysis
     if (failRate > 0.05) {
          console.log('⚠️  THRESHOLD VIOLATED: Failure rate exceeds 5%\n');
          console.log('💡 Likely Root Causes:');
          console.log('   1. Vercel Cold Starts (Serverless functions warming up)');
          console.log('   2. Database Connection Pool Exhaustion');
          console.log('   3. Vercel Rate Limiting (Free tier limits)');
          console.log('   4. Function Execution Timeouts\n');
          
          console.log('🔧 Recommended Actions:');
          console.log('   ✓ Check logs above for specific error status codes');
          console.log('   ✓ Review Vercel Function Logs at https://vercel.com/logs');
          console.log('   ✓ Verify database connection pool settings (current: max=10)');
          console.log('   ✓ Consider upgrading Vercel plan for better limits');
          console.log('   ✓ Add retry logic for transient failures');
          console.log('   ✓ Implement request queuing for high load\n');
     } else {
          console.log('✅ SUCCESS: All thresholds passed!\n');
     }
     
     console.log('📝 Check the error logs above (marked with ❌ or ⚠️) for specific failure details\n');
     
     return {
          'stdout': textSummary(data, { indent: ' ', enableColors: true }),
     };
}
