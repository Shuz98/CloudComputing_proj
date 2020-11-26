/* Copyright G. Hemingway, 2020 - All rights reserved */
"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const CardState = require("./card_state");

/***************** Move Model *******************/

/* Schema for an individual move of Klondike */
let Move = new Schema(
  {
    user: { type: Schema.ObjectId, ref: "User", required: true, index: true },
    game: { type: Schema.ObjectId, ref: "Game", required: true, index: true },
    cards: { type: [CardState]},
    src: { type: String, required: true },
    dst: { type: String, required: true  },
    date: { type: Date, required: true }
  },
);

module.exports = mongoose.model("Move", Move);
