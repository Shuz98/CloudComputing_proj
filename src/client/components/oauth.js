import React, { useState, useEffect } from 'react';
import axios from 'axios';


export const OAuth = props => {
    //console.log(props.match.params.token);
    const token = props.match.params.token;
    let [state, setState] = useState({state: 'underfined'});
    let [email, setEmail] = useState([{email:''}]);

    const fetchInfo = token => {
    fetch(`/fetchGithub/${token}`)
    .then(res => res.json())
    .then(data => {
        setState(data);

    })
    .catch(err => console.log(err))

    };

    const fetchEmail = token => {
        fetch(`/fetchGithubEmail/${token}`)
    .then(res => res.json())
    .then(data => {
        setEmail(data);

    })
    .catch(err => console.log(err));
    }

    useEffect(() => {
        console.log('use effect');
        fetchInfo(token);
        fetchEmail(token)
    }, [props]);
    console.log(state);
    console.log(email[0].email);
  //  const newUser= {username: state.login + '@github', primary_email: email[0].email, password: ''}

    //register the user to database?
    // const res = fetch('/v1/user', {
    //     method: 'POST',
    //     body: JSON.stringify(newUser),
    //     credentials: 'include',
    //     headers: {
    //       'content-type': 'application/json'
    //     }
    //   })


    //redirect the user to profile page




    return <div>state</div>;
}