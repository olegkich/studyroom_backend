import { ACCES_TOKEN_DOE, REFRESH_TOKEN_DOE } from "./const.js";

import { onRequest } from "firebase-functions/v2/https";

import admin from "firebase-admin";

import Joi from "joi";
import bcrypt from "bcrypt";
import { generateToken } from "./jwt.js";

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

export const handleSignup = onRequest(async (req, res) => {
  const body = req.body;

  const validate = signupValidationSchema.validate(body);

  if (validate.error) {
    res.json({ message: validate.error.message }).status(401);
    return;
  }

  const userCollection = await admin.firestore().collection("users");

  const candidate = await userCollection.where("email", "==", body.email).get();

  if (!candidate.empty) {
    res.json({ message: "User already exists." }).status(401);
    return;
  }

  body.password = await bcrypt.hash(body.password, 6);

  // add returns a query result object from which ID is extracted
  const { id } = await userCollection.add(req.body);

  const access_token = generateToken(id, body.userName, ACCES_TOKEN_DOE);
  const refresh_token = generateToken(id, body.userName, REFRESH_TOKEN_DOE);

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
export const handleLogin = onRequest(async (req, res) => {
  const body = req.body;

  const validate = loginValidationSchema.validate(body);

  if (validate.error) {
    res.json({ message: validate.error.message }).status(400);
    return;
  }

  const userCollection = await admin.firestore().collection("users");

  const query = await userCollection.where("email", "==", body.email).get();

  const user = await query.docs[0].data();

  if (user.empty) {
    res.json({ message: "User doesn't exist." }).status(401);
    return;
  }

  const isPasswordValid = await bcrypt.compare(body.password, user.password);

  if (!isPasswordValid) {
    res.json({ message: "Invalid password." }).status(401);
    return;
  }

  const access_token = generateToken(user.id, body.userName, ACCES_TOKEN_DOE);
  const refresh_token = generateToken(
    user.id,
    body.userName,
    REFRESH_TOKEN_DOE
  );

  // TODO: move message to strings.js
  res
    .json({
      message: `Log in successful`,
      access_token,
      refresh_token,
    })
    .status(201);
});
