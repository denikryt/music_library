const TrackSchema = require("./models.js");
const mongoose = require("mongoose");
const path = require("path");
require('dotenv').config();

class DataBase {
    constructor(dbName) {
        this.db = null;
        this.url = process.env.MONGODB_URI;
        this.dbName = dbName;
    }

    async connect() {
        try { 
            mongoose.connect(this.url, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                dbName: this.dbName
            });
            console.log("Connected to MongoDB");
            this.db = mongoose.connection;
        } catch (error) {
            console.error("Failed to connect to MongoDB:", error);
            throw new Error("Failed to connect to database");
        }
    }

    async createNewTrack(data) {
        try {
            const track = new TrackSchema({
                url: data.url, 
                thumbnail: data.thumbnail,
                name: data.name,
                type: data.type,
            })
            await track.save();
        } catch (error) {
            console.log(error);
            res.send("Track didn't save");
        } 
    }

    async getAllTracks(collection) {
        console.log("GET ALL TRACKS");
        try {
            if (!this.db) {
                throw new Error("Database connection not established");
            }
            const tracks = await this.db.collection(collection).find({}).toArray();
            return tracks;
        } catch (error) {
            console.log(error);
            throw new Error("Failed to fetch tracks");
        }
    }

    async dropCollection(collection) {
        try {
            if (!this.db) {
                throw new Error("Database connection not established");
            }
            await this.db.collection(collection).drop();
            console.log("Collection dropped");
        } catch (error) {
            console.log(error);
            throw new Error("Failed to drop collection");
        }
    }

    async close() {
        try {
            if (!this.db) {
                throw new Error("Database connection not established");
            }
            await this.db.close();
            console.log("Connection closed");
        } catch (error) {
            console.log(error);
            throw new Error("Failed to close connection");
        }
    }
}

module.exports = DataBase;