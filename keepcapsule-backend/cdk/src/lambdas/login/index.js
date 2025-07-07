const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ddb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  console.log("📨 Event received:", JSON.stringify(event, null, 2));

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: 'OK' };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { email, password } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing email or password" }),
      };
    }

    const result = await ddb.get({
      TableName: USERS_TABLE_NAME,
      Key: { email },
    }).promise();

    const user = result.Item;

    if (!user || !user.passwordHash) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Invalid credentials" }),
      };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Invalid credentials" }),
      };
    }

    // ✅ Sign JWT
    const token = jwt.sign(
      {
        email,
        customerId: user.customerId || null,
        isPaid: !!user.isPaid,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Login successful",
        token,
        email,
      }),
    };

  } catch (err) {
    console.error("💥 Exception during login:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Login error", details: err.message }),
    };
  }
};
