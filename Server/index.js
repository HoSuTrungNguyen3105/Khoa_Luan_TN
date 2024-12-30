import express from "express";
import bodyparser from "body-parser";
import mongoose from "mongoose";
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
import config from "./lib/config.js";
import session from "express-session";
const port = process.env.PORT || 5001;
app.use(
  cors({
    origin: config.baseUrl, // Lấy giá trị từ cấu hình
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS", // Cho phép các method
  })
);
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    cookie: { secure: false }, // Đặt thành true nếu dùng HTTPS
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
    server.listen(port, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  });

app.use("/api/admin", AdminRoute);
app.use("/api/auth", AuthRoute);
app.use("/api/user", UserRoute);
app.use("/api/post", PostRoute);
app.use("/api/message", MessageRoute);
app.use("/api/adv", AdvRoute);
