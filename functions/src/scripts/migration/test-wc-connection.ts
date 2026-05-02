import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const WC = (WooCommerceRestApi as any).default || WooCommerceRestApi;

const api = new (WC as any)({
  url: 'https://alphadentkart.com',
  consumerKey: process.env.WP_CONSUMER_KEY,
  consumerSecret: process.env.WP_CONSUMER_SECRET,
  version: 'wc/v3'
});

async function testConnection() {
  try {
    console.log('Testing connection to WooCommerce...');
    console.log('URL:', 'https://alphadentkart.com');
    console.log('Key:', process.env.WP_CONSUMER_KEY?.substring(0, 5) + '...');
    
    const response = await api.get('products', { per_page: 1 });
    console.log('Success! Found', response.headers['x-wp-total'], 'products.');
  } catch (error: any) {
    console.error('Connection failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testConnection();
