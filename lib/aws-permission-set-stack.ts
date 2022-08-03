import * as moment from 'moment';
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnPermissionSet, CfnAssignment } from 'aws-cdk-lib/aws-sso';


import {
  environment, permisssionSets, groupList, accountList,
} from './data';

export class AwsPermissionSetStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const instanceArn = environment.ssoInstanceArn;

        // Create and Assign Permission set for each configuration
        permisssionSets.forEach((set: { name: any; description: any; sessionDuration: any; accounts: any; groups: any; managedPolicies: any; inlinePolicy: any; includeAllAccounts?: false | undefined; }) => {
            const {
                name, description, sessionDuration, accounts, groups, managedPolicies, inlinePolicy, includeAllAccounts = false,
            } = set;

            // Create the Permission Set
            const permissionSet = new CfnPermissionSet(this, `${name}_Set`, {
                name,
                description,
                instanceArn,
                sessionDuration: moment.duration(sessionDuration, 'hours').toISOString(),
                inlinePolicy,
                managedPolicies,
            });
            new CfnOutput(this, `${name}Arn`, {
                description: `${name} Arn`,
                value: permissionSet.attrPermissionSetArn,
            });

            // Include all accounts if required
            const setAccounts = (includeAllAccounts) ? [...Object.keys(accountList)] : [...accounts];

            // Assign to Accounts and Groups
            setAccounts.forEach((acc) => {
                const accNum = accountList[acc];
                groups.forEach((group: string | number) => {
                    const groupId = groupList[group];
                    new CfnAssignment(this, `${name}_${accNum}_${group}_Assignment`, {
                        instanceArn,
                        permissionSetArn: permissionSet.attrPermissionSetArn,
                        principalId: groupId,
                        principalType: 'GROUP',
                        targetId: accNum,
                        targetType: 'AWS_ACCOUNT',
                    });
                });
            });
        });
    }
}
