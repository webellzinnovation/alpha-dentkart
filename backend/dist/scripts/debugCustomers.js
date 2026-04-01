"use strict";
/**
 * Debug: Check WooCommerce customer billing data
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const woocommerce_rest_api_1 = __importDefault(require("@woocommerce/woocommerce-rest-api"));
const WP_URL = process.env.WP_URL || "https://alphadentkart.com";
const WP_CONSUMER_KEY = process.env.WP_CONSUMER_KEY || "ck_b41b9f56dc6245691a0d563b4e40a92e81f7b031";
const WP_CONSUMER_SECRET = process.env.WP_CONSUMER_SECRET || "cs_49ea401b7c76be3bd64c4edf0a2f73afe5ca08b1";
const api = new woocommerce_rest_api_1.default.default({
    url: WP_URL,
    consumerKey: WP_CONSUMER_KEY,
    consumerSecret: WP_CONSUMER_SECRET,
    version: "wc/v3",
});
async function checkCustomers() {
    const { data } = await api.get("customers", { per_page: 10 });
    console.log("Sample customers:\n");
    data.forEach((c) => {
        console.log(`Email: ${c.email}`);
        console.log(`  Billing Company: "${c.billing?.company || ''}"`);
        console.log(`  Billing Name: ${c.billing?.first_name} ${c.billing?.last_name}`);
        console.log();
    });
}
checkCustomers().catch(e => console.error(e));
//# sourceMappingURL=debugCustomers.js.map