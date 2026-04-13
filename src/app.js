import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { UserRouter } from "./routes/user.route.js";
import errorHandler from "./middleware/error.middleware.js";
import { reportRouter } from "./routes/report.route.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "16kb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  }),
);

app.use(express.static("public"));

app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Server is running.");
});

app.use("/api/v1/user", UserRouter);

app.use("/api/v1/report", reportRouter);

// app.use(errorHandler);

export { app };
