const axios = require('axios');

async function setupAdmin() {
  const api = axios.create({
    baseURL: 'http://localhost:3001/api/v1',
    withCredentials: true,
  });

  try {
    console.log('1. Attempting Login...');
    const loginRes = await api.post('/auth/login', {
      email: 'admin@alphadentkart.com',
      password: 'admin123'
    });
    console.log('✅ Login successful:', loginRes.data.user.email);
    testData(loginRes.headers['set-cookie']);
    
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.log('Admin not found or invalid. Attempting to Register Admin...');
      try {
        const registerRes = await api.post('/auth/register', {
          email: 'admin@alphadentkart.com',
          password: 'admin123',
          name: 'Super Admin',
          phone: '1234567890',
          adminKey: 'admin2024'
        });
        console.log('✅ Registration successful:', registerRes.data.user.email);
        testData(registerRes.headers['set-cookie']);
      } catch (regErr) {
        console.error('Registration failed:', regErr.response?.data || regErr.message);
      }
    } else {
      console.error('API Error:', err.response?.status, err.response?.data || err.message);
    }
  }

  async function testData(cookies) {
    if (!cookies) {
        console.error('❌ No cookies returned!');
        return;
    }
    
    console.log('2. Requesting /auth/me with cookie...');
    try {
        const meRes = await api.get('/auth/me', { headers: { Cookie: cookies[0] } });
        console.log('✅ Me successful:', meRes.data.user.email);
        
        console.log('3. Requesting /orders/all...');
        const ordersRes = await api.get('/orders/all?limit=5', { headers: { Cookie: cookies[0] } });
        console.log('✅ Orders retrieved:', ordersRes.data.orders.length);
    } catch (e) {
        console.error('❌ Endpoint failed:', e.response?.status, e.response?.data || e.message);
    }
  }
}

setupAdmin();
