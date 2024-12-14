import express, { type Request } from "express";
import { nanoid } from "nanoid";

import { validate } from "../middlewares/validate.js";
import { checkRestaurantExists } from "../middlewares/checkRestaurantId.js";

import { RestaurantSchema, type Restaurant } from "../schemas/restaurant.js";
import { ReviewSchema, type Review } from "../schemas/review.js";

import { initializeRedisClient } from "../utils/client.js";
import {
  restaurantKeyById,
  reviewDetailsKeyById,
  reviewKeyById,
} from "../utils/keys.js";
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

router.post(
  "/:restaurantId/reviews",
  checkRestaurantExists,
  validate(ReviewSchema),
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;
    const data = req.body as Review;

    try {
      const client = await initializeRedisClient();
      const reviewId = nanoid();
      const reviewKey = reviewKeyById(restaurantId);
      const reviewDetailsKey = reviewDetailsKeyById(reviewId);
      const reviewData = {
        id: reviewId,
        ...data,
        timestamp: Date.now(),
        restaurantId,
      };

      await Promise.all([
        client.lPush(reviewKey, reviewId),
        client.hSet(reviewDetailsKey, reviewData),
      ]);

      return successResponse({
        res,
        data: reviewData,
        message: "Review added",
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:restaurantId/reviews",
  checkRestaurantExists,
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit) - 1;

    try {
      const client = await initializeRedisClient();
      const reviewKey = reviewKeyById(restaurantId);

      const reviewIds = await client.lRange(reviewKey, start, end);
      const reviews = await Promise.all(
        reviewIds.map((id) => client.hGetAll(reviewDetailsKeyById(id)))
      );

      return successResponse({ res, data: reviews });
    } catch (error) {
      next(error);
    }
  }
);

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
