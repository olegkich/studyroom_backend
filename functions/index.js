// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const { logger } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");

const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");

// setup dotenv
dotenv.config();

initializeApp();

// TODO: move to consts
const REFRESH_TOKEN_DOE = process.env.REFRESH_TOKEN_DOE;
const ACCES_TOKEN_DOE = process.env.ACCES_TOKEN_DOE;
const JWT_SECRET = process.env.JWT_SECRET;

// TODO: move to schemas
const signupValidationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  age: Joi.number().integer().min(13).required(),
  firstName: Joi.string().max(50).required(),
  lastName: Joi.string().max(50).required(),
  userName: Joi.string().max(50).required(),
  purpose: Joi.string().max(255),
});

const loginValidationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  userName: Joi.string().max(50).required(),
}).xor("email", "username");

// TODO: move to different file
exports.signup = onRequest(async (req, res) => {
  const body = req.body;
  const query = req.query;

  const validate = signupValidationSchema.validate(body);

  // check if name/email is already in db

  if (validate.error) {
    res.json({ message: validate.error.message }).status(401);
    return;
  }

  body.password = await bcrypt.hash(body.password, 6);

  // save user to db

  // id is extracted from DB response, for now it's just 1 TODO
  const access_token = generateToken(1, body.userName, ACCES_TOKEN_DOE);
  const refresh_token = generateToken(1, body.userName, REFRESH_TOKEN_DOE);

  res
    .json({
      message: `all is cool, created user with data: \n ${JSON.stringify(
        body
      )}`,
      access_token,
      refresh_token,
    })
    .status(201);
});

// TODO: move to different file
exports.login = onRequest(async (req, res) => {
  const body = req.body;
  const query = req.query;

  const validate = loginValidationSchema.validate(body);

  if (validate.error) {
    res.json({ message: validate.error.message }).status(400);
    return;
  }

  // check if user with name/email exists.

  // get password from db and bcrypt.compare()

  // id is extracted from DB response, for now it's just 1 TODO
  const access_token = generateToken(1, body.userName, ACCES_TOKEN_DOE);
  const refresh_token = generateToken(1, body.userName, REFRESH_TOKEN_DOE);

  // TODO: move message to strings.js
  res
    .json({
      message: `all is cool, created user with data: \n ${JSON.stringify(
        body
      )}`,
      access_token,
      refresh_token,
    })
    .status(201);
});

exports.refreshToken = onRequest(async (req, res) => {
  // TODO: IIRC refresh token in the body is not that common impl. change it.
  const access_token = refreshAccessToken(req.body.refresh_token);

  // TODO: move message to strings.js
  res.json({ message: "token refreshed succesfuly", access_token });
});

// TODO: different file
const generateToken = (id, username, expiresIn) => {
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
