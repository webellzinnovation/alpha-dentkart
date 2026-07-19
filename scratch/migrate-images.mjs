import admin from 'firebase-admin';
import fs from 'fs';
import axios from 'axios';
import path from 'path';

// Load service account
const serviceAccount = JSON.parse(fs.readFileSync('firebase-service-account.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'alphadentkart-001.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function migrate() {
  console.log("🚀 Starting Product Image Migration to Firebase Storage...");
  
  // Fetch all products
  const snapshot = await db.collection('products').get();
  console.log(`📦 Found ${snapshot.size} products to scan.`);
  
  let migratedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const productId = doc.id;
    const productName = data.name;
    
    let needsUpdate = false;
    let mainImage = data.image;
    let images = data.images || [];

    // Helper function to download and upload image
    const migrateImageUrl = async (url) => {
      if (!url) return null;
      
      // If already migrated, skip
      if (url.includes('firebasestorage.googleapis.com')) {
        return url;
      }
      
      // Check if it's a WordPress url
      if (!url.includes('alphadentkart.com/wp-content')) {
        return url; // Skip external / other images
      }
      
      console.log(`  Downloading: ${url}`);
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
        const buffer = Buffer.from(response.data);
        
        // Determine original extension
        const urlPath = new URL(url).pathname;
        
        // Define path in Firebase Storage
        const fileName = `products/${productId}/${path.basename(urlPath)}`;
        const file = bucket.file(fileName);
        
        // Upload file
        await file.save(buffer, {
          metadata: {
            contentType: response.headers['content-type'] || 'image/webp',
            cacheControl: 'public, max-age=31536000'
          }
        });
        
        // Make public (safely catching uniform access errors)
        try {
          await file.makePublic();
        } catch (aclError) {
          // If uniform access is enabled, it requires public access read rules in Storage settings
          console.warn("  ⚠️ Warning: Could not set ACL to public (uniform bucket access might be enabled).");
        }
        
        // Generate public URL
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;
        console.log(`  Uploaded: ${publicUrl}`);
        migratedCount++;
        return publicUrl;
      } catch (err) {
        console.error(`  ❌ Failed to migrate image ${url}: ${err.message}`);
        return null; 
      }
    };

    console.log(`\n📝 Processing Product: "${productName}" (${productId})`);

    // Migrate main image
    if (mainImage && mainImage.includes('alphadentkart.com/wp-content')) {
      const newMainImage = await migrateImageUrl(mainImage);
      if (newMainImage) {
        mainImage = newMainImage;
        needsUpdate = true;
      }
    }

    // Migrate secondary images
    const newImages = [];
    for (const imgUrl of images) {
      if (imgUrl && imgUrl.includes('alphadentkart.com/wp-content')) {
        const newImg = await migrateImageUrl(imgUrl);
        if (newImg) {
          newImages.push(newImg);
          needsUpdate = true;
        } else {
          newImages.push(imgUrl); 
        }
      } else {
        newImages.push(imgUrl); 
      }
    }
    
    if (needsUpdate) {
      await db.collection('products').doc(productId).update({
        image: mainImage,
        images: newImages
      });
      console.log(`✅ Updated Firestore product "${productName}" with new Storage URLs.`);
    } else {
      console.log(`⏭️ No images needed migration for "${productName}".`);
    }
  }

  console.log(`\n🎉 Image migration complete! Migrated ${migratedCount} images.`);
}

migrate().catch(console.error);
