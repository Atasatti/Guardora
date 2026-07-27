import SocietyArea from "../models/societyArea.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";

// 1. Seed Default Areas (Run this logic if DB is empty)
const seedAreas = catchAsyncErrors(async (req, res) => {
  const defaultAreas = [
    {
      name: "Residential Block A",
      mapId: "block_a",
      description: "North-wing apartments near the main gate.",
      cctvIndex: 1,
    },
    {
      name: "Residential Block B",
      mapId: "block_b",
      description: "East-wing apartments near the market.",
      cctvIndex: 2,
    },
    {
      name: "Residential Block C",
      mapId: "block_c",
      description: "West-wing apartments.",
      cctvIndex: 3,
    },
    {
      name: "Central Park",
      mapId: "central_park",
      description: "Common recreational area and jogging track.",
      cctvIndex: 4,
    },
  ];

  // Upsert logic: Create if not exists, otherwise ignore
  for (const area of defaultAreas) {
    await SocietyArea.findOneAndUpdate({ mapId: area.mapId }, area, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }

  res.status(200).json({
    success: true,
    message: "Society areas seeded successfully",
  });
});

// 2. Get All Areas (Used to paint the map)
const getAllAreas = catchAsyncErrors(async (req, res) => {
  const areas = await SocietyArea.find().sort({ name: 1 });
  res.json({ success: true, areas });
});

// 3. Update Safety Status (Toggle Safe/Unsafe)
const updateAreaStatus = catchAsyncErrors(async (req, res, next) => {
  const { isSafe } = req.body;
  const { id } = req.params;

  let area = await SocietyArea.findById(id);

  if (!area) {
    return next(new ErrorHandler("Area not found", 404));
  }

  area.isSafe = isSafe;
  area.lastUpdatedBy = req.user._id;

  await area.save();

  res.json({
    success: true,
    message: `Area marked as ${isSafe ? "Safe" : "Unsafe"}`,
    area,
  });
});

export { seedAreas, getAllAreas, updateAreaStatus };
