import { onRequest } from "firebase-functions/v2/https";

import admin from "firebase-admin";

import Joi from "joi";
import { authenticateToken } from "./middleware.js";

const threadValidationSchema = Joi.object({
  author: Joi.string().max(50).required(),
  title: Joi.string().max(255).min(3).required(),
  content: Joi.string().max(1024).min(3).required(),
  userId: Joi.string().required(),
});

const commentValidationSchema = Joi.object({
  author: Joi.string().max(50).required(),
  content: Joi.string().max(255).min(1).required(),
  threadId: Joi.string().required(),
  userId: Joi.string().required(),
});

export const handleCreateThread = onRequest(async (req, res) => {
  authenticateToken(req, res, async () => {
    const { title, content } = req.body;
    const user = req.user;

    console.log(user);

    const thread = { author: user.username, userId: user.id, title, content };

    const validate = threadValidationSchema.validate(thread);

    if (validate.error) {
      res.json({ message: validate.error.message }).status(400);
      return;
    }

    const threadCollection = await admin.firestore().collection("threads");

    const query = await threadCollection.add(thread);

    res
      .json({
        message: `Created thread: ${query}\n`,
      })
      .status(201);
  });
});

export const handleCreateComment = onRequest(async (req, res) => {
  authenticateToken(req, res, async () => {
    const { content, threadId } = req.body;

    console.log(req.params);

    const user = req.user;

    const comment = {
      author: user.username,
      userId: user.id,
      content,
      threadId,
    };

    const validate = commentValidationSchema.validate(comment);

    if (validate.error) {
      res.json({ message: validate.error.message }).status(400);
      return;
    }

    const commentsCollection = await admin.firestore().collection("comments");

    const query = await commentsCollection.add(comment);

    res
      .json({
        message: `Сomment created: ${query}\n`,
      })
      .status(201);
  });
});

export const handleGetThreads = onRequest(async (req, res) => {
  authenticateToken(req, res, async () => {
    const threadCollection = await admin.firestore().collection("threads");

    const query = await threadCollection.get();

    const data = query.docs.map((doc) => doc.data());

    res.json(data).status(201);
  });
});

export const handleGetComments = onRequest(async (req, res) => {
  authenticateToken(req, res, async () => {
    const threadId = req.params[0];

    const commentsCollection = await admin.firestore().collection("comments");

    const query = await commentsCollection
      .where("threadId", "==", threadId)
      .get();

    const data = query.docs.map((doc) => doc.data());

    res.json(data).status(201);
  });
});
