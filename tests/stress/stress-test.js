import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration', true);

// ============================================================
// STRESS TEST CONFIGURATION
// Pushes the system beyond normal load to find breaking points
// ============================================================
export const options = {
     stages: [
          { duration: '30s', target: 20 },    // Warm up: ramp to 20 users
          { duration: '30s', target: 50 },    // Normal load
          { duration: '30s', target: 100 },   // Push to 100 users
          { duration: '30s', target: 200 },   // High stress: 200 users
          { duration: '1m', target: 300 },    // Extreme stress: 300 users
          { duration: '30s', target: 400 },   // Breaking point: 400 users
          { duration: '1m', target: 400 },    // Sustain breaking point
          { duration: '30s', target: 0 },     // Recovery: ramp down
     ],
     thresholds: {
          http_req_duration: ['p(95)<5000'],   // 95% of requests < 5s (more lenient)
          http_req_failed: ['rate<0.30'],      // Allow up to 30% failures (we expect failures)
     },
};

const BASE_URL = 'https://work-sure-backend.vercel.app/api';

const headers = {
     'Content-Type': 'application/json',
};

// ============================================================
// TEST SCENARIOS
// ============================================================

export default function () {
     // -------------------------------------------------------
     // TC-S01: GET Categories under stress
     // -------------------------------------------------------
     group('TC-S01: Get All Categories (Stress)', () => {
          const res = http.get(`${BASE_URL}/categoryRoutes/categories`, { headers });
          const passed = check(res, {
               'TC-S01: status is 200': (r) => r.status === 200,
               'TC-S01: response time < 5s': (r) => r.timings.duration < 5000,
               'TC-S01: no server error': (r) => r.status !== 500,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(0.5);

     // -------------------------------------------------------
     // TC-S02: GET Users list under stress
     // -------------------------------------------------------
     group('TC-S02: Get Users (Stress)', () => {
          const res = http.get(`${BASE_URL}/userRoutes/users`, { headers });
          const passed = check(res, {
               'TC-S02: status is 200': (r) => r.status === 200,
               'TC-S02: response time < 5s': (r) => r.timings.duration < 5000,
               'TC-S02: no server error': (r) => r.status !== 500,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(0.5);

     // -------------------------------------------------------
     // TC-S03: GET Workers under stress
     // -------------------------------------------------------
     group('TC-S03: Get Workers (Stress)', () => {
          const res = http.get(`${BASE_URL}/workerRoutes/workers`, { headers });
          const passed = check(res, {
               'TC-S03: status is 200': (r) => r.status === 200,
               'TC-S03: response time < 5s': (r) => r.timings.duration < 5000,
               'TC-S03: no server error': (r) => r.status !== 500,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(0.5);

     // -------------------------------------------------------
     // TC-S04: Check Email - rapid concurrent checks
     // -------------------------------------------------------
     group('TC-S04: Check Email Exists (Stress)', () => {
          const testEmail = `stressuser_${__VU}_${__ITER}@test.com`;
          const res = http.get(`${BASE_URL}/userRoutes/checkEmail/${testEmail}`, { headers });
          const passed = check(res, {
               'TC-S04: server responds': (r) => r.status >= 200 && r.status < 500,
               'TC-S04: response time < 5s': (r) => r.timings.duration < 5000,
               'TC-S04: no server error': (r) => r.status !== 500,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(0.5);

     // -------------------------------------------------------
     // TC-S05: Search Workers under heavy load
     // -------------------------------------------------------
     group('TC-S05: Search Workers (Stress)', () => {
          const searchTerms = ['plumber', 'electrician', 'cleaner', 'painter', 'carpenter'];
          const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
          const res = http.get(`${BASE_URL}/workerRoutes/workers/search?query=${term}`, { headers });
          const passed = check(res, {
               'TC-S05: server responds': (r) => r.status >= 200 && r.status < 500,
               'TC-S05: response time < 5s': (r) => r.timings.duration < 5000,
               'TC-S05: no server error': (r) => r.status !== 500,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(0.5);

     // -------------------------------------------------------
     // TC-S06: GET Sections under stress
     // -------------------------------------------------------
     group('TC-S06: Get All Sections (Stress)', () => {
          const res = http.get(`${BASE_URL}/categoryRoutes/sections`, { headers });
          const passed = check(res, {
               'TC-S06: status is 200': (r) => r.status === 200,
               'TC-S06: response time < 5s': (r) => r.timings.duration < 5000,
               'TC-S06: no server error': (r) => r.status !== 500,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(0.5);

     // -------------------------------------------------------
     // TC-S07: GET Orders under stress
     // -------------------------------------------------------
     group('TC-S07: Get Orders (Stress)', () => {
          const res = http.get(`${BASE_URL}/orderRoutes/orders`, { headers });
          const passed = check(res, {
               'TC-S07: responds without crash': (r) => r.status !== 0,
               'TC-S07: response time < 5s': (r) => r.timings.duration < 5000,
               'TC-S07: no server error': (r) => r.status !== 500,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(0.5);

     // -------------------------------------------------------
     // TC-S08: GET Complaints under stress
     // -------------------------------------------------------
     group('TC-S08: Get All Complaints (Stress)', () => {
          const res = http.get(`${BASE_URL}/complaints/getAllcomplaints`, { headers });
          const passed = check(res, {
               'TC-S08: responds without crash': (r) => r.status !== 0,
               'TC-S08: response time < 5s': (r) => r.timings.duration < 5000,
               'TC-S08: no server error': (r) => r.status !== 500,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(0.5);

     // -------------------------------------------------------
     // TC-S09: Admin Dashboard Summary under stress
     // -------------------------------------------------------
     group('TC-S09: Admin Dashboard Summary (Stress)', () => {
          const res = http.get(`${BASE_URL}/admin/dashboard/summary`, { headers });
          const passed = check(res, {
               'TC-S09: responds without crash': (r) => r.status !== 0,
               'TC-S09: response time < 5s': (r) => r.timings.duration < 5000,
               'TC-S09: no server error': (r) => r.status !== 500,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(0.5);

     // -------------------------------------------------------
     // TC-S10: Admin Bookings under stress
     // -------------------------------------------------------
     group('TC-S10: Admin Get All Bookings (Stress)', () => {
          const res = http.get(`${BASE_URL}/admin/bookings?page=1&limit=10`, { headers });
          const passed = check(res, {
               'TC-S10: responds without crash': (r) => r.status !== 0,
               'TC-S10: response time < 5s': (r) => r.timings.duration < 5000,
               'TC-S10: no server error': (r) => r.status !== 500,
          });
          errorRate.add(!passed);
          apiDuration.add(res.timings.duration);
     });

     sleep(0.5);
}
