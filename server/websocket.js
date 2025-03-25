const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const config = { port: process.env.PORT || 3001, jwtsecret: "kitakesana" };
const app = express();
const httpServer = createServer(app);
const cors = require("cors");

app.use(cors({ origin: ["http://localhost:5173"] }));
app.use(bodyParser.json());

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  },
});

const usersInRooms = {}; // Saved here
const messages = {};

const authToken = (token) => jwt.verify(token, config.jwtsecret);

app.post("/api/v1/auth/login", (req, res) => {
  const payload = { room: req.body.room, name: req.body.name };
  const token = jwt.sign(payload, config.jwtsecret);
  res.send({ token });
});

io.on("connection", (socket) => {
  try {
    const token = socket.handshake.auth?.token;
    const auth = authToken(token);

    socket.join(auth.room);

    if (!usersInRooms[auth.room]) usersInRooms[auth.room] = {};
    usersInRooms[auth.room][auth.name] = { online: true, socketId: socket.id };

    io.to(auth.room).emit("roomUsers", usersInRooms[auth.room]);
    io.to(auth.room).emit("message", messages[auth.room] ?? []);

    // Web RTC
    socket.on('hangup', () => io.to(auth.room).emit('hangup'));
    socket.on('cancel', (data) => socket.to(auth.room).emit('cancel', data));
    socket.on('accept', (data) => socket.to(auth.room).emit('accept', data));
    socket.on('signal', (data) => socket.to(auth.room).emit('signal', data));
    socket.on('ask', (data) => socket.to(auth.room).emit('ask', data));
    socket.on('offer', (data) => socket.to(auth.room).emit('offer', data));
    socket.on('answer', (data) => socket.to(auth.room).emit('answer', data));

    socket.on("message", (message) => {
      const payload = { name: auth.name, content: message.content };
      messages[auth.room] = [...(messages[auth.room] ?? []), payload];
      socket.to(auth.room).emit("message", messages[auth.room]);
    });

    socket.on("disconnect", () => {
      if (usersInRooms[auth.room] && usersInRooms[auth.room][auth.name]) {
        usersInRooms[auth.room][auth.name].online = false;
        io.to(auth.room).emit("roomUsers", usersInRooms[auth.room]);
      }
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
});

httpServer.listen(config.port, () => {
  console.log(`WebSocket server running at: http://localhost:${config.port}`);
});
