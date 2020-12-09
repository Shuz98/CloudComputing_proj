"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/***************** Component Model *******************/


let Asset = new Schema({
  owner: { type: Schema.ObjectId, ref: "User", required: true },
  start: { type: Date },
  content: {type: String, default: ""}
});

Asset.pre("validate", function(next) {
  this.start = Date.now();
  next();
});

module.exports = mongoose.model("Asset", Asset);