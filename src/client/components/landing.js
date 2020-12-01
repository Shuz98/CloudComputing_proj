/* Copyright G. Hemingway, @2020 - All rights reserved */
'use strict';

import React from 'react';
import styled from 'styled-components';
import {Sandbox} from './sandbox';

const LandingBase = styled.div`
  display: flex;
  width: 100%;
`;

export const Landing = () => (
  <LandingBase>
    <Sandbox />
  </LandingBase>
);
