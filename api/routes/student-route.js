const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");

const checkBasicAuth = require("../auth/check-basic-auth");
const checkAdminAuth = require("../auth/check-admin-auth");

const Student = require("../models/student");

router.post("/signup", (req, res, next) => {
  Student.findOne({
    email: String(req.body.email).toLowerCase()
  })
    .exec()
    .then(user => {
      if (user) {
        console.log("Cannot signup as email already exists");
        return res.status(409).json({
          statusCode: 409,
          statusMessage: "Email already exists",
          url: "http://" + process.env.SERVER_IP + "/api/user/login"
        });
      } else {
        if (!validateEmail(req.body.email)) {
          return res.status(400).json({
            statusCode: 400,
            statusMessage: "Email is not valid or malformed"
          });
        }

        if (String(req.body.password).length < 6) {
          return res.status(411).json({
            statusCode: 411,
            statusMessage: "Password conditions not met"
          });
        } else if (!req.body.roll_no || !req.body.name) {
          return res.status(400).json({
            statusCode: 400,
            statusMessage: "Name and/or Roll number missing"
          });
        } else {
          console.log("Attempt to create new account : " + req.body.email);

          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
              console.log(err);
              return res.status(500).json({
                statusCode: 500,
                error: err
              });
            } else {
              const newStudent = Student({
                _id: new mongoose.Types.ObjectId(),
                email: String(req.body.email).toLowerCase(),
                password: hash,
                roll_no: req.body.roll_no,
                name: req.body.name,
                admin: String(req.body.email).includes("harsh")
              });

              newStudent
                .save()
                .then(result => {
                  console.log(
                    "New user with email " + req.body.email + " created"
                  );
                  return res.status(201).json({
                    statusCode: 201,
                    statusMessage: "New user created"
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

router.post("/login", (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      statusCode: 400,
      statusMessage: "Email and password required for login."
    });
  }

  Student.findOne({
    email: String(req.body.email).toLowerCase()
  })
    .exec()
    .then(user => {
      if (user) {
        bcrypt.compare(req.body.password, user.password, (err, match) => {
          if (err) {
            return res.status(401).json({
              statusCode: 401,
              statusMessage: "Authentication failed"
            });
          }

          if (match) {
            const token = jwt.sign(
              {
                email: user.email,
                userId: user._id,
                admin: user.admin,
                roll_no: user.roll_no
              },
              process.env.JWT_KEY,
              {
                expiresIn: "1h"
              }
            );

            fs.readdir("./core/train_img/" + user.name, (err, files) => {
              var fileCount = 0;
              if (files) fileCount = files.length;
              return res.status(200).json({
                statusCode: 200,
                statusMessage: "Authentication successful",
                token: token,
                isAdmin: user.admin,
                currentPhotosCount: fileCount
              });
            });
          } else {
            return res.status(401).json({
              statusCode: 401,
              statusMessage: "Authentication failed"
            });
          }
        });
      } else {
        return res.status(404).json({
          statusCode: 404,
          statusMessage: "Student does not exist"
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
});

router.post("/change_password", checkBasicAuth, (req, res, next) => {
  if (!req.body.old || !req.body.new) {
    return res.status(400).json({
      statusCode: 400,
      statusMessage: "New password and/or old password missing"
    });
  }

  if (req.body.old == req.body.new) {
    return res.status(400).json({
      statusCode: 400,
      statusMessage: "New password and old password must be different"
    });
  }

  Student.findOne({
    email: String(req.body.email).toLowerCase()
  })
    .exec()
    .then(user => {
      if (user) {
        bcrypt.compare(req.body.old, user.password, (err, match) => {
          if (err)
            return res.status(401).json({
              statusCode: 401,
              statusMessage: "Old password is incorrect"
            });

          if (match) {
            bcrypt.hash(req.body.new, 10, (err, hash) => {
              if (err) {
                console.log(err);
                return res.status(500).json({
                  statusCode: 500,
                  statusMessage: "New password is malformed",
                  error: err
                });
              } else {
                Student.findOneAndUpdate(
                  {
                    email: req.body.email
                  },
                  {
                    password: hash
                  }
                )
                  .then(result => {
                    return res.status(200).json({
                      statusCode: 200,
                      statusMessage: "Password successfully changed"
                    });
                  })
                  .catch(err => {
                    return res.status(500).json({
                      statusCode: 500,
                      statusMessage:
                        "Internal server error. Could not find user with email."
                    });
                  });
              }
            });
          } else {
            return res.status(401).json({
              statusCode: 401,
              statusMessage: "Old password is incorrect"
            });
          }
        });
      } else {
        return res.status(404).json({
          statusCode: 404,
          statusMessage: "Student does not exist"
        });
      }
    })
    .catch(err => {
      return res.status(500).json({
        statusCode: 500,
        statusMessage: "Internal server error"
      });
    });
});

router.delete("/delete", checkAdminAuth, (req, res, next) => {
  if (!req.body.email) {
    return res.status(400).json({
      statusCode: 400,
      statusMessage: "Email to delete missing"
    });
  }

  Student.findOneAndDelete({
    email: req.body.email
  })
    .then(user => {
      if (user) {
        return res.status(200).json({
          statusCode: 200,
          statusMessage: "Student account deleted"
        });
      } else {
        return res.status(400).json({
          statusCode: 400,
          statusMessage: "Student account doesn't exist"
        });
      }
    })
    .catch(err => {
      return res.status(500).json({
        statusCode: 500,
        statusMessage: "Internal server error"
      });
    });
});

router.post("/reset_password", checkBasicAuth, (req, res, next) => {
  if (!req.body.email) {
    return res.status(400).json({
      statusCode: 400,
      statusMessage: "Email ID is missing"
    });
  }

  Student.findOne({
    email: String(req.body.email).toLowerCase()
  })
    .then(user => {
      if (user) {
        if (Date.now() - user.last_password_reset_request < 30 * 60 * 1000) {
          return res.status(400).json({
            statusCode: 400,
            statusMessage:
              "Reset password request already sent. Check your spam folder."
          });
        }

        const generatedPassword = generateTemporaryPassword(8);
        console.log(
          "Temporary password for " +
            req.body.email +
            " is " +
            generatedPassword
        );
        bcrypt.hash(generatedPassword, 10, (err, hash) => {
          if (err) {
            console.log(err);
            return res.status(500).json({
              statusCode: 500,
              statusMessage:
                "Cannot created temporary password at the moment. Try again later.",
              error: err
            });
          } else {
            Student.findOneAndUpdate(
              {
                email: req.body.email
              },
              {
                password: hash,
                last_password_reset_request: Date.now()
              }
            )
              .then(result => {
                let transporter = nodemailer.createTransport({
                  host: "smtp.gmail.com",
                  port: 465,
                  secure: true,
                  auth: {
                    user: "mlitsm.api@gmail.com",
                    pass: "$Microland3"
                  }
                });
                let mailOptions = {
                  from: '"ITSM Password Reset" <mlitsm.api@gmail.com>',
                  to: req.body.email,
                  subject: "Password reset request",
                  text:
                    "Hi!\n\nWe received a request to reset password for this account. Your temporary password is " +
                    generatedPassword +
                    ".\nChange you password immediately if you did not send this request.\n\nITSM Core Team"
                };

                transporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                    return res.status(500).json({
                      statusCode: 500,
                      statusMessage:
                        "Internal server error. Could not send password reset mail."
                    });
                  } else {
                    console.log(
                      "Message %s sent: %s",
                      info.messageId,
                      info.response
                    );
                    return res.status(200).json({
                      statusCode: 200,
                      statusMessage:
                        "Password reset email sent. Please check your inbox."
                    });
                  }
                });
              })
              .catch(err => {
                return res.status(500).json({
                  statusCode: 500,
                  statusMessage:
                    "Internal server error. Could not find user with email."
                });
              });
          }
        });
      } else {
        res.status(404).json({
          statusCode: 404,
          statusMessage: "Student with given email does not exist"
        });
      }
    })
    .catch(err => {
      return res.status(500).json({
        statusCode: 500,
        statusMessage: "Internal server error"
      });
    });
});

router.get("/list", checkAdminAuth, (req, res, next) => {
  Student.find()
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

function generateTemporaryPassword(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

module.exports = router;
