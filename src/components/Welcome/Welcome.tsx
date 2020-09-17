import React from 'react';

import logo from 'images/logo.png';

import './Welcome.scss';
import { isFirefox } from 'utils/platform';

function Welcome() {
  return (
    <div className="Welcome container-fluid my-5">
      <Logo />
      <h1 className="text-center mb-5">
        Welcome to the {isFirefox ? 'Firefox' : 'Chrome'} tab manager.
      </h1>
      <h3 className="text-center">
        Created by the team at <a href="https://www.aspen.cloud">Aspen Cloud</a>
      </h3>
      <p></p>
    </div>
  );
}

function Logo() {
  return (
    <img src={logo} alt="logo" width="64px" className="d-block mx-auto mb-4" />
  );
}

export default Welcome;
