import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaUrl from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class CheckoutApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sharedEnv = {
      JWT_SECRET: process.env.JWT_SECRET!,
    };

    const fileBucket = new s3.Bucket(this, 'KeepCapsuleFileBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const filesTable = new dynamodb.Table(this, 'FilesTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const metaTable = new dynamodb.Table(this, 'UserMetaTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const checkoutFunction = new lambda.Function(this, 'CreateCheckoutSessionFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambdas/createCheckoutSession'),
      environment: {
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });

    const uploadFunction = new lambda.Function(this, 'UploadFileFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambdas/uploadFile'),
      environment: {
        ...sharedEnv,
        FILE_BUCKET_NAME: fileBucket.bucketName,
        FILE_TABLE_NAME: filesTable.tableName,
      },
    });

    const getFilesFunction = new lambda.Function(this, 'GetFilesFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambdas/getFiles'),
      environment: {
        ...sharedEnv,
        FILE_TABLE_NAME: filesTable.tableName,
        UPLOAD_BUCKET: fileBucket.bucketName,
      },
    });

    const deleteFileFunction = new lambda.Function(this, 'DeleteFileFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambdas/deleteFile'),
      environment: {
        ...sharedEnv,
        FILE_BUCKET_NAME: fileBucket.bucketName,
        FILE_TABLE_NAME: filesTable.tableName,
      },
    });

    const downloadFileFunction = new lambda.Function(this, 'DownloadFileFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambdas/downloadFile'),
      environment: {
        ...sharedEnv,
        FILE_BUCKET_NAME: fileBucket.bucketName,
        FILE_TABLE_NAME: filesTable.tableName,
        META_TABLE_NAME: metaTable.tableName,
      },
    });

    const setPasswordFunction = new lambda.Function(this, 'SetPasswordFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambdas/setPassword'),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });

    const loginFunction = new lambda.Function(this, 'LoginFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambdas/login'),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET!,
      },
    });

    const handleStripeWebhookFunction = new lambda.Function(this, 'HandleStripeWebhookFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambdas/handleStripeWebhook'),
      environment: {
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });

    const getStripeSessionFunction = new lambda.Function(this, 'GetStripeSessionFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambdas/getStripeSession'),
      environment: {
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
      },
    });

    const getUserUsageFunction = new lambda.Function(this, 'GetUserUsageFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambdas/getUserUsage'),
      environment: {
        ...sharedEnv,
        FILE_TABLE_NAME: filesTable.tableName,
      },
    });

    // ✅ Permissions
    usersTable.grantReadWriteData(checkoutFunction);
    usersTable.grantReadWriteData(setPasswordFunction);
    usersTable.grantReadWriteData(loginFunction);
    usersTable.grantReadWriteData(handleStripeWebhookFunction);

    filesTable.grantReadWriteData(uploadFunction);
    fileBucket.grantReadWrite(uploadFunction);

    filesTable.grantReadData(getFilesFunction);
    fileBucket.grantRead(getFilesFunction);

    filesTable.grantWriteData(deleteFileFunction);
    fileBucket.grantDelete(deleteFileFunction);

    filesTable.grant(getUserUsageFunction, 'dynamodb:Query');

    filesTable.grantReadData(downloadFileFunction);
    metaTable.grantReadWriteData(downloadFileFunction);
    fileBucket.grantRead(downloadFileFunction);

    // ✅ API Gateway
    const api = new apigateway.RestApi(this, 'KeepCapsuleApi', {
      restApiName: 'KeepCapsule API',
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    api.root.addResource('create-checkout-session').addMethod('POST', new apigateway.LambdaIntegration(checkoutFunction));
    api.root.addResource('upload-file').addMethod('POST', new apigateway.LambdaIntegration(uploadFunction));
    api.root.addResource('get-files').addMethod('GET', new apigateway.LambdaIntegration(getFilesFunction));
    api.root.addResource('delete-file').addMethod('POST', new apigateway.LambdaIntegration(deleteFileFunction));
    api.root.addResource('login').addMethod('POST', new apigateway.LambdaIntegration(loginFunction));
    api.root.addResource('set-password').addMethod('POST', new apigateway.LambdaIntegration(setPasswordFunction));
    api.root.addResource('webhook').addMethod('POST', new apigateway.LambdaIntegration(handleStripeWebhookFunction));
    api.root.addResource('get-stripe-session').addMethod('GET', new apigateway.LambdaIntegration(getStripeSessionFunction));
    api.root.addResource('get-usage').addMethod('GET', new apigateway.LambdaIntegration(getUserUsageFunction));
    api.root.addResource('download-file').addMethod('POST', new apigateway.LambdaIntegration(downloadFileFunction));

    // ✅ Lambda URL for webhook
    const webhookFunctionUrl = handleStripeWebhookFunction.addFunctionUrl({
      authType: lambdaUrl.FunctionUrlAuthType.NONE,
      invokeMode: lambdaUrl.InvokeMode.BUFFERED,
    });

    new cdk.CfnOutput(this, 'KeepCapsuleApiEndpoint', { value: api.url });
    new cdk.CfnOutput(this, 'S3BucketName', { value: fileBucket.bucketName });
    new cdk.CfnOutput(this, 'StripeWebhookUrl', { value: webhookFunctionUrl.url });
  }
}
