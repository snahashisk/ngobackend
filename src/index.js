import "dotenv/config.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { createServer } from "http";
import { initSocket } from "./utils/socket.js";

const PORT = process.env.PORT || 8000;

// Create HTTP server
const server = createServer(app);

// Initialize socket
initSocket(server);

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("Mongodb connection error", error);
    process.exit(1);
  });
