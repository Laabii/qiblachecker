/**
 * High-Precision Qibla & Solar Mathematics Engine
 * CheckQibla.com
 */

// Exact Coordinates of the Holy Kaaba in Makkah al-Mukarramah
export const KAABA_COORDS = {
  latitude: 21.422487,
  longitude: 39.826206,
  name: 'Kaaba, Makkah al-Mukarramah'
};

// Earth mean radius in kilometers (WGS-84 approximation)
const EARTH_RADIUS_KM = 6371.0088;
const EARTH_RADIUS_MI = 3958.7613;

/**
 * Calculates the forward azimuth (initial bearing) from a given point on Earth to the Kaaba
 * using Great-Circle spherical trigonometry.
 *
 * Formula:
 * θ = atan2(sin(Δλ) * cos(φ2), cos(φ1) * sin(φ2) − sin(φ1) * cos(φ2) * cos(Δλ))
 *
 * @param lat User latitude in decimal degrees
 * @param lng User longitude in decimal degrees
 * @returns Qibla direction in degrees clockwise from True North [0, 360)
 */
export function calculateQiblaDirection(lat: number, lng: number): number {
  const phi1 = (lat * Math.PI) / 180;
  const phi2 = (KAABA_COORDS.latitude * Math.PI) / 180;
  const deltaLambda = ((KAABA_COORDS.longitude - lng) * Math.PI) / 180;

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

  const qiblaRad = Math.atan2(y, x);
  const qiblaDeg = (qiblaRad * 180) / Math.PI;

  return (qiblaDeg + 360) % 360;
}

/**
 * Calculates the great circle distance to the Kaaba using the Haversine formula.
 */
export function calculateDistanceToKaaba(
  lat: number,
  lng: number,
  unit: 'km' | 'mi' = 'km'
): number {
  const phi1 = (lat * Math.PI) / 180;
  const phi2 = (KAABA_COORDS.latitude * Math.PI) / 180;
  const deltaPhi = ((KAABA_COORDS.latitude - lat) * Math.PI) / 180;
  const deltaLambda = ((KAABA_COORDS.longitude - lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const radius = unit === 'mi' ? EARTH_RADIUS_MI : EARTH_RADIUS_KM;

  return radius * c;
}

/**
 * Converts a degree heading to an 8-wind / 16-wind compass cardinal direction string.
 */
export function getCompassCardinal(degrees: number): string {
  const normalized = (degrees % 360 + 360) % 360;
  const cardinals = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return cardinals[index];
}

/**
 * Computes angular difference between current heading and Qibla bearing.
 * Result is in range [-180, 180], where negative means turn left, positive means turn right.
 */
export function getRelativeTurnAngle(heading: number, qiblaBearing: number): number {
  let diff = (qiblaBearing - heading + 360) % 360;
  if (diff > 180) {
    diff -= 360;
  }
  return diff;
}

/**
 * Smooth exponential moving average for circular angular values (0-360 degrees)
 * preventing jumps around the 0° / 360° discontinuity.
 */
export function smoothAngle(current: number, target: number, alpha: number = 0.2): number {
  let diff = target - (current % 360);
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return current + diff * alpha;
}

/**
 * Solar position algorithm (PSA simplified astronomical algorithm)
 * Calculates the exact Sun Azimuth and Elevation for a given location and time.
 * Enables the Sun/Shadow Qibla method (immune to magnetometer electromagnetic interference).
 */
export function calculateSunPosition(
  lat: number,
  lng: number,
  date: Date = new Date()
): { azimuth: number; altitude: number; isVisible: boolean } {
  const d = date.getTime();
  // Fractional Julian day from J2000.0
  const jd = d / 86400000 + 2440587.5;
  const n = jd - 2451545.0;

  // Mean solar longitude
  const L = (280.460 + 0.9856474 * n) % 360;
  // Mean solar anomaly
  const g = ((357.528 + 0.9856003 * n) * Math.PI) / 180;
  // Ecliptic longitude
  const lambda = ((L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI) / 180;

  // Obliquity of ecliptic
  const epsilon = ((23.439 - 0.0000004 * n) * Math.PI) / 180;

  // Right ascension and Declination
  const alpha = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda));
  const delta = Math.asin(Math.sin(epsilon) * Math.sin(lambda));

  // Sidereal time at Greenwich (in radians)
  const gmst = ((18.697374558 + 24.06570982441908 * n) * 15 * Math.PI) / 180;
  const lmst = gmst + (lng * Math.PI) / 180;

  // Hour angle
  const H = lmst - alpha;

  const phi = (lat * Math.PI) / 180;

  // Altitude
  const sinAlt = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(H);
  const altitudeRad = Math.asin(sinAlt);
  const altitude = (altitudeRad * 180) / Math.PI;

  // Azimuth
  const cosAz = (Math.sin(delta) - Math.sin(phi) * Math.sin(altitudeRad)) / (Math.cos(phi) * Math.cos(altitudeRad));
  let azimuthRad = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (Math.sin(H) > 0) {
    azimuthRad = 2 * Math.PI - azimuthRad;
  }
  const azimuth = (azimuthRad * 180) / Math.PI;

  return {
    azimuth: (azimuth + 360) % 360,
    altitude,
    isVisible: altitude > -0.833 // Atmospheric refraction adjusted horizon
  };
}
