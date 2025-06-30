const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers, body: 'OK' };
  }

  const sessionId = event.queryStringParameters?.sessionId;

  if (!sessionId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "Missing sessionId" }),
    };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = session.customer_email || session.customer_details?.email;
    const customerId = session.customer;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ email, customerId }),
    };
  } catch (err) {
    console.error("❌ Stripe session fetch error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Failed to fetch session", error: err.message }),
    };
  }
};
