const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: 'OK',
    };
  }

  console.log('📩 Incoming event:', JSON.stringify(event));

  const body = JSON.parse(event.body || '{}');
  const { email, password } = body;

  if (!email || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing email or password' }),
    };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await dynamo.update({
      TableName: process.env.USERS_TABLE_NAME,
      Key: { email },
      UpdateExpression: 'SET passwordHash = :ph',
      ExpressionAttributeValues: {
        ':ph': hashedPassword,
      },
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Password set successfully' }),
    };
  } catch (err) {
    console.error('🔥 Error setting password:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
