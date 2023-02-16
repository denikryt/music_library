const Tracks = require("./models.js");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
const youtube = require("youtube-metadata-from-url");

class formController {
  constructor() {
    this.createNewTrack = this.createNewTrack.bind(this);
  }
  async default_render(req, res) {
    try {
      const tracks = await Tracks.find({}).sort({ name: 1 }).lean();
      console.log("TRACKS" + tracks);

      res.render("default_view", {
        title: "Audio",
        isAdd: true,
        tracks,
      });
    } catch (e) {}
  }

  async list_render(req, res) {
    try {
      const tracks = await Tracks.find({}).sort({ name: 1 }).lean();
      // console.log("TRACKS" + tracks);

      res.render("list_view", {
        title: "Audio",
        isAdd: true,
        tracks,
      });
    } catch (e) {}
  }

  async songs_render(req, res) {
    try {
      const tracks = await Tracks.find({
        type: { $in: ["track", "Track"] },
      })
        .sort({ name: 1 })
        .lean();
      // console.log('TRACKS'+t)
      // const image = get_youtube_thumbnail(tracks.url, 'max')
      console.log("TRACKS ", tracks);

      res.render("list_view", {
        title: "Audio",
        isAdd: true,
        tracks,
      });
    } catch (e) {
      console.log(e);
    }
  }

  async artists_render(req, res) {
    try {
      let artists = await Tracks.distinct("artist");
      artists = artists.filter((artist) => artist !== "");
      artists.sort();

      console.log("ARTISTS ", artists);
      // return;

      res.render("artists_view", {
        title: "Audio",
        isAdd: true,
        artists,
      });
    } catch (e) {
      console.log(e);
    }
  }

  async albums_render(req, res) {
    try {
      const tracks = await Tracks.find({
        type: { $in: ["album", "Album"] },
      })
        .sort({ name: 1 })
        .lean();
      console.log("ALBUMS TRACKS", tracks);

      res.render("albums_view", {
        title: "Audio",
        isAdd: true,
        tracks,
      });
    } catch (e) {
      console.log(e);
    }
  }

  async form_render(req, res) {
    console.log("REQ", req);
    try {
      const id = req.params.id;
      // console.log("id before conversion: ", id);
      const objectId = mongoose.Types.ObjectId(id);
      // console.log("objectId after conversion: ", objectId);
      const element = await Tracks.findById(objectId);

      res.render("form_view", {
        _id: element._id,
        url: element.url,
        thumbnail: element.thumbnail,
        type: element.type,
        tag: element.tag,
        artist: element.artist,
        album: element.album,
        name: element.name,
      });
      return;
    } catch (e) {
      console.log(e);
    }
  }

  async update(req, res) {
    try {
      console.log("UPDATEING" + req.body.type);
      let element = req.body;
      const { id } = req.params;

      await Tracks.findByIdAndUpdate(id, {
        url: element.url,
        type: element.type,
        tag: element.tag,
        artist: element.artist,
        album: element.album,
        name: element.name,
      });
      res.redirect("/");
    } catch (e) {
      console.log(e);
    }
  }

  async deleteTrack(req, res) {
    const { id } = req.params;

    await Tracks.findByIdAndDelete(id);
    console.log("DELETED");
    res.redirect("/");
  }

  async createNewTrack(req, res) {
    const encodedUrl = req.params.url;
    const url = decodeURIComponent(encodedUrl);
    let savedTrackID;
    try {
      const { thumbnail, name, type } = await this.scrapeData(url);

      const track = new Tracks({
        url: url,
        thumbnail: thumbnail,
        name: name,
        type: type,
      });

      const savedTrack = await track.save();
      savedTrackID = savedTrack._id.toString();
      console.log("savedTrackID", savedTrackID);
      res.send(savedTrack);
    } catch (error) {
      console.log(error);
      res.send("Track didn't save");
    } //finally {
    //res.redirect(`/update/${savedTrackID}`);
    //}
  }

  async scrapeData(url) {
    const youtubeLink = /^(https?:\/\/)?(www\.)?(youtube\.com\/|youtu\.be\/)/;
    const youtubeVideoLink =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/;
    const youtubePlaylistLink =
      /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=/;

    if (youtubeLink.test(url)) {
      if (youtubeVideoLink.test(url)) {
        const browser = await puppeteer.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();

        try {
          // Navigate to the YouTube page
          await page.goto(url, { waitUntil: "load", timeout: 0 });

          // Scrape data from /html/head/link[28]
          const linkElement = await page.$('link[rel="image_src"]');

          // Extract the href attribute value from the <link> tag
          const thumbnail = await linkElement.evaluate((element) =>
            element.getAttribute("href")
          );

          console.log("Thumbnail", thumbnail);

          // Scrape data from /html/head/title
          const titleElement = await page.$('meta[name="title"]');
          const titleText = await titleElement.getProperty("content");
          const name = await titleText.jsonValue();

          console.log("Video name:", name);

          // Wait for the video player to be ready
          await page.waitForSelector(
            ".html5-video-player:not(.ad-showing) video"
          );

          // Get the duration text element
          const durationElement = await page.$(
            ".html5-video-player:not(.ad-showing) .ytp-time-duration"
          );

          // Extract the duration text and convert it to seconds
          const durationText = await page.evaluate(
            (element) => element.textContent,
            durationElement
          );

          console.log(`The video is ${durationText} seconds long`);

          // Parse the time in timeText into a Date object
          const timeParts = durationText.split(":");
          const time = new Date(0, 0, 0, 0, timeParts[0], timeParts[1]);

          // Compare the time to 15:00
          const cutoffTime = new Date(0, 0, 0, 15, 0);
          const isTrack = time <= cutoffTime;

          const type = isTrack ? "track" : "album";
          console.log(type);

          return { thumbnail, name, type };
        } catch (error) {
          console.log(error);
        } finally {
          await browser.close();
        }
      }

      if (youtubePlaylistLink.test(url)) {
        console.log(await youtube.metadata(url));
        var name = (await youtube.metadata(url)).title;
        var thumbnail = (await youtube.metadata(url)).thumbnail_url;
        var type = "album";
        return { thumbnail, name, type };
      }
    } else {
      error("NOT A YOUTUBE LINK");
    }
  }

  async serveCSS(req, res) {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "public", filename);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      res.setHeader("Content-Type", "text/css");
      res.send(data.toString("utf-8"));
    });
  }

  async serveScripts(req, res) {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "scripts", filename);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      res.setHeader("Content-Type", "text/javascript");
      res.send(data.toString("utf-8"));
    });
  }
}

module.exports = new formController();
