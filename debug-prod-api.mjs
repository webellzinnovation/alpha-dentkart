import fetch from 'node-fetch';

async function debugProductionApi() {
  console.log('--- Debugging Production API ---');
  const baseUrl = 'https://alphadentkart-001.web.app/api/v1';
  let sessionCookie = '';

  // 1. Login to get cookie
  try {
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@alphadentkart.com', password: 'admin' })
    });
    
    const cookies = loginRes.headers.raw()['set-cookie'] || [];
    sessionCookie = cookies.find(c => c.startsWith('__session='))?.split(';')[0];
    
    if (!sessionCookie) {
      console.log('Login failed or no cookie returned. Status:', loginRes.status);
      console.log('Body:', await loginRes.text());
      return;
    }
    console.log('✅ Logged in successfully. Cookie:', sessionCookie);
  } catch (e) {
    console.error('Login error:', e);
    return;
  }

  // 2. Test Order Update
  try {
    console.log('Attempting to update order wp-38429...');
    const updateRes = await fetch(`${baseUrl}/orders/wp-38429/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({ status: 'Delivered' })
    });

    console.log(`Response Status: ${updateRes.status} ${updateRes.statusText}`);
    const data = await updateRes.text();
    console.log(`Response Body:`, data);
  } catch (e) {
    console.error('Update error:', e);
  }
}

debugProductionApi();
