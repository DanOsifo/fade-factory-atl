import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bookingsRouter from "./bookings";
import authRouter from "./auth";
import publicRouter from "./public";
import adminRouter from "./admin";
import barberRouter from "./barber";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(authRouter);
router.use(publicRouter);
router.use("/admin", adminRouter);
router.use("/barber", barberRouter);
router.use(storageRouter);
router.use(healthRouter);
router.use(bookingsRouter);

export default router;
