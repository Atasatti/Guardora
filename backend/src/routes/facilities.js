import express from "express";
import {
  getAllFacilities,
  createFacility,
  getFacility,
  getFacilityById,
  deleteFacility,
  updateFacility,
} from "../controllers/facilityController.js";
import {
  authorizePermissions,
  authorizeRoles,
  isUserAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

router.get("/", isUserAuthenticated, getAllFacilities);
router.get("/:id", isUserAuthenticated, getFacility, getFacilityById);
router.post(
  "/",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_FACILITIES"),
  createFacility
);
router.patch(
  "/:id",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_FACILITIES"),
  getFacility,
  updateFacility
);
router.delete(
  "/:id",
  isUserAuthenticated,
  authorizeRoles("ADMIN", "MODERATOR"),
  authorizePermissions("MANAGE_FACILITIES"),
  getFacility,
  deleteFacility
);

export default router;
