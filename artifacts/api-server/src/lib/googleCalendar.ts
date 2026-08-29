import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "./logger.js";

export interface CalendarEventInput {
  summary:     string;
  description: string;
  location:    string;
  startIso:    string;
  endIso:      string;
  calendarId?: string;
}

interface CalendarEventResponse {
  id?: string;
  [key: string]: unknown;
}

export async function createCalendarEvent(input: CalendarEventInput): Promise<string | null> {
  try {
    const connectors = new ReplitConnectors();
    const calendarId = encodeURIComponent(input.calendarId ?? "primary");

    const response = await connectors.proxy(
      "google-calendar",
      `/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary:     input.summary,
          description: input.description,
          location:    input.location,
          start: { dateTime: input.startIso, timeZone: "America/New_York" },
          end:   { dateTime: input.endIso,   timeZone: "America/New_York" },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      logger.error({ status: response.status, body: text }, "Google Calendar API error");
      return null;
    }

    const data = (await response.json()) as CalendarEventResponse;
    const eventId = data.id ?? null;
    logger.info({ eventId }, "Google Calendar event created");
    return eventId as string | null;
  } catch (err) {
    logger.error({ err }, "Failed to create Google Calendar event");
    return null;
  }
}
