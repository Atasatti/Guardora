import express from "express";
import {
  getCard,
  getAllCards,
  getCardById,
  createCard,
  updateCard,
  deleteCard,
} from "../controllers/paymentCardController.js";

const router = express.Router();

router.get("/", getAllCards);
router.get("/:id", getCard, getCardById);
router.post("/", createCard);
router.put("/:id", getCard, updateCard);
router.delete("/:id", getCard, deleteCard);

export default router;
