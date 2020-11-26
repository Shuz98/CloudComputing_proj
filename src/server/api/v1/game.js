/* Copyright G. Hemingway, 2020 - All rights reserved */
"use strict";

const Joi = require("@hapi/joi");
const {
  initialState,
  shuffleCards,
  filterGameForProfile,
  filterMoveForResults,
  validateMove
} = require("../../solitaire");

module.exports = app => {
  /**
   * Create a new game
   *
   * @param {req.body.game} Type of game to be played
   * @param {req.body.color} Color of cards
   * @param {req.body.draw} Number of cards to draw
   * @return {201 with { id: ID of new game }}
   */
  app.post("/v1/game", async (req, res) => {
    if (!req.session.user) {
      res.status(401).send({ error: "unauthorized" });
    } else {
      let data;
      try {
        // Validate user input
        let schema = Joi.object().keys({
          game: Joi.string()
            .lowercase()
            .required(),
          color: Joi.string()
            .lowercase()
            .required(),
          draw: Joi.any()
        });
        data = await schema.validateAsync(req.body);
      } catch (err) {
        const message = err.details[0].message;
        console.log(`Game.create validation failure: ${message}`);
        return res.status(400).send({ error: message });
      }

      // Set up the new game
      try {
        let newGame = {
          owner: req.session.user._id,
          active: true,
          cards_remaining: 52,
          color: data.color,
          game: data.game,
          score: 0,
          start: Date.now(),
          winner: "",
          state: []
        };
        switch (data.draw) {
          case "Draw 1":
            newGame.drawCount = 1;
            break;
          case "Draw 3":
            newGame.drawCount = 3;
            break;
          default:
            newGame.drawCount = 1;
        }
        // Generate a new initial game state
        newGame.state = initialState();
        let game = new app.models.Game(newGame);
        await game.save();
        const query = { $push: { games: game._id } };
        // Save game to user's document too
        await app.models.User.findByIdAndUpdate(req.session.user._id, query);
        res.status(201).send({ id: game._id });
      } catch (err) {
        console.log(`Game.create save failure: ${err}`);
        res.status(400).send({ error: "failure creating game" });
        // Much more error management needs to happen here
      }
    }
  });

  /**
   * Fetch game information
   *
   * @param (req.params.id} Id of game to fetch
   * @return {200} Game information
   */
  app.get("/v1/game/:id", async (req, res) => {
    try {
      let game = await app.models.Game.findById(req.params.id);
      let user = await app.models.User.findById(game.owner);
      if (!game) {
        res.status(404).send({ error: `unknown game: ${req.params.id}` });
      } else {
        const state = game.state.toJSON();
        if(state.stack1.length == 13 &&
          state.stack2.length == 13 &&
          state.stack3.length == 13 &&
          state.stack4.length == 13){
            game.active = false;
            game.won = true;
          }
          await game.save();
        let results = filterGameForProfile(game);
        results.start = Date.parse(results.start);
        results.cards_remaining =
          52 -
          (state.stack1.length +
            state.stack2.length +
            state.stack3.length +
            state.stack4.length);
        // Do we need to grab the moves
        if (req.query.moves == "moves") {
          const moves = await app.models.Move.find({ game: req.params.id });
          state.moves = moves.map(move => filterMoveForResults(move, user.username));
        }
        
        res.status(200).send(Object.assign({}, results, state));
      }
    } catch (err) {
      console.log(`Game.get failure: ${err}`);
      res.status(404).send({ error: `unknown game: ${req.params.id}` });
    }
  });

  const isUp = (card, state) => {
    let card_suit = card.slice(0, card.indexOf(':'));
    let card_value = card.slice(card.indexOf(':') + 1);
    
    Object.keys(state).forEach( key => {
      if (state[key].suit == card_suit && state[key].value == card_value){
        return state[key].up;
      }

    });
    return {error: "card not found"};
  }

  app.put("/v1/game/:gameID",async (req, res) => {
    //query game from database
    let query = await app.models.Game.findById(req.params.gameID);
    let user = await app.models.User.findById(query.owner);
    let state = query.state.toJSON();
    let drawCount = query.drawCount;

    
    //special case when need to shuffle all cards in waste back to draw
    if(!req.session.user || req.session.user.username != user.username){
      return res.status(401).send({error: 'unauthorized'});
    }
    if(req.body.card == 'all:cards'){
      if(state.discard.length != 0){
      while (state.discard.length != 0){
        let card_top = state.discard.pop();
        card_top.up = false;
        state.draw.push(card_top);
      }
      let move = {cards: state.discard, src: 'discard', dst: 'draw', date: Date.now()};
      move.game = query._id;
      move.user = query.owner;
      let newMove = new app.models.Move(move);
      await newMove.save();
      query.state = state;
      query.score -= 100;
      await query.save();
    }
      
      
      return res.status(200).send(state);
    }

    //check if card is faced up
    if (!isUp(req.body.card, state) && req.src != 'draw'){
      return res.status(400).send({error: "card is faced down"});
    }
    //update database
    //if user wins, return message
    const validation = validateMove(state, req.body, drawCount);
    if (validation.error){
      return res.status(400).send({error: validation.error});
    } else {
      let state = validation.state;
      query.state = state;
      query.score += validation.score;
      let move = validation.move;
      move.game = query._id;
      move.user = query.owner;
      move.date = Date.now();
      //move.date = Date.now();

      let newMove = new app.models.Move(move);
      await newMove.save();
      query.moves.push(newMove._id);
      
      if (state.stack1.length == 13 &&
        state.stack2.length == 13 &&
        state.stack3.length == 13 &&
        state.stack4.length == 13 ){
          console.log('game finished');
          query.active = false;
          query.won = true;
          query.end = Date.now();
        }
      await query.save();
      return res.status(200).send(state);
    }



  });

  // Provide end-point to request shuffled deck of cards and initial state - for testing
  app.get("/v1/cards/shuffle", (req, res) => {
    res.send(shuffleCards(false));
  });
  app.get("/v1/cards/initial", (req, res) => {
    res.send(initialState());
  });
};
