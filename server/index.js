const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDb = require("./config/dbConnect");
const bodyParser = require("body-parser");
const authRoute = require("./routes/authRoute");

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();


//middleware
app.use(express.json()); // parse body data
app.use(cookieParser()); //parse token on every request
app.use(cors()); //enable cors
app.use(bodyParser.urlencoded({ extended: true })); // parse URL-encoded data

//database connection
connectDB();

//Routes
app.use("/api/auth", authRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});