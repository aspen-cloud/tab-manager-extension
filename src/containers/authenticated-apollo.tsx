import {
  ApolloClient,
  ApolloProvider,
  createHttpLink,
  InMemoryCache,
} from '@apollo/client';
import { setContext } from '@apollo/link-context';
import React from 'react';

import { useAuth0 } from '@auth0/auth0-react';

const AuthorizedApolloProvider = ({ children }) => {
  const { getIdTokenClaims } = useAuth0();

  const httpLink = createHttpLink({
    uri: 'https://premium-goose-83.hasura.app/v1/graphql',
  });

  const authLink = setContext(async () => {
    const idClaims = await getIdTokenClaims();
    const token = idClaims.__raw;
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  });

  const apolloClient = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    connectToDevTools: true,
  });

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
};

export default AuthorizedApolloProvider;
