import express, { type Request } from "express";

import { initializeRedisClient } from "../utils/client.js";
import { cuisineKey, cuisinesKey, restaurantKeyById } from "../utils/keys.js";
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

router.get(
  "/:cuisine",
  async (req: Request<{ cuisine: string }>, res, next) => {
    const { cuisine } = req.params;

    try {
      const client = await initializeRedisClient();
      const restaurantIds = await client.sMembers(cuisineKey(cuisine));
      const restaurants = await Promise.all(
        restaurantIds.map((id) => client.hGet(restaurantKeyById(id), "name"))
      );

      return successResponse({ res, data: restaurants });
    } catch (error) {
      next(error);
    }
  }
);
