/**
 * Debug: Find matching emails between orders and Firebase Auth
 */
const { db, auth } = require('../dist/config/firebase');

async function checkMatching() {
    // Get all order emails
    const ordersSnapshot = await db.collection('orders').get();
    const orderEmails = new Set();
    ordersSnapshot.forEach((doc) => {
        const data = doc.data();
        const email = data.customerEmail;
        if (email) orderEmails.add(String(email).toLowerCase());
    });
    console.log('Total unique order emails:', orderEmails.size);

    // Get all Firebase Auth users
    const authEmails = new Map();
    let pageToken = undefined;
    do {
        const result = await auth.listUsers(100, pageToken);
        result.users.forEach((user) => {
            if (user.email) {
                authEmails.set(user.email.toLowerCase(), user.uid);
            }
        });
        pageToken = result.pageToken;
    } while (pageToken);
    console.log('Total Firebase Auth users:', authEmails.size);

    // Find matches
    let matchCount = 0;
    const matches = [];
    orderEmails.forEach((email) => {
        if (authEmails.has(email)) {
            matchCount++;
            matches.push(email);
        }
    });

    console.log('\nMatching emails:', matchCount);
    if (matchCount > 0) {
        console.log('\nMatched emails:');
        matches.slice(0, 20).forEach(email => {
            console.log('  -', email);
        });
    }
    
    // Show sample of non-matching order emails
    console.log('\nSample of order emails not in Firebase Auth (first 10):');
    let count = 0;
    orderEmails.forEach((email) => {
        if (count < 10 && !authEmails.has(email)) {
            console.log('  -', email);
            count++;
        }
    });
}

checkMatching().catch(console.error);
