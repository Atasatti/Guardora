import adsRouter from "./routes/ads.js";
import billsRouter from "./routes/bills.js";
import commentsRouter from "./routes/comments.js";
import emergenciesRouter from "./routes/emergencies.js";
import maintenanceTicketsRouter from "./routes/maintenanceTickets.js";
import ordersRouter from "./routes/orders.js";
import paymentCardsRouter from "./routes/paymentCards.js";
import paymentsRouter from "./routes/payments.js";
import postsRouter from "./routes/posts.js";
import productsRouter from "./routes/products.js";
import reportsRouter from "./routes/reports.js";
import servicesRouter from "./routes/services.js";
import usersRouter from "./routes/users.js";
import visitorsRouter from "./routes/visitors.js";

export default function registerMobileRoutes(app) {
  app.use("/api/ads", adsRouter);
  app.use("/api/bills", billsRouter);
  app.use("/api/comments", commentsRouter);
  app.use("/api/emergencies", emergenciesRouter);
  app.use("/api/maintenance_tickets", maintenanceTicketsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/payment-cards", paymentCardsRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/posts", postsRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/services", servicesRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/visitors", visitorsRouter);
}

