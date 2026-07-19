import { Storage } from '@google-cloud/storage';

try {
  const storage = new Storage({ keyFilename: 'firebase-service-account.json' });
  const [buckets] = await storage.getBuckets();
  console.log("Buckets found:");
  buckets.forEach(b => console.log("- " + b.name));
  process.exit(0);
} catch (err) {
  console.error("Error listing buckets:", err.message);
  process.exit(1);
}
