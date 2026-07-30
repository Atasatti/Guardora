import Reservation from "../models/reservation.js";
import User from "../models/user.js";
import { createNotification } from "../utils/notifications.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const processReservationLifecycle = async (now = new Date()) => {
  const ended = await Reservation.find({
    status: "CONFIRMED",
    endDate: { $lt: now },
  });

  let completed = 0;
  let noShows = 0;
  for (const reservation of ended) {
    if (reservation.checkedInAt) {
      reservation.status = "COMPLETED";
      completed += 1;
    } else {
      reservation.status = "NO_SHOW";
      reservation.noShowMarkedAt = now;
      noShows += 1;

      const recentNoShows = await Reservation.countDocuments({
        _id: { $ne: reservation._id },
        residentId: reservation.residentId,
        status: "NO_SHOW",
        date: { $gte: new Date(now.getTime() - 90 * DAY_MS) },
      });
      if (recentNoShows + 1 >= 3) {
        const restrictionUntil = new Date(now.getTime() + 30 * DAY_MS);
        await User.updateOne(
          { _id: reservation.residentId },
          { $max: { facilityRestrictionUntil: restrictionUntil } }
        );
        await createNotification({
          recipient: reservation.residentId,
          type: "SYSTEM",
          title: "Facility booking temporarily restricted",
          message:
            "Three recent no-shows triggered a 30-day booking restriction.",
          link: "/facilities",
          metadata: { reservationId: reservation._id, restrictionUntil },
        });
      }
    }
    await reservation.save();
  }

  const reminderWindowEnd = new Date(now.getTime() + DAY_MS);
  const upcoming = await Reservation.find({
    status: "CONFIRMED",
    reminderSentAt: null,
    date: { $gte: now, $lte: reminderWindowEnd },
  }).populate("facilityId", "name");

  let remindersSent = 0;
  for (const reservation of upcoming) {
    await createNotification({
      recipient: reservation.residentId,
      type: "SYSTEM",
      title: "Upcoming facility reservation",
      message: `${reservation.facilityId?.name || "Facility"} is booked for ${reservation.date.toLocaleString()}.`,
      link: "/facilities",
      metadata: { reservationId: reservation._id },
    });
    reservation.reminderSentAt = now;
    await reservation.save();
    remindersSent += 1;
  }

  return {
    processed: ended.length,
    completed,
    noShows,
    remindersSent,
  };
};

export { processReservationLifecycle };
