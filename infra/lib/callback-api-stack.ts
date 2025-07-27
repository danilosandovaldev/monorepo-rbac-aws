import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface CallbackApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  applicationsTable: dynamodb.Table;
  userGroupsTable: dynamodb.Table;
  groupPermissionsTable: dynamodb.Table;
}

export class CallbackApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: CallbackApiStackProps) {
    super(scope, id, props);

    // Lambda para manejar callbacks
    const callbackHandler = new lambda.Function(this, 'CallbackHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const jwt = require('jsonwebtoken');
        const jwksClient = require('jwks-rsa');
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        
        const client = jwksClient({
          jwksUri: \`https://cognito-idp.\${process.env.AWS_REGION}.amazonaws.com/\${process.env.USER_POOL_ID}/.well-known/jwks.json\`
        });
        
        function getKey(header, callback) {
          client.getSigningKey(header.kid, (err, key) => {
            const signingKey = key.publicKey || key.rsaPublicKey;
            callback(null, signingKey);
          });
        }
        
        async function getAppIdFromRedirectUri(redirectUri) {
          const result = await dynamodb.scan({
            TableName: process.env.APPLICATIONS_TABLE,
            FilterExpression: 'contains(callbackUrls, :uri)',
            ExpressionAttributeValues: { ':uri': redirectUri }
          }).promise();
          
          return result.Items?.[0]?.appId || 'default';
        }
        
        async function getUserGroupAndPermissions(userId, appId) {
          // Obtener grupo del usuario para la aplicación
          const userGroup = await dynamodb.get({
            TableName: process.env.USER_GROUPS_TABLE,
            Key: { userId, appId }
          }).promise();
          
          const groupId = userGroup.Item?.groupId || 'default';
          
          // Obtener permisos del grupo
          const groupPermissions = await dynamodb.get({
            TableName: process.env.GROUP_PERMISSIONS_TABLE,
            Key: { appId, groupId }
          }).promise();
          
          return {
            groupId,
            permissions: groupPermissions.Item?.permissions || []
          };
        }
        
        exports.handler = async (event) => {
          const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
          };
          
          if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
          }
          
          try {
            const { code, state, redirect_uri } = event.queryStringParameters || {};
            
            if (!code) {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing authorization code' })
              };
            }
            
            // Identificar aplicación por redirect_uri
            const appId = await getAppIdFromRedirectUri(redirect_uri);
            
            // Intercambiar código por tokens
            const tokenResponse = await fetch(\`https://\${process.env.COGNITO_DOMAIN}.auth.\${process.env.AWS_REGION}.amazoncognito.com/oauth2/token\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: process.env.USER_POOL_CLIENT_ID,
                code,
                redirect_uri: redirect_uri || 'http://localhost:3000/callback'
              })
            });
            
            const tokens = await tokenResponse.json();
            
            if (!tokens.access_token) {
              throw new Error('Failed to get tokens');
            }
            
            // Verificar y decodificar JWT
            const decoded = await new Promise((resolve, reject) => {
              jwt.verify(tokens.id_token, getKey, {
                audience: process.env.USER_POOL_CLIENT_ID,
                issuer: \`https://cognito-idp.\${process.env.AWS_REGION}.amazonaws.com/\${process.env.USER_POOL_ID}\`
              }, (err, decoded) => {
                if (err) reject(err);
                else resolve(decoded);
              });
            });
            
            // Obtener grupo y permisos del usuario para esta aplicación
            const { groupId, permissions } = await getUserGroupAndPermissions(decoded.sub, appId);
            
            const userData = {
              id: decoded.sub,
              email: decoded.email,
              name: decoded.name,
              appId,
              groupId,
              permissions
            };
            
            // Callback a la aplicación externa
            if (redirect_uri && redirect_uri !== 'http://localhost:3000/callback') {
              const callbackUrl = new URL(redirect_uri);
              callbackUrl.searchParams.set('token', tokens.access_token);
              callbackUrl.searchParams.set('id_token', tokens.id_token);
              callbackUrl.searchParams.set('user_data', JSON.stringify(userData));
              if (state) callbackUrl.searchParams.set('state', state);
              
              return {
                statusCode: 302,
                headers: { ...headers, Location: callbackUrl.toString() },
                body: ''
              };
            }
            
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                access_token: tokens.access_token,
                id_token: tokens.id_token,
                user: userData
              })
            };
            
          } catch (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: error.message })
            };
          }
        };
      `),
      environment: {
        USER_POOL_ID: props.userPool.userPoolId,
        USER_POOL_CLIENT_ID: '', // Se configurará después
        COGNITO_DOMAIN: 'rbac-auth-service',
        APPLICATIONS_TABLE: props.applicationsTable.tableName,
        USER_GROUPS_TABLE: props.userGroupsTable.tableName,
        GROUP_PERMISSIONS_TABLE: props.groupPermissionsTable.tableName,
      },
    });

