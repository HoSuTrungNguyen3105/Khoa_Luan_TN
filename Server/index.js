import express from "express";
import bodyparser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

// Import Routes
import AdminRoute from "./Routes/AdminRoute.js";
import AuthRoute from "./Routes/AuthRoute.js";
import UserRoute from "./Routes/UserRoute.js";
import PostRoute from "./Routes/PostRoute.js";
import AdvRoute from "./Routes/AdvRoute.js";
import MessageRoute from "./Routes/MessageRoute.js";
import { app, server } from "./lib/socket.js";
import mongoose from "mongoose";
const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(bodyparser.json({ limit: "20mb", extended: true }));
app.use(bodyparser.urlencoded({ limit: "20mb", extended: true }));

dotenv.config();

mongoose
  .connect(
    "mongodb+srv://lostnfound:k2HOMRjQjlQ4zr5t@cluster0.sxv75.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  });

app.use("/api/admin", AdminRoute);
app.use("/api/auth", AuthRoute);
app.use("/api/user", UserRoute);
app.use("/api/post", PostRoute);
app.use("/api/message", MessageRoute);
app.use("/api/adv", AdvRoute);
