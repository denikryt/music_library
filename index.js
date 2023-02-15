const express = require("express");
const mongoose = require("mongoose");
const pathRouter = require("./router.js");
const exphbs = require("express-handlebars");
const path = require("path");
const bot = require("./bot.js");

const PORT = 5000; //process.env.PORT ||

const app = express();
const hbs = exphbs.create({
  defaultLayout: "main",
  extname: "hbs",
});

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", "views");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(pathRouter);

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
  bot.start();
});
