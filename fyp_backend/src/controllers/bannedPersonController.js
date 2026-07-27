import BannedPerson from "../models/bannedPerson.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";

// Get All
export const getBannedPersons = catchAsyncErrors(async (req, res, next) => {
  const persons = await BannedPerson.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, persons });
});

export const addBannedPerson = catchAsyncErrors(async (req, res, next) => {
  const { name, reason } = req.body;

  const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;

  const person = await BannedPerson.create({
    name,
    reason,
    profilePicture,
    addedBy: "68dbdd492b2ee177716740c3",
  });

  res.status(201).json({ success: true, person });
});

// Unban (Delete)
export const unbanPerson = catchAsyncErrors(async (req, res, next) => {
  const person = await BannedPerson.findById(req.params.id);
  if (!person) {
    return res
      .status(404)
      .json({ success: false, message: "Person not found" });
  }
  await person.deleteOne();
  res.status(200).json({ success: true, message: "Person unbanned" });
});
