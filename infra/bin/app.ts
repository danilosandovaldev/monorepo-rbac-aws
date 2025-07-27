#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { AppSyncStack } from '../lib/appsync-stack';
import { AVPStack } from '../lib/avp-stack';
import { CallbackApiStack } from '../lib/callback-api-stack';
import { RBACDataStack } from '../lib/rbac-data-stack';

const app = new cdk.App();

const authStack = new AuthStack(app, 'RBACAuthStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

const dataStack = new RBACDataStack(app, 'RBACDataStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

const avpStack = new AVPStack(app, 'RBACAvpStack', {
  applicationsTable: dataStack.applicationsTable,
  userGroupsTable: dataStack.userGroupsTable,
  groupPermissionsTable: dataStack.groupPermissionsTable,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

const callbackApiStack = new CallbackApiStack(app, 'RBACCallbackApiStack', {
  userPool: authStack.userPool,
  applicationsTable: dataStack.applicationsTable,
  userGroupsTable: dataStack.userGroupsTable,
  groupPermissionsTable: dataStack.groupPermissionsTable,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

const appSyncStack = new AppSyncStack(app, 'RBACAppSyncStack', {
  userPool: authStack.userPool,
  policyStore: avpStack.policyStore,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});