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
        FILE_BUCKET_NAME: fileBucket.bucketName,
        FILE_TABLE_NAME: filesTable.tableName,
      },
    });

    const getFilesFunction = new lambda.Function(this, 'GetFilesFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambdas/getFiles'),
      environment: {
        FILE_TABLE_NAME: filesTable.tableName,
        UPLOAD_BUCKET: fileBucket.bucketName,
      },
    });
    filesTable.grantReadData(getFilesFunction);

    const deleteFileFunction = new lambda.Function(this, 'DeleteFileFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambdas/deleteFile'),
      environment: {
        FILE_BUCKET_NAME: fileBucket.bucketName,
        FILE_TABLE_NAME: filesTable.tableName,
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

    // ✅ Permissions
    usersTable.grantReadWriteData(checkoutFunction);
    usersTable.grantReadWriteData(setPasswordFunction);
    usersTable.grantReadWriteData(loginFunction);
    usersTable.grantReadWriteData(handleStripeWebhookFunction);

    filesTable.grantReadWriteData(uploadFunction);
    fileBucket.grantReadWrite(uploadFunction);

    fileBucket.grantRead(getFilesFunction);
    fileBucket.grantDelete(deleteFileFunction);
    filesTable.grantWriteData(deleteFileFunction);

    // ✅ API Gateway
    const api = new apigateway.RestApi(this, 'KeepCapsuleApi', {
      restApiName: 'KeepCapsule API',
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type'],
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
