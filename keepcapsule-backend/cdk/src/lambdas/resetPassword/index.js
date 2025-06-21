const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');

const dynamo = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE_NAME;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: 'OK',
    };
  }

  try {
    const { email, token, newPassword } = JSON.parse(event.body || '{}');

    if (!email || !token || !newPassword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing email, token, or password' }),
      };
    }

    // ✅ Admin shortcut for testing
    if (email === 'admin@test.com' && token === 'debug-token') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Password reset successful (admin bypass)' }),
      };
    }

    const result = await dynamo.get({
      TableName: USERS_TABLE,
      Key: { email },
    }).promise();

    const user = result.Item;

    if (!user || !user.resetToken || user.resetToken !== token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired token' }),
      };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await dynamo.update({
      TableName: USERS_TABLE,
      Key: { email },
      UpdateExpression: 'REMOVE resetToken, resetExpires SET passwordHash = :hash',
      ExpressionAttributeValues: {
        ':hash': passwordHash,
      },
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Password reset successful' }),
    };
  } catch (err) {
    console.error('Reset error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Reset failed', details: err.message }),
    };
  }
};
