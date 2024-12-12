import express, { type Request } from "express";
import { nanoid } from "nanoid";

import { validate } from "../middlewares/validate.js";
import { checkRestaurantExists } from "../middlewares/checkRestaurantId.js";

import { RestaurantSchema, type Restaurant } from "../schemas/restaurant.js";

import { initializeRedisClient } from "../utils/client.js";
import { restaurantKeyById } from "../utils/keys.js";
import { successResponse } from "../utils/responses.js";

export const router = express.Router();

router.post("/", validate(RestaurantSchema), async (req, res, next) => {
  const data = req.body as Restaurant;

  try {
    const client = await initializeRedisClient();
    const id = nanoid();
    const restaurantKey = restaurantKeyById(id);
    const hashData = { id, name: data.name, location: data.location };
    const addResult = await client.hSet(restaurantKey, hashData);

    console.log(`Added ${addResult} fields.`);

    return successResponse({
      res,
      data: hashData,
      message: "Added new restaurant.",
    });
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:restaurantId",
  checkRestaurantExists,
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;

    try {
      const client = await initializeRedisClient();
      const restaurantKey = restaurantKeyById(restaurantId);
      const [_, restaurant] = await Promise.all([
        client.hIncrBy(restaurantKey, "viewCount", 1),
        client.hGetAll(restaurantKey),
      ]);

      return successResponse({ res, data: restaurant });
    } catch (error) {
      next(error);
    }
  }
);
