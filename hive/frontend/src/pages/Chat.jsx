// src/pages/Chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SERVER_URL = 'http://localhost:3003';

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState('general');
  const [username, setUsername] = useState(`user${Math.floor(Math.random() * 1000)}`);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);

  const messagesEndRef = useRef(null);

  // auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // socket connection
  useEffect(() => {
    const newSocket = io(SERVER_URL);

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected');
    });

    newSocket.on('notification', (msg) => {
      setMessages(prev => [...prev, { username: 'System', message: msg, time: new Date() }]);
    });

    newSocket.on('receiveMessage', (data) => {
      setMessages(prev => [...prev, { ...data, time: new Date(data.time) }]);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      setJoined(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinRoom = () => {
    if (!socket || !room.trim() || !username.trim()) return;

    socket.emit('joinGroup', {
      room: room.trim(),
      username: username.trim()
    });

    setJoined(true);
    fetchHistory();
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!socket || !message.trim() || !joined) return;

    socket.emit('sendMessage', {
      room: room.trim(),
      username: username.trim(),
      message: message.trim()
    });

    setMessage('');
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/messages/${encodeURIComponent(room.trim())}`);
      if (!res.ok) throw new Error();
      const history = await res.json();
      setMessages(history.map(m => ({
        username: m.username,
        message: m.message,
        time: new Date(m.time)
      })));
    } catch (err) {
      console.log('History failed');
    }
  };

  return (
    <div style={{
      maxWidth: '700px',
      margin: '20px auto',
      fontFamily: 'system-ui, sans-serif',
      padding: '0 16px'
    }}>

      <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>
        Simple Group Chat
      </h2>

      {!joined ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <input
            type="text"
            placeholder="Room name"
            value={room}
            onChange={e => setRoom(e.target.value)}
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />

          <input
            type="text"
            placeholder="Your name"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />

          <button
            onClick={joinRoom}
            disabled={!room.trim() || !username.trim()}
            style={{
              padding: '12px',
              fontSize: '16px',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Join
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            color: '#555'
          }}>
            <div>
              Room: <strong>{room}</strong> • You: <strong>{username}</strong>
            </div>
            <button
              onClick={() => socket?.disconnect()}
              style={{
                padding: '6px 12px',
                backgroundColor: '#cc0000',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Leave
            </button>
          </div>

          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            height: '400px',
            overflowY: 'auto',
            padding: '16px',
            backgroundColor: '#fafafa'
          }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: '12px',
                  textAlign: msg.username === username ? 'right' : 'left'
                }}
              >
                <strong style={{
                  color: msg.username === 'System' ? '#888' :
                         msg.username === username ? '#0066cc' : '#333'
                }}>
                  {msg.username}:
                </strong>{' '}
                {msg.message}
                <small style={{ color: '#999', marginLeft: '8px' }}>
                  {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <button
              type="submit"
              disabled={!message.trim()}
              style={{
                padding: '0 24px',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}

      {!connected && joined && (
        <div style={{
          color: '#c00',
          textAlign: 'center',
          marginTop: '16px'
        }}>
          Disconnected — trying to reconnect...
        </div>
      )}
    </div>
  );
};

export default Chat;