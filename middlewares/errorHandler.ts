import type { Request, Response, NextFunction } from "express";

import { errorResponse } from "../utils/responses.js";

export function errorHandler({
  err,
  req,
  res,
  next,
}: {
  err: any;
  req: Request;
  res: Response;
  next: NextFunction;
}) {
  console.error(err);
  errorResponse({ res, status: 500, error: err });
}
