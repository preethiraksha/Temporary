const express = require("express");
const { exec } = require("child_process");
const router = express.Router();

const Student = require("../models/student");

const checkAdminAuth = require("../auth/check-admin-auth");

router.post("/", checkAdminAuth, (req, res, next) => {
  console.log("Face identification requested");

  if (!req.files) {
    return res.status(400).json({
      statusCode: 400,
      statusMessage: "File not uploaded"
    });
  } else {
    let photo = req.files.photo;
    photo.mv("./core/identification_image.jpg");

    exec("cd core && python3 identify_face_image.py", function(
      error,
      stdout,
      stderr
    ) {
      console.log(stdout);
      var responseList = stdout.split(/\r?\n/);

      var nameList = [];
      var probability = [];
      var successful = false,
        noOfFacesDetected = 0;
      responseList.forEach(function(item) {
        if (item.includes("Name: ")) {
          item = item.replace("Name: ", "");
          nameList.push(item);
        }
        if (item.includes("Probability: ")) {
          item = item.replace("Probability: ", "");
          item = item.replace("]", "");
          item = item.replace("[", "");
          probability.push(parseFloat(item));
        }
        if (item.includes("Face Detected: ")) {
          noOfFacesDetected = parseInt(item.replace("Face Detected:", ""));
        }
        if (item.includes("Completed")) {
          successful = true;
        }
      });

      if (successful) {
        Student.find()
          .select("-_id -__v -password -admin")
          .where("name")
          .in(nameList)
          .exec()
          .then(studentList => {
            if (studentList) {
              return res.status(200).json({
                statusCode: 200,
                statusMessage: "Face identification successful",
                students: studentList,
                probabilities: probability,
                numberOfFaces: noOfFacesDetected
              });
            } else {
              return res.status(400).json({
                statusCode: 400,
                statusMessage: "Student has not registered"
              });
            }
          })
          .catch(err => {
            console.log({
              error: err
            });
            return res.status(500).json({
              statusCode: 500,
              statusMessage: "Internal server error"
            });
          });
      } else {
        return res.status(400).json({
          statusCode: 400,
          statusMessage: "Face identification failed"
        });
      }
    });
  }
});

module.exports = router;
