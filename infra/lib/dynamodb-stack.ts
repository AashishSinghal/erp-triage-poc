import * as cdk from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class DynamoDbStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tableName = this.node.tryGetContext('tableName') ?? 'incidents';

    const table = new Table(this, 'IncidentsTable', {
      tableName,
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    const roleName = this.node.tryGetContext('iamRoleName');
    if (roleName) {
      const role = iam.Role.fromRoleName(this, 'ExistingEc2Role', roleName);
      role.addToPrincipalPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['dynamodb:DescribeTable'],
          resources: [table.tableArn],
        }),
      );
    }

    new cdk.CfnOutput(this, 'IncidentsTableName', {
      value: table.tableName,
    });

    new cdk.CfnOutput(this, 'IncidentsTableArn', {
      value: table.tableArn,
    });
  }
}
