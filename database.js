const TrackSchema = require("./models.js");
const mongoose = require("mongoose");
const path = require("path");

class DataBase {
    async createNewTrack(data) {

        try {
            for (let element in data) {
                const track = new TrackSchema({
                    url: element.url, 
                    thumbnail: element.thumbnail,
                    name: element.name,
                    type: element.type,
                })
                await track.save();
            };
            
        } catch (error) {
            console.log(error);
            res.send("Track didn't save");
        } 
    }
}

