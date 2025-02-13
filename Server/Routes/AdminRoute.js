import express from "express";
import {
  approvePost,
  banUsers,
  blockUser,
  dashboard,
  deleteMessage,
  deleteUser,
  getAllAdmin,
  getAllMessages,
  getAllPostsByMonth,
  getAllUsers,
  getApprovedPosts,
  getPendingPosts,
  getReportsByUser,
  getUserById,
  reportNoti,
} from "../Controllers/AdminController.js";
import { protectRoute } from "../middleware/auth_middleware.js";
import { checkAuth, checkUserStatus } from "../lib/checkAuth.js";
import { getLostItemsCount } from "../Controllers/PostController.js";
const router = express.Router();

router.post("/approve/:id", approvePost);
router.get("/notifications", reportNoti);
router.get("/getReportsByUser/:userId", getReportsByUser);
router.get("/pendingPost", getPendingPosts);
router.get("/approvePost", getApprovedPosts);
router.get("/check", protectRoute, checkAuth);
router.delete("/user/:id", protectRoute, deleteUser);
router.get("/getUsers", getAllUsers);
router.get("/getAdmins", getAllAdmin);
router.get("/messages", getAllMessages);
router.delete("/message/:id", deleteMessage);
router.get("/user/:userId", getUserById);
router.post("/ban-users-from-chat", banUsers);
router.get("/checkAuth/user/:id", checkUserStatus);
router.put("/block/:userId", protectRoute, blockUser);
router.get("/reports", dashboard);
router.get("/all-posts-by-month", getAllPostsByMonth);
router.get("/lost-items-count", getLostItemsCount);
export default router;
