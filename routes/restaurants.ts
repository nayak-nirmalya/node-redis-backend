import express from "express";

import { validate } from "../middlewares/validate.js";
import { RestaurantSchema } from "../schemas/restaurant.js";

export const router = express.Router();

router.get("/", async (req, res) => {
  res.send("Hello, World!");
});

router.post("/", validate(RestaurantSchema), async (req, res) => {
  const data = req.body;
});
