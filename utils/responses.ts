import type { Response } from "express";

export function successResponse({
  res,
  data,
  message = "Success",
}: {
  res: Response;
  data: any;
  message: string;
}) {
  return res.status(200).json({ success: true, message, data });
}

export function errorResponse({
  res,
  status,
  error,
}: {
  res: Response;
  status: number;
  error: string;
}) {
  return res.status(status).json({ success: false, error });
}
