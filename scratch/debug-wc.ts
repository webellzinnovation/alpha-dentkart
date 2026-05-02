import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
console.log("Type:", typeof WooCommerceRestApi);
console.log("Keys:", Object.keys(WooCommerceRestApi || {}));
console.log("Default:", (WooCommerceRestApi as any).default ? typeof (WooCommerceRestApi as any).default : "undefined");
if ((WooCommerceRestApi as any).default) {
    console.log("Default Keys:", Object.keys((WooCommerceRestApi as any).default));
}
