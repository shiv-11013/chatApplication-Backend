# Chat Application Backend

Real-time chat application backend built with Node.js, Express.js, MongoDB, JWT authentication, and Socket.IO.

## Features

* User Registration and Login
* JWT Authentication
* Real-time Messaging with Socket.IO
* Message Delivery Status
* Seen Message Status
* Typing Indicator
* Online User Tracking
* Protected Routes
* MongoDB Database Integration

---

# Tech Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.IO
* JWT
* bcrypt
* dotenv
* cors

---

# Project Structure

```bash
chat-application-backend/
│
├── middleware/
│   └── auth.middleware.js
│
├── models/
│   ├── Messages.js
│   └── User.js
│
├── routes/
│   └── auth.js
│
├── node_modules/
│
├── .env
├── .gitignore
├── index.js
├── package.json
└── package-lock.json
```

---

# Installation

## 1. Clone Repository

```bash
git clone <your-repository-url>
```

## 2. Move Into Project Folder

```bash
cd chat-application-backend
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Create .env File

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

## 5. Start Server

```bash
npm start
```

or

```bash
node index.js
```

---

# API Endpoints

## Authentication Routes

Base URL:

```bash
/auth
```

### Register User

```http
POST /auth/register
```

### Request Body

```json
{
  "username": "shiv",
  "password": "123456"
}
```

### Response

```json
{
  "message": "Server registered successfully.",
  "token": "jwt_token",
  "username": "shiv"
}
```

---

### Login User

```http
POST /auth/login
```

### Request Body

```json
{
  "username": "shiv",
  "password": "123456"
}
```

### Response

```json
{
  "message": "Login successful",
  "username": "shiv",
  "token": "jwt_token"
}
```

---

# Protected Routes

## Get Messages

```http
GET /messages?sender=user1&receiver=user2
```

### Headers

```bash
Authorization: Bearer your_jwt_token
```

---

## Get Users

```http
GET /users?currentUser=shiv
```

### Headers

```bash
Authorization: Bearer your_jwt_token
```

---

# Socket.IO Events

## Client Events

### User Online

```javascript
socket.emit("user_online", username);
```

### Join Room

```javascript
socket.emit("join_room", roomId);
```

### Send Message

```javascript
socket.emit("send_message", {
  sender,
  receiver,
  message,
  roomId,
});
```

### Mark Messages Seen

```javascript
socket.emit("mark_messages_seen", {
  sender,
  receiver,
  roomId,
});
```

### Typing Event

```javascript
socket.emit("typing", {
  roomId,
  sender,
});
```

---

## Server Events

### Receive Message

```javascript
socket.on("receive_message", (data) => {
  console.log(data);
});
```

### Message Status Updated

```javascript
socket.on("status_updated", (data) => {
  console.log(data);
});
```

### All Messages Seen

```javascript
socket.on("all_messages_seen", (data) => {
  console.log(data);
});
```

### User Typing

```javascript
socket.on("user_typing", (sender) => {
  console.log(sender);
});
```

---

# Database Models

## User Model

```javascript
{
  username: String,
  password: String,
  createdAt: Date
}
```

---

## Message Model

```javascript
{
  sender: String,
  receiver: String,
  message: String,
  status: "sent" | "delivered" | "seen"
}
```

---

# Authentication Flow

1. User registers or logs in.
2. Server generates JWT token.
3. Frontend stores token.
4. Protected routes verify token using middleware.
5. Authenticated user can access chat APIs.

---

# Message Status Flow

## Sent

Message created in database.

## Delivered

Receiver comes online.

## Seen

Receiver opens chat and marks messages as seen.

---

# Future Improvements

* Store socket IDs in database
* Add image sharing
* Add group chats
* Add message deletion
* Add voice/video calling
* Add refresh token authentication
* Add rate limiting
* Add validation middleware
* Add Docker support

---

# Author

Shiv Kumar

GitHub: [https://github.com/shiv-11013](https://github.com/shiv-11013)
