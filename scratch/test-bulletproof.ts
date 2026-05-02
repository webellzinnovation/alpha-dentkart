import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
const WC = (WooCommerceRestApi as any).default || WooCommerceRestApi;
console.log("WC Type:", typeof WC);
try {
    const api = new (WC as any)({
        url: "https://example.com",
        consumerKey: "ck_123",
        consumerSecret: "cs_123"
    });
    console.log("Success with bulletproof pattern!");
} catch (e: any) {
    console.log("Failed with bulletproof pattern:", e.message);
}
