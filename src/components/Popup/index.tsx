import React from 'react';
import ReactDOM from 'react-dom';
import Popup from './Popup';
import { Auth0Provider } from '@auth0/auth0-react';
import AuthorizedApolloProvider from 'containers/authenticated-apollo';

const MainPopup = (
  <Auth0Provider
    domain="dev-w6qnlsfp.us.auth0.com"
    clientId="zyAf7AhcvedQdRD1U6B5pYaAwfukm4YO"
    redirectUri={window.location.origin + '/welcome.html'}
  >
    <AuthorizedApolloProvider>
      <Popup />
    </AuthorizedApolloProvider>
  </Auth0Provider>
);

ReactDOM.render(MainPopup, document.getElementById('root'));
