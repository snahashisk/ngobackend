import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { UserRouter } from "./routes/user.route.js";
import errorHandler from "./middleware/error.middleware.js";
import { reportRouter } from "./routes/report.route.js";
import { finalReportRouter } from "./routes/finalReport.route.js";
import { messageRouter } from "./routes/message.route.js";

const app = express();

const isDev = process.env.NODE_ENV !== "production";
console.log(isDev);

app.use(
  cors({
    origin: isDev ? "http://localhost:3000" : process.env.CORS_ORIGIN,
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

app.use("/api/v1/finalreport", finalReportRouter);

app.use("/api/v1/message", messageRouter);

app.use(errorHandler);

export { app };
