import { getWeatherSnapshot } from "@/lib/weather";
import { getUpcomingEvents, type CalendarResult } from "@/lib/calendar";
import { TimeWeatherWidget } from "./TimeWeatherWidget";
import { CalendarWidget } from "./CalendarWidget";

export async function TopBar() {
  const [weather, calendar] = await Promise.all([
    getWeatherSnapshot().catch(() => ({
      city: null,
      region: null,
      country: null,
      timezone: null,
      temperatureF: null,
      conditionLabel: null,
      conditionEmoji: null,
      isFallback: true,
    })),
    getUpcomingEvents().catch(
      (err): CalendarResult => ({ kind: "error", message: (err as Error).message }),
    ),
  ]);

  return (
    <div className="hidden md:flex items-center justify-end gap-2 h-12 px-4 sm:px-6 border-b border-rule-soft bg-bg/50 backdrop-blur sticky top-0 z-30">
      <CalendarWidget result={calendar} />
      <TimeWeatherWidget weather={weather} />
    </div>
  );
}
