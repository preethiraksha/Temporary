const express = require("express");
const { exec } = require("child_process");
const router = express.Router();

const checkAdminAuth = require("../auth/check-admin-auth");

router.post("/", checkAdminAuth, (req, res, next) => {
  console.log("Train model requested");

  console.log("Attempting to pre process images");

  exec(
    "rm /app/core/pre_img/bounding* && cd /app/core && python3 data_preprocess.py",
    function(error, stdout, stderr) {
      console.log(stdout);
      if (stdout.includes("Completed")) {
        exec("cd core && python3 train_main.py", function(
          error,
          stdout,
          stderr
        ) {
          console.log(stdout);
          var responseList = stdout.split(/\r?\n/);

          var classes = -1,
            totalImages = -1,
            successful = false;
          responseList.forEach(function(consoleLine) {
            if (consoleLine.includes("Classes")) {
              classes = parseInt(consoleLine.replace("Classes: ", ""));
            }

            if (consoleLine.includes("Images")) {
              totalImages = parseInt(consoleLine.replace("Images: ", ""));
            }

            if (consoleLine.includes("Completed")) {
              successful = true;
            }
          });

          if (successful) {
            return res.status(200).json({
              statusCode: 200,
              statusMessage: "Model re-trained successfully",
              classes: classes,
              totalImages: totalImages
            });
          } else {
            return res.status(400).json({
              statusCode: 400,
              statusMessage: "Model training failed"
            });
          }
        });
      } else {
        return res.status(400).json({
          statusCode: 400,
          statusMessage: "Model training failed"
        });
      }
    }
  );
});

module.exports = router;
