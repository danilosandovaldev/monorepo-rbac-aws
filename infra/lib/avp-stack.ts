import * as cdk from 'aws-cdk-lib';
import * as verifiedpermissions from 'aws-cdk-lib/aws-verifiedpermissions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface AVPStackProps extends cdk.StackProps {
  applicationsTable: dynamodb.Table;
  userGroupsTable: dynamodb.Table;
  groupPermissionsTable: dynamodb.Table;
}

export class AVPStack extends cdk.Stack {
  public readonly policyStore: verifiedpermissions.CfnPolicyStore;

  constructor(scope: Construct, id: string, props: AVPStackProps) {
    super(scope, id, props);

    this.policyStore = new verifiedpermissions.CfnPolicyStore(this, 'PolicyStore', {
      validationSettings: {
        mode: 'STRICT',
      },
      schema: {
        cedarJson: JSON.stringify({
          "": {
            "entityTypes": {
              "User": {
                "memberOfTypes": ["Group"]
              },
              "Group": {
                "shape": {
                  "type": "Record",
                  "attributes": {
                    "name": { "type": "String" },
                    "appId": { "type": "String" }
                  }
                }
              },
              "Application": {
                "shape": {
                  "type": "Record",
                  "attributes": {
                    "name": { "type": "String" }
                  }
                }
              },
              "Resource": {
                "shape": {
                  "type": "Record",
                  "attributes": {
                    "type": { "type": "String" },
                    "appId": { "type": "String" }
                  }
                }
              }
            },
            "actions": {
              "read": { "appliesTo": { "resourceTypes": ["Resource"] } },
              "write": { "appliesTo": { "resourceTypes": ["Resource"] } },
              "create": { "appliesTo": { "resourceTypes": ["Resource"] } },
              "delete": { "appliesTo": { "resourceTypes": ["Resource"] } },
              "manage": { "appliesTo": { "resourceTypes": ["Resource"] } }
            }
          }
        })
      }
    });

    // Política dinámica basada en grupos y aplicaciones
    new verifiedpermissions.CfnPolicy(this, 'GroupBasedPolicy', {
      policyStoreId: this.policyStore.attrPolicyStoreId,
      definition: {
        static: {
          statement: `
            permit(
              principal,
              action,
              resource
            ) when {
              principal in Group::principal.group &&
              resource.appId == principal.group.appId
            };
          `,
          description: 'Users can access resources within their group and application context'
        }
      }
    });

    new cdk.CfnOutput(this, 'PolicyStoreId', {
      value: this.policyStore.attrPolicyStoreId,
      exportName: 'PolicyStoreId',
    });
  }
}