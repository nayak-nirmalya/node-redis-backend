import type { Request, Response, NextFunction } from "express";

import { initializeRedisClient } from "../utils/client.js";
import { restaurantKeyById } from "../utils/keys.js";
import { errorResponse } from "../utils/responses.js";

export const checkRestaurantExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { restaurantId } = req.params;
  if (!restaurantId)
    return errorResponse({
      res,
      status: 400,
      error: "Restaurant ID not found",
    });

  const client = await initializeRedisClient();
  const restaurantKey = restaurantKeyById(restaurantId);
  const exists = await client.exists(restaurantKey);
  if (!exists)
    return errorResponse({
      res,
      status: 404,
      error: "Restaurant not found",
    });

  next();
};
