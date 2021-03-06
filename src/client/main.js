'use strict';

import React, { useState, useEffect } from 'react';
import { render } from 'react-dom';
import styled from 'styled-components';
import { BrowserRouter, Route, Redirect } from 'react-router-dom';

import { Header } from './components/header';
import { Landing } from './components/landing';
import { Login } from './components/login';
import { Logout } from './components/logout';
import { Register } from './components/register';
import { Profile } from './components/profile';

const defaultUser = {
  username: '',
  first_name: '',
  last_name: '',
  primary_email: '',
  city: '',
  games: []
};

const GridBase = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto;
  grid-template-areas:
    'hd'
    'main'
    'ft';

  @media (min-width: 500px) {
    grid-template-columns: 40px 50px 1fr 50px 40px;
    grid-template-rows: auto auto auto;
    grid-template-areas:
      'hd hd hd hd hd'
      'sb sb main main main'
      'ft ft ft ft ft';
  }
`;

const MyApp = () => {
  // If the user has logged in, grab info from sessionStorage
  const data = localStorage.getItem('user');
  let [state, setState] = useState(data ? JSON.parse(data) : defaultUser);
  console.log(`Starting as user: ${state.username}`);

  const loggedIn = () => {
    return state.username && state.primary_email;
  };

  const logIn = async username => {
    try {
      const response = await fetch(`/v1/user/${username}`);
      const user = await response.json();
      localStorage.setItem('user', JSON.stringify(user));
      setState(user);
    } catch (err) {
      alert('An unexpected error occurred.');
      logOut();
    }
  };

  const logOut = () => {
    // Wipe localStorage
    localStorage.removeItem('user');
    // Reset user state
    setState(defaultUser);
  };

  const fetchLoggedState = () => {
    fetch('/v1/oauth/github/client')
    .then(response => response.json())
    .then(
      res => {
        //console.log(res);
        if(res.username){
          setState(res)
        }
        })
    .catch(err => {
      console.log('not logged in');
    })
  }

  useEffect(() => {
    fetchLoggedState();
    console.log('done')
}, []);


  return (
    <BrowserRouter>
      <GridBase>
        <Header user={state.username} email={state.primary_email} />
        <Route exact path="/" component={Landing} />
        <Route
          path="/login"
          render={p =>
            loggedIn() ? (
              <Redirect to={`/profile/${state.username}`} />
            ) : (
              <Login {...p} logIn={logIn} />
            )
          }
        />
        <Route path="/logout" render={p => <Logout {...p} logOut={logOut} />} />
        <Route
          path="/register"
          render={p => {
            return loggedIn() ? (
              <Redirect to={`/profile/${state.username}`} />
            ) : (
              <Register {...p} />
            );
          }}
        />
        <Route
          path="/profile/:username"
          render={p => <Profile {...p} currentUser={state.username} />}
        />
      </GridBase>
    </BrowserRouter>
  );
};

render(<MyApp />, document.getElementById('mainDiv'));
