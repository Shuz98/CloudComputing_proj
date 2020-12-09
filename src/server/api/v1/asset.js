"use strict";

const Joi = require("@hapi/joi");
//const { filterGameForProfile } = require("../../solitaire");
const { validPassword } = require("../../../shared");

module.exports = app => {
    /**
   * Create a new game
   *
   * @param {req.body.content} content of the component in string
   * @return {201 with { id: ID of new asset }}
   */
  app.post("/v1/asset", async (req, res) => {
    if (!req.session.user) {
      res.status(401).send({ error: "unauthorized" });
    } else {
      let data;
      try {
        // Validate user input
        let schema = Joi.object().keys({
          content: Joi.string().required(),
        });
        data = await schema.validateAsync(req.body);
      } catch (err) {
        const message = err.details[0].message;
        console.log(`Game.create validation failure: ${message}`);
        return res.status(400).send({ error: message });
      }

      // Set up the new game
      try {
        let newAsset = {
          owner: req.session.user._id,
          content: data.content,
          start: Date.now(),
        };
        let game = new app.models.Game(newAsset);
        await game.save();
        const query = { $push: { games: game._id } };
        // Save game to user's document too
        await app.models.User.findByIdAndUpdate(req.session.user._id, query);
        res.status(201).send({ id: game._id });
      } catch (err) {
        console.log(`Asset.create save failure: ${err}`);
        res.status(400).send({ error: "failure creating asset" });
        // Much more error management needs to happen here
      }
    }
  });
};
