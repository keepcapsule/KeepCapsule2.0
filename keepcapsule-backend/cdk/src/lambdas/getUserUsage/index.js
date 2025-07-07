const AWS = require('aws-sdk');
const { getUserFromEvent } = require('./authUtils');
const dynamo = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.FILE_TABLE_NAME;

const PLAN_LIMITS_MB = {
  starter: 1024,
  standard: 5120,
  premium: 10240,
  lifetime5: 5120,
  lifetime10: 10240,
};

exports.handler = async (event) => {
  try {
    const token = event.headers.Authorization;

    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Missing Authorization header' }) };
    }

    const user = getUserFromEvent(event);

    if (!user || !user.email) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
    }

    const email = user.email;
    const plan = user.plan || 'starter';
    const planLimitMB = PLAN_LIMITS_MB[plan] || 1024;

    const result = await dynamo.query({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    }).promise();

    const files = result.Items || [];

    let totalBytes = 0;
    let photoBytes = 0;
    let docBytes = 0;

    for (const file of files) {
      const size = file.size || 0;
      totalBytes += size;
      if (file.type === 'image') photoBytes += size;
      else if (file.type === 'document') docBytes += size;
    }

    const storageUsedMB = +(totalBytes / 1024 / 1024).toFixed(2);
    const photoUsageMB = +(photoBytes / 1024 / 1024).toFixed(2);
    const docUsageMB = +(docBytes / 1024 / 1024).toFixed(2);

    return {
      statusCode: 200,
      body: JSON.stringify({
        meta: {
          storageUsedMB,
          storageLimitMB: planLimitMB,
          retrievalsUsedMB: 0, // Placeholder, update once retrieval tracking added
          retrievalLimitMB: 1024, // Example default for now
          photoUsageMB,
          docUsageMB,
        },
        files,
      }),
    };
  } catch (err) {
    console.error('getUserUsage error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
