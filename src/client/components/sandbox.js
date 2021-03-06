'use strict';

import React from "react";
import { useState } from "react";
import {
  LiveProvider,
  LiveEditor,
  LiveError,
  LivePreview
} from 'react-live'
import AceEditor from "react-ace";
import styled from 'styled-components';
import {
  ErrorMessage,
  FormBase,
  FormInput,
  FormLabel,
  FormButton,
  ModalNotify
} from './shared';

require("ace-builds/webpack-resolver");

const SandboxDiv = styled.div`
display: flex;
justifyContent: space-between;
`

const SubDiv = styled.div`
display: flex;
flex-direction: column;
`

// default code
const init_code = `
// edit this example
function Greet() {
  return <span>Hello World!</span>
}
`;

export const Sandbox = () => {
  const [code, changeCode] = useState(init_code);

  const onSubmit = async ev => {
    ev.preventDefault();
    // Only proceed if there are no errors
    if (error !== '') return;
    const res = await fetch('/v1/asset', {
      method: 'POST',
      body: JSON.stringify(code),
      credentials: 'include',
      headers: {
        'content-type': 'application/json'
      }
    });
    if (!res.ok) {
      const err = await res.json();
      console.log(err);
    }
  };

  return (<SandboxDiv>
    <SubDiv>
      <b>Edit your code here:</b>
      <AceEditor
        mode="javascript"
        theme="github"
        name="UNIQUE_ID_OF_DIV"
        onChange={(newValue) => { changeCode(newValue); }}
        defaultValue={init_code}
        style={{ width: 500 }}
      />
      <FormButton id="submitBtn" onClick={onSubmit}>
        Save
        </FormButton>
    </SubDiv>
    <SubDiv>
      <b>Code preview and live rendering:</b>
      <LiveProvider code={code} style={{ padding: 10, display: "flex", flexDirection: "row" }}>
        <LiveEditor style={{ fontSize: 14, backgroundColor: "black", padding: 30, width: 400 }} />
        <LiveError />
        <LivePreview style={{ padding: 30 }} />
      </LiveProvider>
    </SubDiv>
  </SandboxDiv>
  )
}