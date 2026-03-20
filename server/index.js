require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const DEBUG_LOG_ENV = process.env.DEBUG_LOG_ENV === 'true';
if (DEBUG_LOG_ENV) {
  console.log("ENV CHECK: MONGO_URI is configured:", Boolean(process.env.MONGO_URI));
}
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDb = require("./config/dbConnect");
const bodyParser = require("body-parser");
const authRoute = require("./routes/authRoute"); // You named it authRoute here
const chatRoute = require("./routes/chatRoute");
const statusRoute = require("./routes/statusRoute");
const initializeSocket = require("./services/socketService");
const http = require('http');
const dns = require('node:dns/promises');
const dnsServersEnv = process.env.DNS_SERVERS;
if (dnsServersEnv) {
  const servers = dnsServersEnv.split(',').map(s => s.trim()).filter(Boolean);
  if (servers.length > 0) {
    dns.setServers(servers);
  }
}

const PORT = process.env.PORT || 3000;
const app = express();

// --- 1. FIXED CORS CONFIGURATION ---
const corsOptions = {
  origin: process.env.CLIENT_URL || '"https://sanjana-chat-app.vercel.app"',
  credentials: true, // Note: lowercase 'c' is required
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

// --- 2. MIDDLEWARE (Apply CORS before routes) ---
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection,,,
connectDb();

// Create server
const server = http.createServer(app);
const io = initializeSocket(server);

// Apply socket middleware
app.use((req, res, next) => {
  req.io = io;
  req.socketUserMap = io.socketUserMap; // Fixed comma to dot
  next();
});

// --- 3. ROUTES ---
app.get("/", (req, res) => {
  res.json({ message: "Chat App Server is running", endpoints: { auth: "/api/auth" } });
});

// Use the correct variable name: authRoute
app.use("/api/auth", authRoute);
app.use("/api/chats", chatRoute);
app.use('/api/status', statusRoute);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// --- 4. START SERVER ---
server.listen(PORT, () => {
  console.log(`Server is running on port... ${PORT}`);

});

