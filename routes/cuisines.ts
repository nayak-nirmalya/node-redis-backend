import express from "express";

import { initializeRedisClient } from "../utils/client.js";
import { cuisinesKey } from "../utils/keys.js";
import { successResponse } from "../utils/responses.js";

export const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const client = await initializeRedisClient();
    const cuisines = await client.sMembers(cuisinesKey);

    return successResponse({ res, data: cuisines });
  } catch (error) {
    next(error);
  }
});
