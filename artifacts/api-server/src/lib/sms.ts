import twilio from "twilio";
import { logger } from "./logger.js";

export async function sendSms(to: string, body: string): Promise<boolean> {
  const accountSid  = process.env["TWILIO_ACCOUNT_SID"];
  const authToken   = process.env["TWILIO_AUTH_TOKEN"];
  const fromNumber  = process.env["TWILIO_PHONE_NUMBER"];

  if (!accountSid || !authToken || !fromNumber) {
    logger.warn("Twilio env vars not set (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER) — SMS skipped");
    return false;
  }

  try {
    const client = twilio(accountSid, authToken);
    const msg = await client.messages.create({ from: fromNumber, to, body });
    logger.info({ sid: msg.sid, to }, "SMS sent");
    return true;
  } catch (err) {
    logger.error({ err, to }, "Failed to send SMS");
    return false;
  }
}
