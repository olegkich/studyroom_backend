import { initializeApp } from "firebase-admin/app";

import * as dotenv from "dotenv";

import { handleSignup, handleLogin } from "./auth.js";

import { handleRefreshToken } from "./jwt.js";

import {
  handleCreateComment,
  handleCreateThread,
  handleGetComments,
  handleGetThreads,
} from "./threads.js";

// setup dotenv
dotenv.config();

initializeApp();

export const signup = handleSignup;
export const login = handleLogin;

export const refreshToken = handleRefreshToken;

export const createThread = handleCreateThread;
export const createComment = handleCreateComment;
export const getComments = handleGetComments;
export const getThreads = handleGetThreads;
