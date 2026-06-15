const MessageModel = require("../models/Messages");

function initializeChatSocket(io) {
  const onlineUsers = {};
  const emitOnlineUsers = () => {
    io.emit("online_users", Object.keys(onlineUsers));
  };
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("user_online", async (username) => {
      socket.username = username;
      onlineUsers[username] = socket.id;
      console.log("Online users:", onlineUsers);
      emitOnlineUsers();

      const deliveredMessages = await MessageModel.find({
        receiver: username,
        status: "sent",
      });

      const messageIds = deliveredMessages.map((msg) => msg._id);

      if (messageIds.length > 0) {
        await MessageModel.updateMany(
          {
            _id: { $in: messageIds },
          },
          {
            $set: { status: "delivered" },
          },
        );
        const counts = {};

        deliveredMessages.forEach((msg) => {
          counts[msg.sender] = (counts[msg.sender] || 0) + 1;
        });

        io.to(onlineUsers[username]).emit("unread_counts", counts);

        deliveredMessages.forEach((msg) => {
          const roomId = [msg.sender, msg.receiver].sort().join("_");

          io.to(roomId).emit("message_status_updated", {
            messageId: msg._id,
            status: "delivered",
          });
        });
      }
    });

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`${socket.id} joined room ${roomId}`);
    });

    socket.on("typing_started", ({ roomId, sender }) => {
      socket.to(roomId).emit("user_typing", { sender });
    });

    socket.on("typing_stopped", ({ roomId, sender }) => {
      socket.to(roomId).emit("user_stopped_typing", { sender });
    });

    socket.on("send_message", async (data) => {
      try {
        const { sender, receiver, message, roomId } = data;

        const newMessage = new MessageModel({
          sender,
          receiver,
          message,
          status: "sent",
        });

        const savedMessage = await newMessage.save();

        const receiverSocketId = onlineUsers[receiver];
        if (receiverSocketId) {
          savedMessage.status = "delivered";
          await savedMessage.save();
        }
        io.to(roomId).emit("receive_message", savedMessage);

        const room = io.sockets.adapter.rooms.get(roomId);
        const isReceiverInRoom = receiverSocketId
          ? room?.has(receiverSocketId)
          : false;

        if (receiverSocketId && !isReceiverInRoom) {
          io.to(receiverSocketId).emit("receive_message", savedMessage);
        }
      } catch (error) {
        console.error("Error saving message:", error);

        socket.emit("message_error", {
          error: "Message could not be sent",
        });
      }
    });

    socket.on("mark_messages_seen", async ({ sender, receiver, roomId }) => {
      try {
        const seenMessages = await MessageModel.find({
          sender,
          receiver,
          status: { $ne: "seen" },
        });

        const messageIds = seenMessages.map((msg) => msg._id);

        if (messageIds.length === 0) return;

        await MessageModel.updateMany(
          {
            _id: { $in: messageIds },
          },
          {
            $set: { status: "seen" },
          },
        );

        seenMessages.forEach((msg) => {
          io.to(roomId).emit("message_status_updated", {
            messageId: msg._id,
            status: "seen",
          });
        });
      } catch (error) {
        console.error("Error marking messages as seen:", error);
      }
    });

    socket.on("disconnect", () => {
      if (socket.username && onlineUsers[socket.username] === socket.id) {
        delete onlineUsers[socket.username];
        emitOnlineUsers();
      }

      console.log("User disconnected:", socket.id);
    });
  });
}

module.exports = initializeChatSocket;
