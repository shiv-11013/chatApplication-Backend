const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const Messages = require("./models/Messages");
const User = require("./models/User");
const authRoutes = require("./routes/auth"); 

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes); 

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000" },
});

io.on("connection", (socket) => {
  console.log("New User Connected:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`STEP 1: User joined room: ${roomId}`);
  });

  socket.on("send_message", async (data, callback) => {
    const { sender, receiver, message, roomId } = data;
    const newMessage = new Messages({ sender, receiver, message, status: "sent" });
    await newMessage.save();

    console.log(`STEP 2: Msg Saved [${newMessage._id}]. Emitting to: ${roomId}`);
    
    
    callback({ id: newMessage._id.toString(), status: "sent" });

    socket.to(roomId).emit("receive_message", newMessage);
  });

  socket.on("message_delivered", async (data) => {
    const { messageId, roomId } = data;
    await Messages.findByIdAndUpdate(messageId, { status: "delivered" });
    
    console.log(`STEP 4: Marked ${messageId} as delivered`);
    io.to(roomId).emit("status_updated", { messageId, status: "delivered" });
  });

  socket.on("mark_messages_seen", async (data) => {
    const { sender, receiver, roomId } = data;
    try {
      await Messages.updateMany(
        { sender: sender, receiver: receiver, status: { $ne: "seen" } },
        { $set: { status: "seen" } }
      );
      
      console.log(`STEP 5: Broadcasting Blue Ticks to Room: ${roomId}`);
      io.to(roomId).emit("all_messages_seen", { sender, receiver });
    } catch (err) { console.error(err); }
  });

  socket.on("disconnect", () => console.log("User Disconnected"));
});


app.get("/messages", async (req, res) => {
  const { sender, receiver } = req.query;
  const messages = await Messages.find({
    $or: [{ sender, receiver }, { sender: receiver, receiver: sender }],
  }).sort({ createdAt: 1 });
  res.json(messages);
});

app.get("/users", async (req, res) => {
  const { currentUser } = req.query;
  const users = await User.find({ username: { $ne: currentUser } });
  res.json(users);
});

mongoose.connect(process.env.MONGO_URI).then(() => console.log("DB Connected"));
server.listen(5001, () => console.log("Server running on port 5001"));