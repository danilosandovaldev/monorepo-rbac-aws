import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'rbac-user-pool',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: true, mutable: true },
        familyName: { required: true, mutable: true },
      },
      customAttributes: {
        role: new cognito.StringAttribute({ minLen: 1, maxLen: 50, mutable: true }),
        permissions: new cognito.StringAttribute({ minLen: 1, maxLen: 500, mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      generateSecret: false,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          'http://localhost:3000/callback',
          'https://your-app.com/callback',
          'https://external-app.com/auth/callback'
        ],
        logoutUrls: [
          'http://localhost:3000/logout',
          'https://your-app.com/logout',
          'https://external-app.com/auth/logout'
        ],
      },
    });

    // Dominio personalizado para Cognito
    const domain = this.userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: 'rbac-auth-service',
      },
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      exportName: 'UserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      exportName: 'UserPoolClientId',
    });

    new cdk.CfnOutput(this, 'CognitoDomainUrl', {
      value: domain.domainName,
      exportName: 'CognitoDomainUrl',
    });

    new cdk.CfnOutput(this, 'AuthUrl', {
      value: `https://${domain.domainName}.auth.${this.region}.amazoncognito.com`,
      exportName: 'AuthUrl',
    });
  }
}