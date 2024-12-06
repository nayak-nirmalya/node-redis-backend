import express from "express";

export const router = express.Router();

router.get("/", async (req, res) => {
  res.send("Hello, World!");
});

router.post("/", async (req, res) => {
  const data = req.body;
});
