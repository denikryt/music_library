const { Schema, model, mongoose } = require("mongoose");

const uri = "mongodb+srv://denchik:D3778228545dan@cluster0.ntwfb.mongodb.net/music?retryWrites=true&w=majority";

connect().catch((err) => console.log(err));

async function connect() {
  await mongoose.connect(uri);
}

const trackSchema = new mongoose.Schema({
  url: { type: String, required: true },
  thumbnail: { type: String, required: true },
  type: { type: String },
  tag: { type: String },
  name: { type: String },
  album: { type: String },
  artist: { type: String },
});

const userSchema = new mongoose.Schema({
  user_id: { type: Number, require: true },
  user_name: { type: String, require: true },
  last_message_id: { type: Number, require: true },
  channel_id: { type: Number },
});

// module.exports = {
//   userSchema,
//   trackSchema,
// };

module.exports = model("form", trackSchema);
