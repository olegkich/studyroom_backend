import { JWT_SECRET } from "./const.js";
import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  // token comes in "authorization" header in form "KL341243DKSH Bearer"
  // Bearer is a random but necessary string (i'm not sure why lol)
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  // field user from (err, user) contains decoded JWT payload
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }
    req.user = user; // Attach the user data to the request object
    next();
  });
};
