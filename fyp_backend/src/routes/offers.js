import express from "express";
import {
  createOffer,
  getMyOffers,
  respondToOffer,
  withdrawOffer,
} from "../controllers/offerController.js";
import { isUserAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/mine", isUserAuthenticated, getMyOffers);
router.post("/", isUserAuthenticated, createOffer);
router.patch("/:id/respond", isUserAuthenticated, respondToOffer);
router.patch("/:id/withdraw", isUserAuthenticated, withdrawOffer);

export default router;
