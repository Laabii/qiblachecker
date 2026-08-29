/**
 * Astronomical Islamic Prayer Times Calculation Engine
 * CheckQibla.com
 */

export interface PrayerTimesResult {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  currentPrayer: string;
  nextPrayer: string;
  nextPrayerTime: Date;
  timeRemainingSeconds: number;
}

export type CalculationMethod = 'MWL' | 'ISNA' | 'Egypt' | 'Makkah' | 'Karachi' | 'Tehran' | 'Jafari';
export type AsrJuristic = 'Standard' | 'Hanafi';

interface MethodParams {
  fajrAngle: number;
  ishaAngle: number;
  ishaInterval?: number; // minutes after Maghrib
}

const METHODS: Record<CalculationMethod, MethodParams> = {
  MWL: { fajrAngle: 18.0, ishaAngle: 17.0 }, // Muslim World League
  ISNA: { fajrAngle: 15.0, ishaAngle: 15.0 }, // Islamic Society of North America
  Egypt: { fajrAngle: 19.5, ishaAngle: 17.5 }, // Egyptian General Authority
  Makkah: { fajrAngle: 18.5, ishaAngle: 0, ishaInterval: 90 }, // Umm al-Qura University
  Karachi: { fajrAngle: 18.0, ishaAngle: 18.0 }, // Univ of Islamic Sciences, Karachi
  Tehran: { fajrAngle: 17.7, ishaAngle: 14.0 },
  Jafari: { fajrAngle: 16.0, ishaAngle: 14.0 }
};

/**
 * Calculates accurate prayer times for a given day and location.
 */
export function calculatePrayerTimes(
  lat: number,
  lng: number,
  date: Date = new Date(),
  method: CalculationMethod = 'MWL',
  asrJuristic: AsrJuristic = 'Standard'
): PrayerTimesResult {
  const methodConfig = METHODS[method] || METHODS.MWL;

  // Day of year and Julian date calculation
  const startOfYear = new Date(Date.UTC(date.getFullYear(), 0, 0));
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Fractional year (radians)
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1);

  // Equation of Time (minutes)
  const eqtime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Solar declination (radians)
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const phi = (lat * Math.PI) / 180;

  // Solar noon (Dhuhr) in UTC minutes from midnight
  const timezoneOffsetMinutes = -date.getTimezoneOffset();
  const solarNoonUTC = 720 - 4 * lng - eqtime;
  const solarNoonLocalMinutes = solarNoonUTC + timezoneOffsetMinutes;

  // Helper to compute hour angle for a specific sun altitude angle (degrees below horizon)
  const getHourAngle = (alphaDeg: number): number => {
    const alphaRad = (alphaDeg * Math.PI) / 180;
    const cosHA =
      (Math.sin(alphaRad) - Math.sin(phi) * Math.sin(decl)) / (Math.cos(phi) * Math.cos(decl));
    if (cosHA > 1) return 0; // sun never rises that high
    if (cosHA < -1) return Math.PI; // sun never sets
    return Math.acos(cosHA);
  };

  // Sunrise/Sunset altitude (center of sun disc - 0.833° for refraction and semi-diameter)
  const haSunriseSunset = getHourAngle(-0.833);
  const sunriseMinutes = solarNoonLocalMinutes - (haSunriseSunset * 180) / Math.PI * 4;
  const sunsetMinutes = solarNoonLocalMinutes + (haSunriseSunset * 180) / Math.PI * 4;

  // Fajr
  const haFajr = getHourAngle(-methodConfig.fajrAngle);
  const fajrMinutes = solarNoonLocalMinutes - (haFajr * 180) / Math.PI * 4;

  // Dhuhr (solar noon + slight buffer, standardly 1-2 minutes)
  const dhuhrMinutes = solarNoonLocalMinutes + 1;

  // Asr (shadow factor = 1 for Standard, 2 for Hanafi)
  const shadowFactor = asrJuristic === 'Hanafi' ? 2 : 1;
  const asrAltRad = Math.atan(1 / (shadowFactor + Math.tan(Math.abs(phi - decl))));
  const asrAltDeg = (asrAltRad * 180) / Math.PI;
  const haAsr = getHourAngle(asrAltDeg);
  const asrMinutes = solarNoonLocalMinutes + (haAsr * 180) / Math.PI * 4;

  // Maghrib (same as sunset or sunset + buffer)
  const maghribMinutes = sunsetMinutes;

  // Isha
  let ishaMinutes: number;
  if (methodConfig.ishaInterval) {
    ishaMinutes = maghribMinutes + methodConfig.ishaInterval;
  } else {
    const haIsha = getHourAngle(-methodConfig.ishaAngle);
    ishaMinutes = solarNoonLocalMinutes + (haIsha * 180) / Math.PI * 4;
  }

  // Convert minute values into Date objects for the given date
  const createDateFromMinutes = (mins: number): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setMilliseconds(Math.round(mins * 60 * 1000));
    return d;
  };

  const fajr = createDateFromMinutes(fajrMinutes);
  const sunrise = createDateFromMinutes(sunriseMinutes);
  const dhuhr = createDateFromMinutes(dhuhrMinutes);
  const asr = createDateFromMinutes(asrMinutes);
  const maghrib = createDateFromMinutes(maghribMinutes);
  const isha = createDateFromMinutes(ishaMinutes);

  // Determine current & next prayer
  const now = date.getTime();
  const schedule = [
    { name: 'Fajr', time: fajr },
    { name: 'Sunrise', time: sunrise },
    { name: 'Dhuhr', time: dhuhr },
    { name: 'Asr', time: asr },
    { name: 'Maghrib', time: maghrib },
    { name: 'Isha', time: isha }
  ];

  let currentPrayer = 'Isha';
  let nextPrayer = 'Fajr';
  let nextPrayerTime = new Date(fajr.getTime() + 24 * 3600 * 1000); // Tomorrow's Fajr default

  for (let i = 0; i < schedule.length; i++) {
    if (now < schedule[i].time.getTime()) {
      nextPrayer = schedule[i].name;
      nextPrayerTime = schedule[i].time;
      currentPrayer = i === 0 ? 'Isha (Previous Night)' : schedule[i - 1].name;
      break;
    }
  }

  const timeRemainingSeconds = Math.max(0, Math.floor((nextPrayerTime.getTime() - now) / 1000));

  return {
    fajr,
    sunrise,
    dhuhr,
    asr,
    maghrib,
    isha,
    currentPrayer,
    nextPrayer,
    nextPrayerTime,
    timeRemainingSeconds
  };
}

/**
 * Format a Date object into a readable 12-hour/24-hour time string (e.g. "05:14 AM" or "13:20").
 */
export function formatPrayerTime(date: Date, use24Hour: boolean = false): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour
  }).format(date);
}

/**
 * Format remaining seconds into HH:MM:SS format
 */
export function formatTimeRemaining(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
