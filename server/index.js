const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDb = require("./config/dbConnect");
const bodyParser = require("body-parser");
const authRoute = require("./routes/authRoute");
const chatRoute = require("./routes/chatRoute");
const initializeSocket = require("./services/socketService")
const http = require('http')

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();
const corsOption = {
  origin:process.env.CLIENT_URL,
  Credentials:true
}


//middleware
app.use(express.json()); // parse body data
app.use(cookieParser()); //parse token on every request
app.use(cors()); //enable cors
app.use(bodyParser.urlencoded({ extended: true })); // parse URL-encoded data
app.use(cors(corsOption))


//database connection
connectDb();


//create server
const server = http.createServer(app)
const io = initializeSocket(server)

//apply socket middleware before routes
app.use((req,res,next) => {
  req.io = io;
  req,socketUserMap = io.socketUserMap
  next();
})


//Routes
app.get("/", (req, res) => {
  res.json({ message: "Chat App Server is running", endpoints: { auth: "/api/auth" } });
});

app.use("/api/auth", authRoute);
app.use("/api/chat", chatRoute);
//app.use('/api/status',statusRoute)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});