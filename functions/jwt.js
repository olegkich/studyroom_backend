import { onRequest } from "firebase-functions/v2/https";
import jwt from "jsonwebtoken";

import { JWT_SECRET, ACCES_TOKEN_DOE } from "./const.js";

export const handleRefreshToken = onRequest(async (req, res) => {
  const access_token = refreshAccessToken(req.body.refresh_token);
  res.json({ message: "token refreshed succesfuly", access_token });
});

export const generateToken = (id, username, expiresIn) => {
  const payload = { id, username };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

  return token;
};

const verifyToken = (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) reject(err);
      resolve(decoded);
    });
  });
};

const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify the refresh token
    const decoded = await verifyToken(refreshToken, JWT_SECRET);

    // Generate a new access token
    const newAccessToken = generateToken(
      { userId: decoded.userId },
      JWT_SECRET,
      ACCES_TOKEN_DOE
    );

    // Return the new access token
    return newAccessToken;
  } catch (error) {
    // Handle token verification failure (e.g., token expired, invalid token)
    // TODO!: handle error
    throw new Error("Invalid refresh token");
  }
};
