import express from "express";
import { nanoid } from "nanoid";

import { validate } from "../middlewares/validate.js";
import { RestaurantSchema, type Restaurant } from "../schemas/restaurant.js";
import { initializeRedisClient } from "../utils/client.js";
import { restaurantKeyById } from "../utils/keys.js";
import { successResponse } from "../utils/responses.js";

export const router = express.Router();

router.get("/", async (req, res) => {
  res.send("Hello, World!");
});

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
