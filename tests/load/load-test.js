import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration', true);

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

const BASE_URL = 'https://work-sure-backend.vercel.app/api';

// Helper: common headers
const headers = {
     'Content-Type': 'application/json',
};

// ============================================================
// TEST SCENARIOS
// ============================================================

export default function () {
     // -------------------------------------------------------
     // TC-L01: GET Categories (Public browsing)
     // -------------------------------------------------------
     group('TC-L01: Get All Categories', () => {
          const res = http.get(`${BASE_URL}/categoryRoutes/categories`, { headers });
          const passed = check(res, {
               'TC-L01: status is 200': (r) => r.status === 200,
               'TC-L01: response time < 2s': (r) => r.timings.duration < 2000,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L02: GET Users list
     // -------------------------------------------------------
     group('TC-L02: Get Users', () => {
          const res = http.get(`${BASE_URL}/userRoutes/users`, { headers });
          const passed = check(res, {
               'TC-L02: status is 200': (r) => r.status === 200,
               'TC-L02: response time < 2s': (r) => r.timings.duration < 2000,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L03: GET Workers list
     // -------------------------------------------------------
     group('TC-L03: Get Workers', () => {
          const res = http.get(`${BASE_URL}/workerRoutes/workers`, { headers });
          const passed = check(res, {
               'TC-L03: status is 200': (r) => r.status === 200,
               'TC-L03: response time < 2s': (r) => r.timings.duration < 2000,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L04: Check Email Exists (Signup flow)
     // -------------------------------------------------------
     group('TC-L04: Check Email Exists', () => {
          const testEmail = `testuser_${__VU}_${__ITER}@example.com`;
          const res = http.get(`${BASE_URL}/userRoutes/checkEmail/${testEmail}`, { headers });
          const passed = check(res, {
               'TC-L04: server responds': (r) => r.status >= 200 && r.status < 500,
               'TC-L04: response time < 2s': (r) => r.timings.duration < 2000,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L05: Search Workers
     // -------------------------------------------------------
     group('TC-L05: Search Workers', () => {
          const res = http.get(`${BASE_URL}/workerRoutes/workers/search?query=plumber`, { headers });
          const passed = check(res, {
               'TC-L05: server responds': (r) => r.status >= 200 && r.status < 500,
               'TC-L05: response time < 2s': (r) => r.timings.duration < 2000,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L06: GET Sections
     // -------------------------------------------------------
     group('TC-L06: Get All Sections', () => {
          const res = http.get(`${BASE_URL}/categoryRoutes/sections`, { headers });
          const passed = check(res, {
               'TC-L06: status is 200': (r) => r.status === 200,
               'TC-L06: response time < 2s': (r) => r.timings.duration < 2000,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L07: GET Orders list
     // -------------------------------------------------------
     group('TC-L07: Get Orders', () => {
          const res = http.get(`${BASE_URL}/orderRoutes/orders`, { headers });
          const passed = check(res, {
               'TC-L07: server responds': (r) => r.status >= 200 && r.status < 500,
               'TC-L07: response time < 3s': (r) => r.timings.duration < 3000,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L08: GET All Complaints
     // -------------------------------------------------------
     group('TC-L08: Get All Complaints', () => {
          const res = http.get(`${BASE_URL}/complaints/getAllcomplaints`, { headers });
          const passed = check(res, {
               'TC-L08: status is 200': (r) => r.status === 200,
               'TC-L08: response time < 2s': (r) => r.timings.duration < 2000,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L09: Admin Dashboard Summary
     // -------------------------------------------------------
     group('TC-L09: Admin Dashboard Summary', () => {
          const res = http.get(`${BASE_URL}/admin/dashboard/summary`, { headers });
          const passed = check(res, {
               'TC-L09: status is 200': (r) => r.status === 200,
               'TC-L09: response time < 3s': (r) => r.timings.duration < 3000,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(1);

     // -------------------------------------------------------
     // TC-L10: Admin Get All Bookings
     // -------------------------------------------------------
     group('TC-L10: Admin Get All Bookings', () => {
          const res = http.get(`${BASE_URL}/admin/bookings?page=1&limit=10`, { headers });
          const passed = check(res, {
               'TC-L10: status is 200': (r) => r.status === 200,
               'TC-L10: response time < 3s': (r) => r.timings.duration < 3000,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(1);
}
