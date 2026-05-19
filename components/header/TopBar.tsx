import { getWeatherSnapshot } from "@/lib/weather";
import { TimeWeatherWidget } from "./TimeWeatherWidget";

export async function TopBar() {
  // Best-effort weather. If the API call fails, the widget still works for time.
  let weather;
  try {
    weather = await getWeatherSnapshot();
  } catch {
    weather = {
      city: null,
      region: null,
      country: null,
      timezone: null,
      temperatureF: null,
      conditionLabel: null,
      conditionEmoji: null,
      isFallback: true,
    } as const;
  }

  return (
    <div className="hidden md:flex items-center justify-end h-12 px-4 sm:px-6 border-b border-rule-soft bg-bg/50 backdrop-blur sticky top-0 z-30">
      <TimeWeatherWidget weather={weather} />
    </div>
  );
}
