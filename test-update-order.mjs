import fetch from 'node-fetch'; // Requires node-fetch or Node v18+

async function testUpdateOrder() {
  const adminEmail = 'admin@alphadentkart.com';
  const adminPassword = 'admin'; // Testing password from earlier logs, or auth token if needed
  const baseUrl = 'https://alphadentkart-001.web.app/api/v1'; // Production
  // const baseUrl = 'http://localhost:3005/api/v1'; // Dev

  console.log('Testing against:', baseUrl);

  try {
    // 1. Login as Admin to get Cookie
    console.log('Logging in...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    
    // Extract the __session cookie
    const cookies = loginRes.headers.raw()['set-cookie'] || [];
    const sessionCookie = cookies.find(c => c.startsWith('__session='))?.split(';')[0];
    
    if (!sessionCookie) {
      console.log('No __session cookie found in response headers:', loginRes.headers.raw());
      return;
    }
    console.log('Logged in successfully. Cookie:', sessionCookie);

    // 2. Update Order Status
    const orderId = 'wp-38429';
    console.log(`Updating order ${orderId}...`);
    const patchRes = await fetch(`${baseUrl}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({ status: 'Delivered' })
    });

    const data = await patchRes.text();
    console.log(`Update Response [${patchRes.status}]:`, data);

  } catch (err) {
    console.error('Test failed:', err);
  }
}

testUpdateOrder();
