const mongoose = require("mongoose");
const fs = require("fs");
const DataBase = require("./database");
require('dotenv').config();

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'music' // Set your desired database name here
  };

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, options)
  .then(() => {
    console.log("Connected to MongoDB");
    // Read the JSON file
    
    fs.readFile("tracks.json", "utf8", async (err, data) => {
      if (err) {
        console.error("Error reading file:", err);
        return;
      }

      try {

        const tracksData = JSON.parse(data);
        const db = new DataBase();
        for (let element of tracksData) {
            console.log(element)
            await db.createNewTrack(element);
            console.log("Track saved:", element.name);
        }
        mongoose.connection.close(); // Close the connection after saving

      } catch (error) {
        console.error("Error parsing JSON or saving tracks:", error);
        mongoose.connection.close(); // Close the connection in case of error
      }
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
