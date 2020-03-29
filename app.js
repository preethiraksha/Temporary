const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();
const logger = require("morgan");
const bodyParser = require("body-parser");

const uploadRoute = require("./api/routes/upload-route");
const trainRoute = require("./api/routes/train-route");
const identifyRoute = require("./api/routes/identify-route");
const studentRoute = require("./api/routes/student-route");

app.use(logger("dev"));

app.use(
  fileUpload({
    createParentPath: true,
    limits: {
      fileSize: 2 * 1024 * 1024 * 1024 //2MB max file(s) size
    }
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Accept, Authorization");
  if (req.method == "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE");
    return res.status(200).json({});
  }
  next();
});

app.use("/api/upload", uploadRoute);
app.use("/api/train", trainRoute);
app.use("/api/identify", identifyRoute);
app.use("/api/student", studentRoute);

app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      statusCode: error.status,
      statusMessage: error.message
    }
  });
});

module.exports = app;
