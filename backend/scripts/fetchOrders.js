/**
 * Fetch all WooCommerce orders and save to JSON
 */
const fs = require('fs');
const https = require('https');

const API_URL = 'https://alphadentkart.com/wp-json/wc/v3/orders';
const PARAMS = 'per_page=100&consumer_key=ck_b41b9f56dc6245691a0d563b4e40a92e81f7b031&consumer_secret=cs_49ea401b7c76be3bd64c4edf0a2f73afe5ca08b1';

function fetchOrders(page) {
    return new Promise((resolve, reject) => {
        const url = `${API_URL}?${PARAMS}&page=${page}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('Fetching orders from WooCommerce...');
    
    const allOrders = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
        console.log(`Fetching page ${page}...`);
        try {
            const orders = await fetchOrders(page);
            if (orders.length === 0) {
                hasMore = false;
            } else {
                allOrders.push(...orders);
                console.log(`  Got ${orders.length} orders`);
                page++;
                if (orders.length < 100) hasMore = false;
            }
        } catch (e) {
            console.error('Error:', e.message);
            hasMore = false;
        }
    }
    
    console.log(`\nTotal orders fetched: ${allOrders.length}`);
    
    // Save to file
    const dir = __dirname;
    const filePath = `${dir}/migration/wordpress_orders.json`;
    fs.mkdirSync(`${dir}/migration`, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(allOrders));
    console.log(`Saved to: ${filePath}`);
}

main().catch(console.error);
