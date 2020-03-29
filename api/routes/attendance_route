const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");

const checkBasicAuth = require("../auth/check-basic-auth");
const checkAdminAuth = require("../auth/check-admin-auth");

const Attendance = require("../models/attendance");

router.post("/add",(req, res, next) => {
 
    Attendance.findOne
    ({
    roll_no: String(req.body.roll_no)
    })
    .exec()
    .then(user => {
    if (user)
    {
    console.log("already added");
    return res.status(409).json
        ({
          statusCode: 409,
          statusMessage: "already exists",
          url: "http://" + process.env.SERVER_IP + "/api/user/add"
        });
    } 
     
    else
    {
      if (String(req.body.roll_no).length !=9)
       {
          return res.status(411).json({
            statusCode: 411,
            statusMessage: "wrong ROLL-NO"
          });
       } 
      else if (!req.body.roll_no || !req.body.name || !req.body.course_id)
      {
          return res.status(400).json({
            statusCode: 400,
            statusMessage: "missing details"
          });
      } 
      else 
      {
          console.log("Attempt to add new student : " + req.body.roll_no);

              const newAttendance = Attendance({
                _id: new mongoose.Types.ObjectId(),
                roll_no: req.body.roll_no,
                name: req.body.name,
                course_id: req.body.course_id
              });

              newAttendance
                .save()
                .then(result => {
                  console.log(
                    "New student added " + req.body.roll_no + " created"
                  );
                  return res.status(201).json({
                    statusCode: 201,
                    statusMessage: "New student added"
                  });
                })
        
                .catch(err => {
                  console.log(err);
                  return res.status(500).json({
                    statusCode: 500,
                    error: err
                  });
                });
       }
    }
    })
    .catch(err => {
      console.log(err);
      return res.status(500).json({
        statusMessage: "Internal server error",
        error: err
      });
});
});

router.get("/list", (req, res, next) => {
  Attendance.find()
    .select("-_id -__v -password")
    .then(result => {
      if (result.length > 0) {
        return res.status(200).json({
          statusCode: 200,
          statusMessage: "Sending entire students list",
          result
        });
      } else {
        return res.status(404).json({
          statusCode: 404,
          statusMessage: "No student records"
        });
      }
    })
    .catch(err => {
      res.status(500).json({
        statusCode: 500,
        statusMessage: "Internal server error",
        error: err
      });
    });
});





module.exports = router;
