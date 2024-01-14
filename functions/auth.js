import { ACCES_TOKEN_DOE, REFRESH_TOKEN_DOE } from "./const.js";

import { onRequest } from "firebase-functions/v2/https";

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
export const handleLogin = onRequest(async (req, res) => {
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
