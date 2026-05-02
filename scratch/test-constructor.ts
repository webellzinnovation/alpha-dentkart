import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
const WC = WooCommerceRestApi as any;
try {
    console.log("Trying new WC()...");
    const api = new WC({
        url: "https://example.com",
        consumerKey: "ck_123",
        consumerSecret: "cs_123"
    });
    console.log("Success with new WC()");
} catch (e: any) {
    console.log("Failed with new WC():", e.message);
}

try {
    console.log("Trying new WC.default()...");
    const api = new WC.default({
        url: "https://example.com",
        consumerKey: "ck_123",
        consumerSecret: "cs_123"
    });
    console.log("Success with new WC.default()");
} catch (e: any) {
    console.log("Failed with new WC.default():", e.message);
}
