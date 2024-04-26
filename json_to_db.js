const mongoose = require("mongoose");
const fs = require("fs");
const DataBase = require("./database");
require('dotenv').config();

// Read the JSON file
fs.readFile("tracks.json", "utf8", async (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }
  const db = new DataBase('music')
  await db.connect();
  await db.dropCollection('tracks');

  try {
    const tracksData = JSON.parse(data);

    for (let element of tracksData) {
        console.log(element)
        await db.createNewTrack(element);
        console.log("Track saved:", element.name);
    }
    await db.close() // Close the connection after saving

  } catch (error) {
    console.error("Error parsing JSON or saving tracks:", error);
    await db.close(); // Close the connection in case of error
      }
    });