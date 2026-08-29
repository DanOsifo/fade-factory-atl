import { Router, type IRouter } from "express";
import { createCalendarEvent } from "../lib/googleCalendar.js";
import { sendSms }            from "../lib/sms.js";
import { logger }             from "../lib/logger.js";

const router: IRouter = Router();

const SHOP_ADDRESS = "1000 Northside Dr NW #206, Atlanta, GA 30318";

const BARBER_PHONES: Record<string, string | undefined> = {
  akeem: process.env["BARBER_AKEEM_PHONE"],
  jeff:  process.env["BARBER_JEFF_PHONE"],
};

interface BookingBody {
  service:     string;
  price:       string;
  duration:    string;
  barber:      string;
  barberLabel: string;
  date:        string;
  time:        string;
  startIso:    string;
  endIso:      string;
}

function buildBarberSms(b: BookingBody): string {
  return [
    `📅 New Appointment at Fade Factory ATL`,
    ``,
    `Service : ${b.service} (${b.price})`,
    `Duration: ${b.duration}`,
    `Barber  : ${b.barberLabel}`,
    `Date    : ${b.date}`,
    `Time    : ${b.time}`,
    ``,
    SHOP_ADDRESS,
  ].join("\n");
}

router.post("/bookings", async (req, res) => {
  const body = req.body as BookingBody;

  const missing = ["service", "price", "duration", "barber", "date", "time", "startIso", "endIso"].filter(
    (k) => !body[k as keyof BookingBody]
  );
  if (missing.length) {
    res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    return;
  }

  req.log.info({ service: body.service, barber: body.barber, date: body.date }, "Booking received");

  const calendarDescription = [
    `Service : ${body.service}`,
    `Price   : ${body.price}`,
    `Duration: ${body.duration}`,
    `Barber  : ${body.barberLabel}`,
    ``,
    SHOP_ADDRESS,
  ].join("\n");

  const [eventId, smsSent] = await Promise.all([
    createCalendarEvent({
      summary:     `Fade Factory ATL — ${body.service}`,
      description: calendarDescription,
      location:    SHOP_ADDRESS,
      startIso:    body.startIso,
      endIso:      body.endIso,
    }),
    (async () => {
      const barberKey   = body.barber.toLowerCase();
      const barberPhone = BARBER_PHONES[barberKey];
      if (!barberPhone) {
        logger.warn({ barberKey }, "No phone number on file for barber — SMS skipped");
        return false;
      }
      return sendSms(barberPhone, buildBarberSms(body));
    })(),
  ]);

  res.json({
    success:  true,
    eventId,
    smsSent,
    message:  "Appointment booked — barber notified and calendar updated.",
  });
});

export default router;
