import axios from 'axios';

const siteUrl = 'https://alphadentkart.com';
const consumerKey = 'ck_b41b9f56dc6245691a0d563b4e40a92e81f7b031';
const consumerSecret = 'cs_49ea401b7c76be3bd64c4edf0a2f73afe5ca08b1';

async function test() {
    try {
        console.log('Testing connection to WooCommerce...');
        const url = `${siteUrl}/wp-json/wc/v3/products`;
        
        console.log(`Sending GET request to ${url}...`);
        const response = await axios.get(url, {
            params: {
                per_page: 5,
                page: 1
            },
            auth: {
                username: consumerKey,
                password: consumerSecret
            },
            timeout: 15000
        });

        console.log('Status Code:', response.status);
        console.log('Total Products on WP:', response.headers['x-wp-total']);
        console.log('Total Pages on WP:', response.headers['x-wp-totalpages']);
        console.log('Sample Products fetched:');
        response.data.forEach(p => {
            console.log(`- ID: ${p.id}, Name: ${p.name}, Price: ${p.price}, Stock: ${p.stock_quantity}, Date Mod: ${p.date_modified}`);
        });

    } catch (err) {
        console.error('WooCommerce API Request failed:');
        if (err.response) {
            console.error('  Response status:', err.response.status);
            console.error('  Response headers:', err.response.headers);
            console.error('  Response data:', err.response.data);
        } else {
            console.error('  Error message:', err.message);
        }
    }
}

test();
