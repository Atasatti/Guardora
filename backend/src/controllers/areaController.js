import SocietyArea from "../models/societyArea.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import Report from "../models/report.js";
import { recordAudit } from "../utils/audit.js";
import { notifyRoles } from "../utils/notifications.js";

// 1. Seed Default Areas (Run this logic if DB is empty)
const seedAreas = catchAsyncErrors(async (req, res) => {
  const defaultAreas = [
    {
      name: "Residential Block A",
      mapId: "block_a",
      description: "North-wing apartments near the main gate.",
      cctvIndex: 1,
      center: { latitude: 33.6848, longitude: 73.0479 },
    },
    {
      name: "Residential Block B",
      mapId: "block_b",
      description: "East-wing apartments near the market.",
      cctvIndex: 2,
      center: { latitude: 33.6842, longitude: 73.0492 },
    },
    {
      name: "Residential Block C",
      mapId: "block_c",
      description: "West-wing apartments.",
      cctvIndex: 3,
      center: { latitude: 33.6837, longitude: 73.0467 },
    },
    {
      name: "Central Park",
      mapId: "central_park",
      description: "Common recreational area and jogging track.",
      cctvIndex: 4,
      center: { latitude: 33.6841, longitude: 73.0480 },
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

  const savedAreas = await SocietyArea.find({
    mapId: { $in: defaultAreas.map((area) => area.mapId) },
  });
  const byMapId = new Map(
    savedAreas.map((area) => [area.mapId, area])
  );
  const links = {
    block_a: [
      ["central_park", 180],
      ["block_b", 310],
    ],
    block_b: [
      ["central_park", 160],
      ["block_a", 310],
    ],
    block_c: [["central_park", 210]],
    central_park: [
      ["block_a", 180],
      ["block_b", 160],
      ["block_c", 210],
    ],
  };
  for (const [mapId, connections] of Object.entries(links)) {
    const source = byMapId.get(mapId);
    if (!source) continue;
    source.connectedAreas = connections
      .map(([targetMapId, distanceMeters]) => ({
        area: byMapId.get(targetMapId)?._id,
        distanceMeters,
      }))
      .filter((connection) => connection.area);
    await source.save();
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
  const { isSafe, riskLevel, riskReason, riskExpiresAt } = req.body;
  const { id } = req.params;

  let area = await SocietyArea.findById(id);

  if (!area) {
    return next(new ErrorHandler("Area not found", 404));
  }

  area.isSafe = Boolean(isSafe);
  area.riskLevel = isSafe ? "LOW" : riskLevel || "HIGH";
  area.riskReason = isSafe ? null : riskReason || "Marked unsafe by security";
  area.riskExpiresAt = isSafe ? null : riskExpiresAt || null;
  area.lastUpdatedBy = req.user._id;
  area.safetyHistory.push({
    isSafe: area.isSafe,
    riskLevel: area.riskLevel,
    reason: area.riskReason,
    changedBy: req.user._id,
  });

  await area.save();
  await recordAudit({
    req,
    action: area.isSafe ? "AREA_MARKED_SAFE" : "AREA_MARKED_UNSAFE",
    targetModel: "SocietyArea",
    targetId: area._id,
    details: { riskLevel: area.riskLevel, reason: area.riskReason },
  });

  res.json({
    success: true,
    message: `Area marked as ${isSafe ? "Safe" : "Unsafe"}`,
    area,
  });
});

const reportDangerousArea = catchAsyncErrors(async (req, res, next) => {
  const area = await SocietyArea.findById(req.params.id);
  if (!area) return next(new ErrorHandler("Area not found", 404));
  const reason = String(req.body.reason || "").trim();
  if (!reason) return next(new ErrorHandler("Reason is required", 400));
  const report = await Report.create({
    reporter: req.user._id,
    type: "DANGEROUS_AREA",
    targetId: String(area._id),
    reason,
    location: {
      latitude: req.body.latitude ?? area.center?.latitude ?? null,
      longitude: req.body.longitude ?? area.center?.longitude ?? null,
      label: area.name,
    },
  });
  await notifyRoles(["ADMIN", "MODERATOR"], {
    type: "EMERGENCY",
    title: `Danger reported in ${area.name}`,
    message: reason,
    link: "/map",
    metadata: { areaId: area._id, reportId: report._id },
  });
  res.status(201).json({ success: true, report });
});

const getSafeRouteGuidance = catchAsyncErrors(async (req, res) => {
  const unsafeAreas = await SocietyArea.find({
    $or: [
      { isSafe: false, riskExpiresAt: null },
      { isSafe: false, riskExpiresAt: { $gt: new Date() } },
    ],
  }).select("name mapId riskLevel riskReason center polygon");
  res.json({
    success: true,
    unsafeAreas,
    guidance:
      unsafeAreas.length === 0
        ? "No active unsafe zones are recorded."
        : `Avoid ${unsafeAreas.map((area) => area.name).join(", ")}.`,
    routeProviderConfigured: Boolean(process.env.MAPS_API_KEY),
  });
});

const calculateSafeRoute = catchAsyncErrors(async (req, res, next) => {
  const startKey = req.body.startAreaId || req.body.startMapId;
  const endKey = req.body.endAreaId || req.body.endMapId;
  if (!startKey || !endKey) {
    return next(
      new ErrorHandler("Start and destination areas are required", 400)
    );
  }

  const areas = await SocietyArea.find().populate(
    "connectedAreas.area",
    "name mapId isSafe riskLevel riskExpiresAt"
  );
  const findArea = (key) =>
    areas.find(
      (area) => String(area._id) === String(key) || area.mapId === String(key)
    );
  const start = findArea(startKey);
  const destination = findArea(endKey);
  if (!start || !destination) {
    return next(new ErrorHandler("Start or destination area not found", 404));
  }

  const isActivelyUnsafe = (area) =>
    area.isSafe === false &&
    (!area.riskExpiresAt || new Date(area.riskExpiresAt) > new Date());
  if (isActivelyUnsafe(destination)) {
    return next(
      new ErrorHandler("Destination is currently marked unsafe", 409)
    );
  }

  const distances = new Map(areas.map((area) => [String(area._id), Infinity]));
  const previous = new Map();
  const unvisited = new Set(areas.map((area) => String(area._id)));
  distances.set(String(start._id), 0);

  while (unvisited.size > 0) {
    let currentId = null;
    let currentDistance = Infinity;
    for (const id of unvisited) {
      const distance = distances.get(id);
      if (distance < currentDistance) {
        currentId = id;
        currentDistance = distance;
      }
    }
    if (!currentId || currentDistance === Infinity) break;
    if (currentId === String(destination._id)) break;
    unvisited.delete(currentId);
    const current = areas.find((area) => String(area._id) === currentId);
    for (const connection of current.connectedAreas || []) {
      const neighbor = connection.area;
      if (!neighbor || isActivelyUnsafe(neighbor)) continue;
      const neighborId = String(neighbor._id);
      if (!unvisited.has(neighborId)) continue;
      const candidate = currentDistance + Number(connection.distanceMeters);
      if (candidate < distances.get(neighborId)) {
        distances.set(neighborId, candidate);
        previous.set(neighborId, currentId);
      }
    }
  }

  const destinationId = String(destination._id);
  if (distances.get(destinationId) === Infinity) {
    return next(
      new ErrorHandler("No safe internal route is currently available", 409)
    );
  }
  const pathIds = [];
  let cursor = destinationId;
  while (cursor) {
    pathIds.unshift(cursor);
    if (cursor === String(start._id)) break;
    cursor = previous.get(cursor);
  }
  const path = pathIds.map((id) => {
    const area = areas.find((candidate) => String(candidate._id) === id);
    return {
      id: area._id,
      name: area.name,
      mapId: area.mapId,
      center: area.center,
      riskLevel: area.riskLevel,
    };
  });
  res.json({
    success: true,
    path,
    totalDistanceMeters: distances.get(destinationId),
    guidance: `Use ${path.map((area) => area.name).join(" → ")}.`,
    provider: "GUARDORA_INTERNAL_SAFE_ROUTE",
  });
});

export {
  seedAreas,
  getAllAreas,
  updateAreaStatus,
  reportDangerousArea,
  getSafeRouteGuidance,
  calculateSafeRoute,
};
