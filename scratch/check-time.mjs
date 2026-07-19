import axios from 'axios';

async function check() {
  try {
    const res = await axios.get('https://www.google.com');
    const serverDateStr = res.headers.date;
    if (!serverDateStr) {
      console.log("Could not find Date header in response headers:", res.headers);
      return;
    }
    const serverTime = new Date(serverDateStr).getTime();
    const localTime = Date.now();
    console.log("Local time (System):", new Date(localTime).toISOString());
    console.log("Google Server time:", new Date(serverTime).toISOString());
    console.log("Clock Skew (seconds):", (localTime - serverTime) / 1000);
  } catch (err) {
    console.error("Error fetching date:", err.message);
  }
}

check();
