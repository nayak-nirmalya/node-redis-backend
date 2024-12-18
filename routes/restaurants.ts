import express, { type Request } from "express";
import { nanoid } from "nanoid";

import { validate } from "../middlewares/validate.js";
import { checkRestaurantExists } from "../middlewares/checkRestaurantId.js";

import { RestaurantSchema, type Restaurant } from "../schemas/restaurant.js";
import { ReviewSchema, type Review } from "../schemas/review.js";

import { initializeRedisClient } from "../utils/client.js";
import {
  cuisineKey,
  cuisinesKey,
  restaurantCuisinesKeyById,
  restaurantKeyById,
  restaurantsByRatingKey,
  reviewDetailsKeyById,
  reviewKeyById,
} from "../utils/keys.js";
import { errorResponse, successResponse } from "../utils/responses.js";

export const router = express.Router();

router.get("/", async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const start = (Number(page) - 1) * Number(limit);
  const end = start + Number(limit) - 1;

  try {
    const client = await initializeRedisClient();
    const restaurantIds = await client.zRange(
      restaurantsByRatingKey,
      start,
      end
    );

    const restaurants = await Promise.all(
      restaurantIds.map((id) => client.hGetAll(restaurantKeyById(id)))
    );

    return successResponse({ res, data: restaurants });
  } catch (error) {
    next(error);
  }
});

router.post("/", validate(RestaurantSchema), async (req, res, next) => {
  const data = req.body as Restaurant;

  try {
    const client = await initializeRedisClient();
    const id = nanoid();
    const restaurantKey = restaurantKeyById(id);
    const hashData = { id, name: data.name, location: data.location };
    await Promise.all([
      ...data.cuisines.map((cuisine) =>
        Promise.all([
          client.sAdd(cuisinesKey, cuisine),
          client.sAdd(cuisineKey(cuisine), id),
          client.sAdd(restaurantCuisinesKeyById(id), cuisine),
        ])
      ),
      client.hSet(restaurantKey, hashData),
      client.zAdd(restaurantsByRatingKey, {
        score: 0,
        value: id,
      }),
    ]);

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
      const restaurantKey = restaurantKeyById(restaurantId);
      const reviewDetailsKey = reviewDetailsKeyById(reviewId);
      const reviewData = {
        id: reviewId,
        ...data,
        timestamp: Date.now(),
        restaurantId,
      };

      const [reviewCount, _setResult, totalStars] = await Promise.all([
        client.lPush(reviewKey, reviewId),
        client.hSet(reviewDetailsKey, reviewData),
        client.hIncrBy(restaurantKey, "totalStars", data.rating),
      ]);

      const averageRating = Number((totalStars / reviewCount).toFixed(1));
      await Promise.all([
        client.zAdd(restaurantsByRatingKey, {
          score: averageRating,
          value: restaurantId,
        }),
        client.hSet(restaurantKey, "avgStars", averageRating),
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

router.delete(
  "/:restaurantId/reviews/:reviewId",
  checkRestaurantExists,
  validate(ReviewSchema),
  async (
    req: Request<{ restaurantId: string; reviewId: string }>,
    res,
    next
  ) => {
    const { restaurantId, reviewId } = req.params;

    try {
      const client = await initializeRedisClient();
      const reviewKey = reviewKeyById(restaurantId);
      const reviewDetailsKey = reviewDetailsKeyById(reviewId);

      const [removeResult, deleteResult] = await Promise.all([
        client.lRem(reviewKey, 0, reviewId),
        client.del(reviewDetailsKey),
      ]);

      if (removeResult === 0 && deleteResult === 0) {
        return errorResponse({ res, error: "Review not found", status: 404 });
      }

      return successResponse({
        res,
        data: reviewId,
        message: "Review deleted",
      });
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
      const [_, restaurant, cuisines] = await Promise.all([
        client.hIncrBy(restaurantKey, "viewCount", 1),
        client.hGetAll(restaurantKey),
        client.sMembers(restaurantCuisinesKeyById(restaurantId)),
      ]);

      return successResponse({ res, data: { ...restaurant, cuisines } });
    } catch (error) {
      next(error);
    }
  }
);
