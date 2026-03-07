#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { WuwaRotationBuilderStack } from '../lib/stack';

const app = new cdk.App();

new WuwaRotationBuilderStack(app, 'WuwaRotationBuilderStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
