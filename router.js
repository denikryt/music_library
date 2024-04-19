const Router = require("express");
const Controller = require("./controller.js");
// const { botClass, bot } = require("./bot.js");

const router = new Router();

router.get("/", Controller.all_tracks);

router.get("/songs", Controller.songs_render);

router.get("/artists", Controller.artists_render);

router.get("/albums", Controller.albums_render);

router.get("/edit/:id", Controller.form_render);

router.post("/update/:id", Controller.update);

router.post("/delete/:id", Controller.deleteTrack);

router.post("/add/:url", Controller.createNewTrack);

router.get("/css/:filename", Controller.serveCSS);

router.get("/script/:filename", Controller.serveScripts);

// router.post(`/bot${bot.token}`, (req, res) => {
//   bot.processUpdate(req.body);
//   res.sendStatus(200);
// });

module.exports = router;