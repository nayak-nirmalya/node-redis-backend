import express from "express";

import { validate } from "../middlewares/validate.js";
import { RestaurantSchema } from "../schemas/restaurant.js";
import { initializeRedisClient } from "../utils/client.js";

export const router = express.Router();

router.get("/", async (req, res) => {
  res.send("Hello, World!");
});

router.post("/", validate(RestaurantSchema), async (req, res) => {
  const data = req.body;

  const client = await initializeRedisClient();

  res.send("Hello, World!");
});
