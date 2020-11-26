// "use strict";

// let Joi = require("@hapi/joi");
// let superagent = require("superagent");
// const fetch = require('node-fetch');

let superagent = require("superagent");
const fetch = require('node-fetch');
module.exports = app => {
/** 
   * Log in using github
   * handles traffics when user is being redirected back to our site
   * 
   */
  app.get("/v1/oauth/gitub/callback", async (req, res) => {
    console.log(req.query);

    //new user data
    let data = {};

    //get the access token from github
    await superagent.post('https://github.com/login/oauth/access_token')
    .send({
     client_id: "a7e0a05ca23c1d3edf21", 
     client_secret: "4eb6cbec323a7c03d804b5fd59f179429d8d1db2",
     code: req.query.code
    })
    .set('Accept', 'application/json')
    .then(result => {

      data = result.body;
      console.log("access token", data.access_token);

      //function to fetch user data form github using token
      const callMe = async (token) => {
      //Fetch user data w/ api
      let response= await fetch('https://api.github.com/user', {
       method: 'GET',
       headers: 
         {Authorization: 'token ' + token, 'User-Agent': 'Shuz98', Accept: 'application/json'}
     });

     let userInfo = await response.json();
     if(!userInfo.login){
       return res.status(404).send({error: 'user not found'});
     }
      
      //fetch user emails
      let emailResponse = await fetch('https://api.github.com/user/emails', {
       method: 'GET',
       headers: 
         {Authorization: 'token ' + token, 'User-Agent': 'Shuz98', Accept: 'application/json'}
     });

     let email = await emailResponse.json();
     let userEmail = '';
 
     //get user email
     try{
       userEmail = email[0].email;
     }catch(err){
       console.log(err);
       return res.statue(400).send({error:'error fetching user email'});
     }

     console.log(userEmail);

     //if the email address already exists, log that user in instead
     let checkEmail = await app.models.User.findOne({primary_email: userEmail});
     if (checkEmail != null){
       const username = checkEmail.username;
       console.log('log into existing user');

       req.session.regenerate(() => {
         req.session.user = checkEmail;
         console.log(`Session.login success: ${req.session.user.username}`);
         return res.redirect('/profile/' + username);
       });
      
     }

     //create new user to database
     
     else{

     // use user email to verify user
     let data = {username: userInfo.login + '_github', 
                 primary_email: userEmail, 
                 hash:'github', 
                 salt: 'github',
                 first_name: 'unknown',
                 last_name: 'unknown',
                 city: 'unknown',
                 };
     try{
       let newUser = new app.models.User(data);
       await newUser.save();

       req.session.regenerate(() => {
         req.session.user = newUser;
         console.log(`Session.login success: ${req.session.user.username}`);
         return res.redirect('/profile/' + userInfo.login + '_github');
       });

     } catch(err){
       console.log(err);
        return res.status(400).send({ error: "error saving github user to database" });
     }
   }
 };
   callMe(data.access_token);
      
    }).catch(err => {return res.status(404).send({error: 'invalid token'})});
  });


  /**
   * check if user is logged in using github
   */

 app.get('/v1/oauth/github/client', (req, res) => {
   console.log(req.session.user);

   if(req.session.user){ 
     return res.status(201).send(JSON.stringify(req.session.user))
   } else{
     const error = {error: 'not logged in'}
     return res.status(200).send(JSON.stringify(error))
   }
});




}