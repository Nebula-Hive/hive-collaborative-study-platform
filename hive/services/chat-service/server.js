const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');
const Message = require('./src/models/messageModal');
const messageRoutes = require('./src/routes/messageRoutes');

dotenv.config();
const PORT = process.env.PORT || 3003;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/hive');

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => res.json({ status: 'ok', service: 'chat-service' }));
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'chat-service' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
const usersInRoom = {};

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('joinGroup', ({ room, username }) => {
    socket.join(room);
    if (!usersInRoom[room]) usersInRoom[room] = [];
    usersInRoom[room].push(username);
    io.to(room).emit('notification', `${username} joined the group`);
  });

  socket.on('sendMessage', async ({ room, username, message }) => {
    const msgData = { room, username, message, time: new Date() };
    try { await Message.create(msgData); } catch (err) { console.error(err); }
    io.to(room).emit('receiveMessage', msgData);
  });

  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

server.listen(PORT, () => console.log(`chat-service listening on ${PORT}`));