const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

//database connection
connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});