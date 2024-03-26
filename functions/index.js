import { initializeApp } from "firebase-admin/app";

import * as dotenv from "dotenv";

import {
  handleSignup,
  handleLogin,
  handleDeleteUser,
  handleProfileUpdate,
  handleAccountUpdate,
} from "./users.js";

import { handleRefreshToken } from "./jwt.js";

import {
  handleCreateComment,
  handleCreateThread,
  handleDeleteComment,
  handleDeleteThread,
  handleGetComments,
  handleGetThreadById,
  handleGetThreads,
} from "./threads.js";

// setup dotenv
dotenv.config();

initializeApp();

export const signup = handleSignup;
export const login = handleLogin;

export const updateProfile = handleProfileUpdate;
export const updateAccount = handleAccountUpdate;
export const deleteUser = handleDeleteUser;

export const refreshToken = handleRefreshToken;

export const createThread = handleCreateThread;
export const createComment = handleCreateComment;
export const getComments = handleGetComments;
export const getThreads = handleGetThreads;

export const getThreadById = handleGetThreadById;

export const deleteComment = handleDeleteComment;
export const deleteThread = handleDeleteThread;
