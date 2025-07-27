import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as verifiedpermissions from 'aws-cdk-lib/aws-verifiedpermissions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface AppSyncStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  policyStore: verifiedpermissions.CfnPolicyStore;
}

export class AppSyncStack extends cdk.Stack {
  public readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: AppSyncStackProps) {
    super(scope, id, props);

    this.api = new appsync.GraphqlApi(this, 'Api', {
      name: 'rbac-api',
      schema: appsync.SchemaFile.fromAsset('./lib/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: props.userPool,
          },
        },
      },
    });

    // Lambda para autorización con AVP
    const authorizerFunction = new lambda.Function(this, 'AuthorizerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { VerifiedPermissionsClient, IsAuthorizedCommand } = require('@aws-sdk/client-verifiedpermissions');

        exports.handler = async (event) => {
          const client = new VerifiedPermissionsClient({ region: process.env.AWS_REGION });

          const command = new IsAuthorizedCommand({
            policyStoreId: process.env.POLICY_STORE_ID,
            principal: {
              entityType: 'User',
              entityId: event.identity.sub
            },
            action: {
              actionType: event.info.fieldName,
              actionId: event.info.fieldName
            },
            resource: {
              entityType: 'Resource',
              entityId: event.arguments.resourceId || 'default'
            }
          });

          const response = await client.send(command);

          if (response.decision !== 'ALLOW') {
            throw new Error('Unauthorized');
          }

          return event.arguments;
        };
      `),
      environment: {
        POLICY_STORE_ID: props.policyStore.attrPolicyStoreId,
      },
    });

    authorizerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['verifiedpermissions:IsAuthorized'],
      resources: [props.policyStore.attrPolicyStoreArn],
    }));

    const authorizerDataSource = this.api.addLambdaDataSource('AuthorizerDataSource', authorizerFunction);

    // Resolvers
    authorizerDataSource.createResolver('GetUserResolver', {
      typeName: 'Query',
      fieldName: 'getUser',
    });

    authorizerDataSource.createResolver('UpdateUserResolver', {
      typeName: 'Mutation',
      fieldName: 'updateUser',
    });

    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: this.api.graphqlUrl,
      exportName: 'GraphQLAPIURL',
    });

    new cdk.CfnOutput(this, 'GraphQLAPIKey', {
      value: this.api.apiKey || '',
      exportName: 'GraphQLAPIKey',
    });
  }
}
