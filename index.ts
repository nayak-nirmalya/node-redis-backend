import express from "express";

import { router as cuisinesRouter } from "./routes/cuisines.js";
import { router as restaurantsRouter } from "./routes/restaurants.js";

import { errorHandler } from "./middlewares/errorHandler.js";

const PORT = process.env.PORT || 3000;

const app = express();

app.get("/", async (req, res) => {
  res.send("Hello, World!");
});

app.use(express.json());
app.use("/restaurants", restaurantsRouter);
app.use("/cuisines", cuisinesRouter);
app.use(errorHandler);

app
  .listen(PORT, () => {
    console.log(`Application Running on PORT: ${PORT}`);
  })
  .on("error", (error) => {
    throw new Error(error.message);
  });
