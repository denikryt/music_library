const { Schema, model, mongoose } = require("mongoose");

const trackSchema = new mongoose.Schema({
  url: { type: String, required: true },
  thumbnail: { type: String, required: true },
  type: { type: String, required: true},
  tag: { type: String },
  name: { type: String, default: "Unknown"  },
  album: { type: String },
  artist: { type: String },
},
  { collection: 'tracks' });

const userSchema = new mongoose.Schema({
  user_id: { type: Number, require: true },
  user_name: { type: String, require: true },
  last_message_id: { type: Number, require: true },
  channel_id: { type: Number },
});

module.exports = model("trackSchema", trackSchema);
