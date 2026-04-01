import { db } from './src/config/firebase';

async function testFirebase() {
    try {
        console.log('Testing Firestore connection...');
        const snapshot = await db.collection('brands').limit(1).get();
        console.log('Success! Found', snapshot.docs.length, 'brands');
    } catch (e) {
        console.error('Firestore Error:', e);
    }
}

testFirebase();
