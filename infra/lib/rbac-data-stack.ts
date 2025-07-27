import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class RBACDataStack extends cdk.Stack {
  public readonly applicationsTable: dynamodb.Table;
  public readonly userGroupsTable: dynamodb.Table;
  public readonly groupPermissionsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tabla de aplicaciones registradas
    this.applicationsTable = new dynamodb.Table(this, 'ApplicationsTable', {
      tableName: 'rbac-applications',
      partitionKey: { name: 'appId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Tabla de grupos de usuarios por aplicación
    this.userGroupsTable = new dynamodb.Table(this, 'UserGroupsTable', {
      tableName: 'rbac-user-groups',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'appId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Tabla de permisos por grupo y aplicación
    this.groupPermissionsTable = new dynamodb.Table(this, 'GroupPermissionsTable', {
      tableName: 'rbac-group-permissions',
      partitionKey: { name: 'appId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'groupId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Datos iniciales
    new cdk.CustomResource(this, 'InitialData', {
      serviceToken: this.createInitDataProvider().serviceToken,
    });

    new cdk.CfnOutput(this, 'ApplicationsTableName', {
      value: this.applicationsTable.tableName,
      exportName: 'ApplicationsTableName',
    });
  }

  private createInitDataProvider() {
    const lambda = new cdk.aws_lambda.Function(this, 'InitDataFunction', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: cdk.aws_lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        
        exports.handler = async (event) => {
          if (event.RequestType === 'Create') {
            // Aplicaciones de ejemplo
            await dynamodb.put({
              TableName: '${this.applicationsTable.tableName}',
              Item: {
                appId: 'app1',
                name: 'E-commerce App',
                description: 'Aplicación de comercio electrónico',
                callbackUrls: ['https://ecommerce.com/callback'],
                createdAt: new Date().toISOString()
              }
            }).promise();
            
            await dynamodb.put({
              TableName: '${this.applicationsTable.tableName}',
              Item: {
                appId: 'app2',
                name: 'Admin Dashboard',
                description: 'Panel de administración',
                callbackUrls: ['https://admin.com/callback'],
                createdAt: new Date().toISOString()
              }
            }).promise();
            
            // Permisos por aplicación
            await dynamodb.put({
              TableName: '${this.groupPermissionsTable.tableName}',
              Item: {
                appId: 'app1',
                groupId: 'customers',
                permissions: ['read:products', 'create:orders', 'read:orders']
              }
            }).promise();
            
            await dynamodb.put({
              TableName: '${this.groupPermissionsTable.tableName}',
              Item: {
                appId: 'app1',
                groupId: 'admins',
                permissions: ['read:products', 'write:products', 'read:orders', 'write:orders', 'read:users']
              }
            }).promise();
            
            await dynamodb.put({
              TableName: '${this.groupPermissionsTable.tableName}',
              Item: {
                appId: 'app2',
                groupId: 'operators',
                permissions: ['read:dashboard', 'read:reports']
              }
            }).promise();
            
            await dynamodb.put({
              TableName: '${this.groupPermissionsTable.tableName}',
              Item: {
                appId: 'app2',
                groupId: 'admins',
                permissions: ['read:dashboard', 'write:dashboard', 'read:reports', 'write:reports', 'manage:users']
              }
            }).promise();
          }
          
          return { PhysicalResourceId: 'init-data' };
        };
      `),
    });

    lambda.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: ['dynamodb:PutItem'],
      resources: [
        this.applicationsTable.tableArn,
        this.groupPermissionsTable.tableArn,
      ],
    }));

    return new cdk.aws_cloudformation.Provider(this, 'InitDataProvider', {
      onEventHandler: lambda,
    });
  }
}