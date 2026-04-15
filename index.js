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

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const onlineUsers = {};

io.on("connection", (socket) => {
  socket.on("user_online", (username) => {
    onlineUsers[username] = socket.id;
  });

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("send_message", async (data, callback) => {
    const { sender, receiver, message, roomId } = data;

    const newMessage = await Messages.create({
      sender,
      receiver,
      message,
      status: "sent",
    });

    if (callback) {
      callback({
        id: newMessage._id.toString(),
        status: "sent",
      });
    }

    io.to(roomId).emit("receive_message", newMessage);

    if (onlineUsers[receiver]) {
      await Messages.findByIdAndUpdate(newMessage._id, {
        status: "delivered",
      });

      io.emit("status_updated", {
        messageId: newMessage._id,
        status: "delivered",
      });
    }
  });

  socket.on("message_delivered", async ({ messageId, roomId }) => {
    await Messages.findByIdAndUpdate(messageId, {
      status: "delivered",
    });

    io.to(roomId).emit("status_updated", {
      messageId,
      status: "delivered",
    });
  });

  socket.on("mark_messages_seen", async ({ sender, receiver, roomId }) => {
    await Messages.updateMany(
      {
        sender,
        receiver,
        status: { $ne: "seen" },
      },
      { $set: { status: "seen" } }
    );

    io.to(roomId).emit("all_messages_seen", { sender, receiver });
  });

  socket.on("typing", ({ roomId, sender }) => {
    socket.to(roomId).emit("user_typing", sender);
  });

  socket.on("disconnect", () => {
    for (let user in onlineUsers) {
      if (onlineUsers[user] === socket.id) {
        delete onlineUsers[user];
      }
    }
  });
});

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

app.get("/users", async (req, res) => {
  const { currentUser } = req.query;

  const users = await User.find({
    username: { $ne: currentUser },
  });

  res.json(users);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log("Server running");
});