    callbackHandler.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['cognito-idp:*'],
      resources: [props.userPool.userPoolArn],
    }));

    callbackHandler.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:GetItem', 'dynamodb:Scan'],
      resources: [
        props.applicationsTable.tableArn,
        props.userGroupsTable.tableArn,
        props.groupPermissionsTable.tableArn,
      ],
    }));

    // API Gateway
    this.api = new apigateway.RestApi(this, 'CallbackApi', {
      restApiName: 'RBAC Callback Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const callbackResource = this.api.root.addResource('callback');
    callbackResource.addMethod('GET', new apigateway.LambdaIntegration(callbackHandler));
    callbackResource.addMethod('POST', new apigateway.LambdaIntegration(callbackHandler));

    // Lambda para verificar tokens
    const verifyHandler = new lambda.Function(this, 'VerifyHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const jwt = require('jsonwebtoken');
        const jwksClient = require('jwks-rsa');
        
        const client = jwksClient({
          jwksUri: \`https://cognito-idp.\${process.env.AWS_REGION}.amazonaws.com/\${process.env.USER_POOL_ID}/.well-known/jwks.json\`
        });
        
        function getKey(header, callback) {
          client.getSigningKey(header.kid, (err, key) => {
            const signingKey = key.publicKey || key.rsaPublicKey;
            callback(null, signingKey);
          });
        }
        
        exports.handler = async (event) => {
          const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-App-Id',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
          };
          
          if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
          }
          
          try {
            const authHeader = event.headers.Authorization || event.headers.authorization;
            const appId = event.headers['X-App-Id'] || event.headers['x-app-id'] || 'default';
            
            if (!authHeader) {
              return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Missing Authorization header' })
              };
            }
            
            const token = authHeader.replace('Bearer ', '');
            
            const decoded = await new Promise((resolve, reject) => {
              jwt.verify(token, getKey, {
                audience: process.env.USER_POOL_CLIENT_ID,
                issuer: \`https://cognito-idp.\${process.env.AWS_REGION}.amazonaws.com/\${process.env.USER_POOL_ID}\`
              }, (err, decoded) => {
                if (err) reject(err);
                else resolve(decoded);
              });
            });
            
            // Obtener grupo y permisos del usuario para esta aplicación
            const { groupId, permissions } = await getUserGroupAndPermissions(decoded.sub, appId);
            
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                valid: true,
                user: {
                  id: decoded.sub,
                  email: decoded.email,
                  name: decoded.name,
                  appId,
                  groupId,
                  permissions
                }
              })
            };
            
          } catch (error) {
            return {
              statusCode: 401,
              headers,
              body: JSON.stringify({ valid: false, error: error.message })
            };
          }
        };
      `),
      environment: {
        USER_POOL_ID: props.userPool.userPoolId,
        USER_POOL_CLIENT_ID: '', // Se configurará después
        APPLICATIONS_TABLE: props.applicationsTable.tableName,
        USER_GROUPS_TABLE: props.userGroupsTable.tableName,
        GROUP_PERMISSIONS_TABLE: props.groupPermissionsTable.tableName,
      },
    });

    verifyHandler.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:GetItem'],
      resources: [
        props.userGroupsTable.tableArn,
        props.groupPermissionsTable.tableArn,
      ],
    }));

    const verifyResource = this.api.root.addResource('verify');
    verifyResource.addMethod('POST', new apigateway.LambdaIntegration(verifyHandler));

    new cdk.CfnOutput(this, 'CallbackApiUrl', {
      value: this.api.url,
      exportName: 'CallbackApiUrl',
    });
  }
}