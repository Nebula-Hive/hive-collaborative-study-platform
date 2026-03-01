const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const admin = require('./src/config/firebaseConfig');

dotenv.config();
const PORT = process.env.PORT || 3000;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/hive');

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'auth-service' }));

app.use('/auth', authRoutes);

app.listen(PORT, () => {
  console.log('auth-service listening on port', PORT);
});
