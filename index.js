require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const PORT = Number(process.env.PORT) || 4646;
const indexRouter = require("./routes");

mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.log("database error", err);
  });
app.use(cors());
app.use(express.json());
app.use("/resources", express.static("public"));
app.use(morgan("tiny"));
app.use("/", indexRouter);

app.use((err, req, res, next) => {
  const errMsg = err ? err.toString() : "something went wrong";
  res.status(500).json({ data:null, msg: errMsg });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
