import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", (reportId) => {
      socket.join(reportId.toString());
      console.log(`User ${socket.id} joined room: ${reportId}`);
    });

    socket.on("typing", (reportId) => {
      socket.to(reportId.toString()).emit("someone_typing");
    });

    socket.on("stop_typing", (reportId) => {
      socket.to(reportId.toString()).emit("stop_typing");
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
