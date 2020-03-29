const mongoose = require("mongoose");
const DB_URI = "mongodb://mongo:27017/facenetdb";
const Mockgoose = require("mockgoose").Mockgoose;

function connect() {
  return new Promise((resolve, reject) => {
    if (process.env.NODE_ENV === "test") {
      const mockgoose = new Mockgoose(mongoose);

      mockgoose.prepareStorage().then(() => {
        mongoose
          .connect(DB_URI, { useNewUrlParser: true, useCreateIndex: true })
          .then((res, err) => {
            if (err) return reject(err);
            resolve();
          });
      });
    } else {
      mongoose
        .connect(DB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          useCreateIndex: true
        })
        .then((res, err) => {
          if (err) return reject(err);
          resolve();
        });
    }
  });
}

function close() {
  return new Promise((resolve, reject) => {
    mongoose.disconnect();
    resolve();
  });
}

module.exports = { connect, close };
