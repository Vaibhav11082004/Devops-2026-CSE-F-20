process.env.NODE_ENV = 'test';

import assert from 'assert';
import { httpServer } from '../server.js';
import { initDatabase } from '../db/database.js';

const PORT = 5099;

async function runTests() {
  console.log('🧪 Starting SentinelAI Automated Test Suite...');

  // Ensure DB is initialized
  await initDatabase();

  // Start temporary test server
  await new Promise<void>((resolve) => {
    httpServer.listen(PORT, () => {
      console.log(`[Test Server] Running on http://localhost:${PORT}`);
      resolve();
    });
  });

  const BASE_URL = `http://localhost:${PORT}`;

  try {
    // 1. Health check endpoint test
    console.log('➡️ Testing GET /api/v1/health ...');
    const healthRes = await fetch(`${BASE_URL}/api/v1/health`);
    assert.strictEqual(healthRes.status, 200, 'Health endpoint should return 200');
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'online', 'Health status should be online');
    console.log('✅ Health check passed.');

    // 2. Prometheus metrics endpoint test
    console.log('➡️ Testing GET /metrics ...');
    const metricsRes = await fetch(`${BASE_URL}/metrics`);
    assert.strictEqual(metricsRes.status, 200, 'Metrics endpoint should return 200');
    const metricsText = await metricsRes.text();
    assert.ok(metricsText.includes('sentinel_http_requests_total'), 'Should contain sentinel_http_requests_total metric');
    assert.ok(metricsText.includes('sentinel_active_incidents'), 'Should contain sentinel_active_incidents metric');
    console.log('✅ Prometheus /metrics endpoint passed.');

    // 3. User Authentication test
    console.log('➡️ Testing POST /api/v1/auth/login ...');
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex.rivera@sentinel.ai',
        password: 'password123',
      }),
    });
    assert.strictEqual(loginRes.status, 200, 'Login should succeed with 200');
    const loginData = await loginRes.json();
    assert.ok(loginData.token, 'Response should contain valid JWT token');
    assert.strictEqual(loginData.user.email, 'alex.rivera@sentinel.ai', 'User email should match');
    console.log('✅ Authentication & JWT generation passed.');

    // 4. Protected Security telemetry stats test
    console.log('➡️ Testing GET /api/v1/security/stats (Protected) ...');
    const statsRes = await fetch(`${BASE_URL}/api/v1/security/stats`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    assert.strictEqual(statsRes.status, 200, 'Stats endpoint should return 200 with Bearer token');
    const statsData = await statsRes.json();
    assert.ok(statsData.data.threatsBlocked > 0, 'Threats blocked count should be positive');
    console.log('✅ Protected security telemetry stats passed.');

    console.log('\n🎉 ALL SENTINEL AI AUTOMATED TESTS PASSED SUCCESSFULLY (4/4)!');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    httpServer.close();
    process.exit(0);
  }
}

runTests();
