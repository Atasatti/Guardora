import express from "express";
import {
  getVisitor,
  getAllVisitors,
  getResidentVisitors,
  getVisitorById,
  createVisitor,
  updateVisitor,
  deleteVisitor,
} from "../controllers/visitorController.js";

import { isUserAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getAllVisitors);
router.get("/resident", isUserAuthenticated, getResidentVisitors);
router.get("/:id", getVisitor, getVisitorById);
router.post("/", isUserAuthenticated, createVisitor);
router.put("/:id", getVisitor, updateVisitor);
router.delete("/:id", getVisitor, deleteVisitor);

export default router;
