import express from "express";
import {
  getAllFacilities,
  createFacility,
  getFacility,
  getFacilityById,
  deleteFacility,
  updateFacility,
} from "../controllers/facilityController.js";

const router = express.Router();

router.get("/", getAllFacilities);
router.get("/:id", getFacility, getFacilityById);
router.post("/", createFacility);
router.patch("/:id", getFacility, updateFacility);
router.delete("/:id", getFacility, deleteFacility);

export default router;
