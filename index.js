require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const PORT = Number(process.env.PORT) || 4999;
const indexRouter = require("./routes");

mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.log("database error", err);
  });

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'access_token'],
  credentials: true
}));

// Body parsing middleware - MUST come before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  if (req.method === 'POST') {
    console.log('Request body:', req.body);
  }
  next();
});

app.use("/resources", express.static("public"));
app.use(morgan("tiny"));
app.use("/", indexRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const errMsg = err ? err.toString() : "something went wrong";
  res.status(500).json({ data: null, msg: errMsg });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
