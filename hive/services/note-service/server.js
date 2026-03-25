const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const noteRoutes = require('./src/routes/noteRoutes');

dotenv.config();
const PORT = process.env.PORT || 3004;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/hive');

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use("/api/notes", noteRoutes);
app.get('/', (req, res) => res.json({ status: 'ok', service: 'note-service' }));
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'note-service' }));

app.listen(PORT, () => {
  console.log('note-service listening on port', PORT);
});
