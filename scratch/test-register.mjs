import axios from 'axios';

async function testRegister() {
    try {
        console.log("1. Fetching CSRF token...");
        const csrfRes = await axios.get('http://localhost:3001/api/v1/csrf-token');
        const cookie = csrfRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ');
        const csrfToken = cookie?.split('; ')
            .find(row => row.startsWith('csrf-token='))
            ?.split('=')[1];
            
        console.log("   CSRF Token extracted:", csrfToken);
        console.log("   Cookies:", cookie);

        console.log("2. Sending registration request with CSRF token...");
        const response = await axios.post('http://localhost:3001/api/v1/auth/register', {
            name: "Test User",
            email: `test_user_${Date.now()}@alpha.com`,
            password: "Password123!",
            userType: "regular"
        }, {
            headers: {
                'x-csrf-token': csrfToken,
                'Cookie': cookie
            }
        });
        console.log("✅ Success! Response:", response.data);
    } catch (err) {
        console.error("❌ Error response status:", err.response?.status);
        console.error("❌ Error response data:", JSON.stringify(err.response?.data, null, 2));
        console.error("❌ Full error message:", err.message);
    }
}

testRegister();
