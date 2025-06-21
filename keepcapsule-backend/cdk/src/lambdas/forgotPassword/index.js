const AWS = require('aws-sdk');
const crypto = require('crypto');

const dynamo = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE_NAME;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
      },
      body: 'OK',
    };
  }

  try {
    const { email } = JSON.parse(event.body || '{}');

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing email' }),
      };
    }

    // ✅ Simulated hardcoded admin user for testing
    if (email === 'admin@test.com') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Simulated reset link sent',
          resetUrl: `https://keepcapsule.com/reset-password?email=${email}&token=debug-token`
        }),
      };
    }

    const result = await dynamo.get({
      TableName: USERS_TABLE,
      Key: { email },
    }).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expires = Date.now() + 1000 * 60 * 10;

    await dynamo.update({
      TableName: USERS_TABLE,
      Key: { email },
      UpdateExpression: 'SET resetToken = :t, resetExpires = :e',
      ExpressionAttributeValues: {
        ':t': token,
        ':e': expires,
      },
    }).promise();

    const resetUrl = `https://keepcapsule.com/reset-password?email=${encodeURIComponent(email)}&token=${token}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Reset link generated', resetUrl }),
    };
  } catch (err) {
    console.error('Forgot password error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to process request', detail: err.message }),
    };
  }
};
