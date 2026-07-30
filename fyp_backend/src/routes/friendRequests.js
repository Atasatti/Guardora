import express from "express";
import {
  listFriendRequests,
  sendFriendRequest,
  respondFriendRequest,
  cancelFriendRequest,
} from "../controllers/friendRequestController.js";
import { isUserAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", isUserAuthenticated, listFriendRequests);
router.post("/:userId", isUserAuthenticated, sendFriendRequest);
router.patch("/:id/respond", isUserAuthenticated, respondFriendRequest);
router.patch("/:id/cancel", isUserAuthenticated, cancelFriendRequest);

export default router;
