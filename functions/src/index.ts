import { onRequest } from "firebase-functions/v2/https";
import app from "./server";

export const api = onRequest(
    { 
        region: "asia-south1", 
        timeoutSeconds: 540, 
        memory: "1GiB",
        invoker: "public"
    }, 
    app
);
