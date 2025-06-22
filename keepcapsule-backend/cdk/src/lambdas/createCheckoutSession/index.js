const AWS = require("aws-sdk");
const stripeLib = require("stripe");

const dynamo = new AWS.DynamoDB.DocumentClient();
let stripe; // Cache the Stripe instance

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

exports.handler = async (event) => {
  console.log("📣 Lambda started up");
  console.log("📩 Incoming event:", event);
  console.log("this lambda is working");

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'CORS preflight success' }),
    };
  }

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    console.log("🧪 Parsed body:", body);
    const { email, priceId } = body || {};
    console.log("📧 Email:", email);
    console.log("💰 Price ID:", priceId);

    if (!email || !priceId) {
      console.error("Missing required fields", { email, priceId });
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Missing email or priceId" }),
      };
    }

    // Initialize Stripe with environment variable if not already cached
    if (!stripe) {
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error("❌ Missing STRIPE_SECRET_KEY in environment variables");
        throw new Error("Stripe secret key not found in env vars");
      }
      console.log("🔐 Initializing Stripe with environment variable");
      stripe = stripeLib(process.env.STRIPE_SECRET_KEY);
    }

    console.log("👤 Creating Stripe customer for:", email);
    const customer = await stripe.customers.create({ email });
    console.log("✅ Customer created:", customer);

    console.log("🔍 Retrieving price for:", priceId);
    const priceDetails = await stripe.prices.retrieve(priceId);
    console.log("📄 Price details:", priceDetails);
    const mode = priceDetails.recurring ? 'subscription' : 'payment';

    console.log("🧾 Creating checkout session...");
    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customer.id,
      success_url: `https://keepcapsule.com/set-password?email=${encodeURIComponent(email)}&customerId=${customer.id}&sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://keepcapsule.com`,
    });
    console.log("✅ Checkout session created:", session);

    const item = {
      email,
      customerId: customer.id,
      subscriptionId: 'pending',
      createdAt: new Date().toISOString(),
    };

    console.log("💾 Saving to DynamoDB:", item);
    await dynamo.put({
      TableName: process.env.USERS_TABLE_NAME,
      Item: item,
    }).promise();

    console.log('✅ Saved to DynamoDB:', item);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error("🔥 Lambda error:", error);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: "Internal server error", error: error.message }),
    };
  }
};
