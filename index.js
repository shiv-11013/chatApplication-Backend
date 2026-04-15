require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const Messages = require("./models/Messages");
const User = require("./models/User");
const authRoutes = require("./routes/auth");

const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);

// create server + socket
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

// socket logic
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // join chat room
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
  });

  // send message
  socket.on("send_message", async (data, callback) => {
    const { sender, receiver, message, roomId } = data;

    const newMessage = await Messages.create({
      sender,
      receiver,
      message,
      status: "sent",
    });

    // acknowledge sender
    callback({
      id: newMessage._id.toString(),
      status: "sent",
    });

    // send to receiver
    socket.to(roomId).emit("receive_message", newMessage);
  });

  // mark delivered
  socket.on("message_delivered", async ({ messageId, roomId }) => {
    await Messages.findByIdAndUpdate(messageId, {
      status: "delivered",
    });

    io.to(roomId).emit("status_updated", {
      messageId,
      status: "delivered",
    });
  });

  // mark seen
  socket.on("mark_messages_seen", async ({ sender, receiver, roomId }) => {
    await Messages.updateMany(
      {
        sender,
        receiver,
        status: { $ne: "seen" },
      },
      { $set: { status: "seen" } },
    );

    io.to(roomId).emit("all_messages_seen", { sender, receiver });
  });

  // typing indicator
  socket.on("typing", ({ roomId, sender }) => {
    socket.to(roomId).emit("user_typing", sender);
  });

  // when user comes online -> update old messages
  socket.on("user_online", async (username) => {
    const pending = await Messages.find({
      receiver: username,
      status: "sent",
    });

    for (const msg of pending) {
      msg.status = "delivered";
      await msg.save();

      io.emit("status_updated", {
        messageId: msg._id,
        status: "delivered",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// ---------------- APIs ----------------

// get chat messages
app.get("/messages", async (req, res) => {
  const { sender, receiver } = req.query;

  const messages = await Messages.find({
    $or: [
      { sender, receiver },
      { sender: receiver, receiver: sender },
    ],
  }).sort({ createdAt: 1 });

  res.json(messages);
});

// get users list
app.get("/users", async (req, res) => {
  const { currentUser } = req.query;

  const users = await User.find({
    username: { $ne: currentUser },
  });

  res.json(users);
});

// database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected"))
  .catch((err) => console.log(err));

// start server
server.listen(5001, () => {
  console.log("Server running on port 5001");
});
