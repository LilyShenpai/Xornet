const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGODB_HOST, { useNewUrlParser: true, useUnifiedTopology: true });

const schema = new Schema(
  {
    at: { type: String, required: true },
    summary: { type: String },
    message: { type: Object },
    timestamp: { type: Number },
  },
  {
    versionKey: false,
  }
);

/**
 * @param {Object} [log] Log message
 */
schema.statics.add = async function (at, summary, message) {
  await new this({ at, summary, message: JSON.stringify(message), timestamp: Date.now() }).save();
};

module.exports = mongoose.model("Logs", schema);
