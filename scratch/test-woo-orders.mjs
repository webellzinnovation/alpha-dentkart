import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const WP_URL = "https://alphadentkart.com";
const WP_CONSUMER_KEY = process.env.WP_CONSUMER_KEY || 'ck_b41b9f56dc6245691a0d563b4e40a92e81f7b031';
const WP_CONSUMER_SECRET = process.env.WP_CONSUMER_SECRET || 'cs_49ea401b7c76be3bd64c4edf0a2f73afe5ca08b1';

const WC = WooCommerceRestApi.default || WooCommerceRestApi;
const api = new WC({
    url: WP_URL,
    consumerKey: WP_CONSUMER_KEY,
    consumerSecret: WP_CONSUMER_SECRET,
    version: "wc/v3",
    queryStringAuth: true,
    axiosConfig: { timeout: 60000 }
});

async function run() {
    try {
        console.log('Testing WooCommerce connection to:', WP_URL);
        console.log('Using Key:', WP_CONSUMER_KEY.substring(0, 10) + '...');
        
        // Fetch 5 latest orders
        const response = await api.get('orders', { per_page: 5, page: 1 });
        console.log('Successfully fetched orders! Status:', response.status);
        console.log('Total orders in header x-wp-total:', response.headers['x-wp-total']);
        console.log('Number of orders returned:', response.data?.length);
        
        if (response.data && response.data.length > 0) {
            console.log('Sample Order ID:', response.data[0].id);
            console.log('Sample Order Date Created:', response.data[0].date_created);
            console.log('Sample Order Number:', response.data[0].number);
            console.log('Sample Order Status:', response.data[0].status);
            console.log('Sample Order Line Items count:', response.data[0].line_items?.length);
        }
    } catch (e) {
        console.error('WooCommerce API Error:', e.response?.data || e.message || e);
    }
}

run();
