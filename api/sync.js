const request = require("request");
const mongoose = require("mongoose");

const Ticket = require("./models/ticket").Ticket;
const Field = require("./models/ticket").Field;
const Major = require("./models/ticket").Major;
const AvailableConfigs = require("./models/configuration").AvailableConfig;

const Designation = require("./models/designation");

function syncLocalDatabase() {

  Designation
    .find()
    .then(result => {
      if (!request || result.length < 1) {
        var newDesignation = new Designation({
          _id: new mongoose.Types.ObjectId(),
          tier: 1,
          name: "Vice president"
        });
        newDesignation.save();

        newDesignation = new Designation({
          _id: new mongoose.Types.ObjectId(),
          tier: 2,
          name: "Director"
        });
        newDesignation.save();

        newDesignation = new Designation({
          _id: new mongoose.Types.ObjectId(),
          tier: 3,
          name: "Sr. Developer"
        });
        newDesignation.save();

        newDesignation = new Designation({
          _id: new mongoose.Types.ObjectId(),
          tier: 4,
          name: "Intern"
        });
        newDesignation.save();

        console.log("Sample designations added");

      } else {
        console.log("Designations table not empty so not adding sample designations.");
      }
    })
    .catch(err => {
      console.log("Error setting up sample designations.");
      console.log(err);
    });

  request.get(
    "https://dev75527.service-now.com/api/now/table/incident", {
      auth: {
        username: "admin",
        password: "XJbxG7uxGnJ8"
      },

      headers: {
        Accept: "application/json"
      }
    },
    (err, res, body) => {
      if (err) {
        console.log(err);
      } else {
        if (body[0] == '<') {
          console.log("Cannot connect to ServiceNow instance. It might have hibernated.")
          return
        }

        const tickets = JSON.parse(body).result;
        console.log("Tickets Fetched from ServiceNow = " + tickets.length);

        var majorTickets = [];
        var availableConfigStrings = [];
        var sampleConfigData = [];

        for (var i = 0; i < tickets.length; ++i) {
          var fields = [];

          for (var key in tickets[i]) {
            if (tickets[i][key] && tickets[i][key] != "")
              fields.push(
                Field({
                  fieldName: key,
                  fieldValue: tickets[i][key]
                })
              );

            if (i == 0) {
              availableConfigStrings.push(key);
              sampleConfigData.push(tickets[i][key]);
            }
          }
          majorTickets.push(
            Ticket({
              fieldCount: fields.length,
              fields
            })
          );
        }

        AvailableConfigs.deleteMany().then(result => {
          for (var i = 0; i < availableConfigStrings.length; ++i) {
            var dataType = "Invalid data"
            if (sampleConfigData[i] == "") {
              dataType = "Blank data"
            } else if (/^\d+$/.test(sampleConfigData[i])) {
              dataType = "Number"
            } else if (!/\d/.test(sampleConfigData[i])) {
              dataType = "Enumeration"
            }

            const newConfig = new AvailableConfigs({
              configurations: availableConfigStrings[i],
              inferredType: dataType
            });
            newConfig.save().catch(err => {
              console.log(err);
            });
          }
        });

        const newMajor = new Major({
          ticketCount: majorTickets.length,
          tickets: majorTickets
        });

        Major.deleteMany()
          .then(res => {
            newMajor.save().catch(err => {
              console.log(err);
            });
          })
          .catch(err => {
            console.log("Error deleting old major");
          });
      }
    }
  );
}

module.exports = syncLocalDatabase;