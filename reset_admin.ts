import { admin, db } from './backend/src/config/firebase';
import bcrypt from 'bcrypt';

async function resetAdminPassword() {
  console.log('Resetting admin password...');
  try {
    const email = 'admin@alphadentkart.com';
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      console.log('Admin user not found. Run registration first.');
      process.exit(1);
    }

    const doc = snapshot.docs[0];
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await usersRef.doc(doc.id).update({
      password: hashedPassword,
      role: 'admin',
      isVerified: true
    });

    console.log(`✅ Password successfully reset to ${newPassword} for ${email}`);
  } catch (err) {
    console.error('Error resetting password:', err);
  } finally {
    process.exit(0);
  }
}

resetAdminPassword();
