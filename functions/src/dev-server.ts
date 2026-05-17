import app from './server';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.BACKEND_PORT || 3001;

app.listen(PORT, () => {
    console.log(`\n🚀 Backend development server running at:`);
    console.log(`   - Local:   http://localhost:${PORT}`);
    console.log(`   - Health:  http://localhost:${PORT}/health\n`);
    console.log(`📡 Connecting to Firebase via Service Account...`);
});
