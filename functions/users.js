import { ACCES_TOKEN_DOE, REFRESH_TOKEN_DOE } from "./const.js";

import { onRequest } from "firebase-functions/v2/https";

import admin from "firebase-admin";

import Joi from "joi";
import bcrypt from "bcrypt";
import { generateToken } from "./jwt.js";
import { authenticateToken } from "./middleware.js";

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
  email: Joi.string().email(),
  password: Joi.string().min(6).required(),
  userName: Joi.string().max(50),
}).or("email", "userName");

const accountValidationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  age: Joi.number().min(13).max(99).required(),
});

const profileValidationSchema = Joi.object({
  firstName: Joi.string().max(50).required(),
  lastName: Joi.string().max(50).required(),
});

export const handleSignup = onRequest({ cors: true }, async (req, res) => {
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

  delete body.password;

  res
    .json({
      message: `created user.`,
      user: body,
      access_token,
      refresh_token,
    })
    .status(201);
});

export const handleLogin = onRequest({ cors: true }, async (req, res) => {
  const body = req.body;

  const validate = loginValidationSchema.validate(body);

  if (validate.error) {
    res.json({ message: validate.error.message }).status(400);
    return;
  }

  const userCollection = await admin.firestore().collection("users");

  const query = await userCollection.where("email", "==", body.email).get();

  const doc = await query.docs[0];

  const user = doc.data();

  if (user.empty) {
    res.json({ message: "User doesn't exist." }).status(401);
    return;
  }

  const isPasswordValid = await bcrypt.compare(body.password, user.password);

  if (!isPasswordValid) {
    res.json({ message: "Invalid password." }).status(401);
    return;
  }

  const access_token = generateToken(doc.id, body.userName, ACCES_TOKEN_DOE);
  const refresh_token = generateToken(
    user.id,
    body.userName,
    REFRESH_TOKEN_DOE
  );

  delete user.password;

  res
    .json({
      message: `Log in successful`,
      user,
      access_token,
      refresh_token,
    })
    .status(201);
});

export const handleProfileUpdate = onRequest(
  { cors: true },
  async (req, res) => {
    authenticateToken(req, res, async () => {
      const { id } = req.user;
      const profileData = req.body;

      console.log(id);

      const validate = profileValidationSchema.validate(profileData);

      if (validate.error) {
        res.json({ message: validate.error.message }).status(401);
        return;
      }

      await admin
        .firestore()
        .doc(`users/${id}`)
        .set(profileData, { merge: true });

      res.json({ message: "update successful" }).status(200);
    });
  }
);

export const handleAccountUpdate = onRequest(
  { cors: true },
  async (req, res) => {
    authenticateToken(req, res, async () => {
      const { id } = req.user;
      const accountData = req.body;

      const validate = accountValidationSchema.validate(accountData);

      if (validate.error) {
        res.json({ message: validate.error.message }).status(401);
        return;
      }

      await admin
        .firestore()
        .doc(`users/${id}`)
        .set(accountData, { merge: true });

      res.json({ message: "update successful" }).status(200);
    });
  }
);

export const handleDeleteUser = onRequest({ cors: true }, async (req, res) => {
  authenticateToken(req, res, async () => {
    const id = req.user.id;

    await admin.firestore().collection("users").doc(id).delete();

    res.json({ message: "delete successful." }).status(200);
  });
});
