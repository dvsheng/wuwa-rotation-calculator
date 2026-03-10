#!/usr/bin/env node
import path from 'node:path';

import * as cdk from 'aws-cdk-lib';
import { config } from 'dotenv';

import { WuwaRotationBuilderStack } from '../lib/stack';

config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const app = new cdk.App();

new WuwaRotationBuilderStack(app, 'WuwaRotationBuilderStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
