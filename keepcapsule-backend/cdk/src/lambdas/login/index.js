const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");
const ddb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;

exports.handler = async (event) => {
  console.log("📨 Event received:", JSON.stringify(event, null, 2));

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  };

  try {
    const body = JSON.parse(event.body || "{}");
    const { email, password } = body;

    console.log("🧪 Parsed body:", body);

    if (!email || !password) {
      console.warn("⚠️ Missing email or password:", { email, password });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing email or password" }),
      };
    }

    console.log("🔑 Attempting to get user by email:", email);
    const result = await ddb.get({
      TableName: USERS_TABLE_NAME,
      Key: { email },
    }).promise();

    console.log("📦 DynamoDB result:", JSON.stringify(result, null, 2));

    const user = result.Item;

    if (!user || !user.passwordHash) {
      console.warn("❌ User not found or passwordHash missing");
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Invalid credentials" }),
      };
    }

    console.log("🔐 Comparing password...");
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log("✅ Password match result:", isMatch);

    if (!isMatch) {
      console.warn("❌ Password mismatch");
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Invalid credentials" }),
      };
    }

    console.log("🎉 Login successful");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Login successful" }),
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