import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.VITE_USER_POOL_ID || '',
      userPoolClientId: process.env.VITE_USER_POOL_CLIENT_ID || '',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      },
    },
  },
  API: {
    GraphQL: {
      endpoint: process.env.VITE_GRAPHQL_ENDPOINT || '',
      region: process.env.VITE_AWS_REGION || 'us-east-1',
      defaultAuthMode: 'userPool',
    },
  },
};

Amplify.configure(amplifyConfig);

export default amplifyConfig;
