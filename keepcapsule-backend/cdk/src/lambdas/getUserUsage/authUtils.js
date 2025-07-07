const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

function getUserFromEvent(event) {
  const headers = event.headers || {};
  const authHeader = headers.Authorization || headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.email) throw new Error("Invalid token payload");
    return decoded;
  } catch (err) {
    throw new Error("Token verification failed");
  }
}

module.exports = { getUserFromEvent };
