const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");

const config = { port: process.env.PORT || 5000, jwtsecret: "kitakesana" };
const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: ["http://localhost:5173"] }));
app.use(bodyParser.json());

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const usersInRooms = {}; // Saved here

const authToken = (token) => jwt.verify(token, config.jwtsecret);

app.post("/api/v1/auth/login", (req, res) => {
  const payload = { room: req.body.room, name: req.body.name };
  const token = jwt.sign(payload, config.jwtsecret);
  res.send({ token });
});

io.on("connection", (socket) => {
  try {
    const token = socket.request.headers.authorization.split(" ")[1];
    const auth = authToken(token);

    socket.join(auth.room);

    if (!usersInRooms[auth.room]) usersInRooms[auth.room] = {};
    usersInRooms[auth.room][auth.name] = { online: true, socketId: socket.id };

    io.to(auth.room).emit("roomUsers", usersInRooms[auth.room]);

    /** WebRTC Signaling */
    socket.on("offer", (offer) => {
      socket.to(auth.room).emit("offer", { name: auth.name, offer });
    });

    socket.on("answer", (answer) => {
      socket.to(auth.room).emit("answer", { name: auth.name, answer });
    });

    socket.on("ice-candidate", (candidate) => {
      socket.to(auth.room).emit("ice-candidate", { name: auth.name, candidate });
    });

    /** Chat */
    socket.on("message", (message) => {
      const payload = { name: auth.name, content: message.content };
      socket.to(auth.room).emit("message", payload);
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
