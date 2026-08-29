/**
 * CheckQibla.com Main Client Application Engine
 * High-Precision GPS Coordinates, Sensor Fusion, Solar Math, Map Cartography, Audio Feedback, and Automatic Dark Mode
 */

import {
  KAABA_COORDS,
  calculateQiblaDirection,
  calculateDistanceToKaaba,
  getCompassCardinal,
  getRelativeTurnAngle,
  smoothAngle,
  calculateSunPosition
} from '../utils/qibla';

import {
  calculatePrayerTimes,
  formatPrayerTime,
  formatTimeRemaining,
  type CalculationMethod,
  type AsrJuristic
} from '../utils/prayer';

import { POPULAR_CITIES, searchCities, type CityLocation } from '../utils/cities';
import { audioFeedback } from '../utils/audio';

// Dynamic import for Leaflet
import type * as LeafletType from 'leaflet';
let L: typeof LeafletType | null = null;

// App State
interface AppSettings {
  audio: boolean;
  vibration: boolean;
  unit: 'km' | 'mi';
  prayerMethod: CalculationMethod;
  asrSchool: AsrJuristic;
  mode: 'compass' | 'arrow';
  theme: 'system' | 'light' | 'dark';
  tolerance: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  audio: true,
  vibration: true,
  unit: 'km',
  prayerMethod: 'MWL',
  asrSchool: 'Standard',
  mode: 'compass',
  theme: 'system',
  tolerance: 4.0
};

class QiblaApp {
  private settings: AppSettings = { ...DEFAULT_SETTINGS };
  private userLat: number = 11.8745; // Default Kannur, Kerala
  private userLng: number = 75.3704;
  private userLocationName: string = 'Kannur, Kerala, India';
  private gpsAccuracyMeters: number | null = null;
  private isLocationReady: boolean = true;
  private watchLocationId: number | null = null;

  private currentQiblaAngle: number = 0;
  private currentHeading: number = 0;
  private smoothedHeading: number = 0;
  private smoothedDialAngle: number = 0;
  private smoothedArrowAngle: number = 0;

  private isCompassActive: boolean = false;
  private isAligned: boolean = false;
  private hasSensorFired: boolean = false;
  private animationFrameId: number | null = null;
  private searchDebounceTimer: number | null = null;

  // Leaflet Map Elements
  private map: LeafletType.Map | null = null;
  private tileLayer: LeafletType.TileLayer | null = null;
  private userMarker: LeafletType.Marker | null = null;
  private kaabaMarker: LeafletType.Marker | null = null;
  private geodesicLine: LeafletType.Polyline | null = null;

  constructor() {
    this.restoreSavedLocation();
    this.loadSettings();
    this.initTheme();
  }

  private restoreSavedLocation(): void {
    try {
      const savedLoc = localStorage.getItem('checkqibla_location');
      if (savedLoc) {
        const parsed = JSON.parse(savedLoc);
        if (parsed.lat && parsed.lng && parsed.name) {
          this.userLat = parsed.lat;
          this.userLng = parsed.lng;
          this.userLocationName = parsed.name;
          return;
        }
      }
    } catch {
      // Ignore
    }

    // Default to Kannur, Kerala
    this.userLat = 11.8745;
    this.userLng = 75.3704;
    this.userLocationName = 'Kannur, Kerala, India';
  }

  private saveCurrentLocation(): void {
    try {
      localStorage.setItem(
        'checkqibla_location',
        JSON.stringify({
          lat: this.userLat,
          lng: this.userLng,
          name: this.userLocationName
        })
      );
    } catch {
      // Ignore
    }
  }

  public async init(): Promise<void> {
    this.setupUIEventListeners();

    // Synchronous immediate calculation on exact coordinates
    this.updateCalculations();
    this.startPrayerTimesClock();
    this.registerServiceWorker();

    // Dynamically load Leaflet for the interactive map
    if (typeof window !== 'undefined') {
      try {
        const leafletModule = await import('leaflet');
        L = leafletModule.default || leafletModule;
        this.initLeafletMap();
      } catch (err) {
        console.warn('Leaflet map notice:', err);
      }
    }

    // Attempt GPS auto-locate
    this.requestGPSLocation(false);

    // Initialize initial Welcome & Language Selection modal
    this.initWelcomeModal();

    // Auto-start compass orientation sensors
    this.startCompassSensors();

    // On iOS 13+, permissions require a user touch gesture. Catch first touch anywhere on screen.
    const onFirstUserInteraction = () => {
      audioFeedback.unlockAudio();
      this.startCompassSensors();
    };
    window.addEventListener('touchstart', onFirstUserInteraction, { once: true, passive: true });
    window.addEventListener('click', onFirstUserInteraction, { once: true });
  }

  /* ----------------------------------------------------
   * THEME & DARK MODE MANAGEMENT
   * ---------------------------------------------------- */
  private initTheme(): void {
    const savedTheme = (localStorage.getItem('checkqibla_theme') as 'system' | 'light' | 'dark') || this.settings.theme;
    this.setTheme(savedTheme, false);

    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.settings.theme === 'system') {
          this.applyThemeToDOM();
        }
      });
    }
  }

  public setTheme(theme: 'system' | 'light' | 'dark', save: boolean = true): void {
    this.settings.theme = theme;
    if (save) {
      localStorage.setItem('checkqibla_theme', theme);
      this.saveSettings();
    }
    this.applyThemeToDOM();
  }

  public toggleTheme(): void {
    const isDark = document.documentElement.classList.contains('dark');
    this.setTheme(isDark ? 'light' : 'dark', true);
  }

  private applyThemeToDOM(): void {
    const isDark =
      this.settings.theme === 'dark' ||
      (this.settings.theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    if (sunIcon && moonIcon) {
      if (isDark) {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
      } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
      }
    }

    const svgDialBase = document.getElementById('svg-dial-base');
    if (svgDialBase) {
      svgDialBase.setAttribute('fill', isDark ? 'url(#dial-grad-dark)' : 'url(#dial-grad-light)');
    }

    this.updateMapTiles(isDark);
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('checkqibla_settings');
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
    this.applySettingsToUI();
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('checkqibla_settings', JSON.stringify(this.settings));
    } catch {
      // Ignore
    }
  }

  private applySettingsToUI(): void {
    const audioToggle = document.getElementById('setting-audio-toggle') as HTMLInputElement | null;
    if (audioToggle) audioToggle.checked = this.settings.audio;

    const vibToggle = document.getElementById('setting-vibration-toggle') as HTMLInputElement | null;
    if (vibToggle) vibToggle.checked = this.settings.vibration;

    const unitSelect = document.getElementById('setting-unit-select') as HTMLSelectElement | null;
    if (unitSelect) unitSelect.value = this.settings.unit;

    const prayerSelect = document.getElementById('setting-prayer-method') as HTMLSelectElement | null;
    if (prayerSelect) prayerSelect.value = this.settings.prayerMethod;

    const asrSelect = document.getElementById('setting-asr-school') as HTMLSelectElement | null;
    if (asrSelect) asrSelect.value = this.settings.asrSchool;

    const themeSelect = document.getElementById('setting-theme-select') as HTMLSelectElement | null;
    if (themeSelect) themeSelect.value = this.settings.theme;

    const quickAudioText = document.getElementById('quick-audio-text');
    if (quickAudioText) quickAudioText.textContent = `Audio: ${this.settings.audio ? 'On' : 'Off'}`;

    const quickHapticText = document.getElementById('quick-haptic-text');
    if (quickHapticText) quickHapticText.textContent = `Vibration: ${this.settings.vibration ? 'On' : 'Off'}`;

    this.switchDisplayMode(this.settings.mode);
  }

  /* ----------------------------------------------------
   * ALERT & ERROR NOTIFICATION BANNER
   * ---------------------------------------------------- */
  public showAlertBanner(
    title: string,
    message: string,
    type: 'warning' | 'error' | 'info' = 'warning',
    showActions: boolean = true
  ): void {
    const banner = document.getElementById('app-alert-banner');
    const container = document.getElementById('alert-banner-container');
    const titleEl = document.getElementById('alert-banner-title');
    const msgEl = document.getElementById('alert-banner-message');
    const actionsEl = document.getElementById('alert-banner-actions');
    const iconEl = document.getElementById('alert-banner-icon');

    if (!banner || !container || !titleEl || !msgEl) return;

    titleEl.textContent = title;
    msgEl.textContent = message;

    if (iconEl) {
      iconEl.textContent = type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '⚠️';
    }

    if (actionsEl) {
      actionsEl.style.display = showActions ? 'flex' : 'none';
    }

    if (type === 'error') {
      container.className = 'rounded-xl border p-4 flex items-start justify-between gap-3 shadow-xs bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs sm:text-sm';
    } else if (type === 'info') {
      container.className = 'rounded-xl border p-4 flex items-start justify-between gap-3 shadow-xs bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs sm:text-sm';
    } else {
      container.className = 'rounded-xl border p-4 flex items-start justify-between gap-3 shadow-xs bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm';
    }

    banner.classList.remove('hidden');
  }

  public hideAlertBanner(): void {
    const banner = document.getElementById('app-alert-banner');
    if (banner) banner.classList.add('hidden');
  }

  /* ----------------------------------------------------
   * LOCATION LOADING OVERLAY & RETRY ENGINE
   * ---------------------------------------------------- */
  public showLocationOverlay(mode: 'locating' | 'success' | 'error', errorTitle?: string, errorDesc?: string): void {
    const overlay = document.getElementById('location-loading-overlay');
    const stateLocating = document.getElementById('overlay-state-locating');
    const stateSuccess = document.getElementById('overlay-state-success');
    const stateError = document.getElementById('overlay-state-error');

    if (!overlay || !stateLocating || !stateSuccess || !stateError) return;

    stateLocating.classList.add('hidden');
    stateLocating.classList.remove('flex');
    stateSuccess.classList.add('hidden');
    stateSuccess.classList.remove('flex');
    stateError.classList.add('hidden');
    stateError.classList.remove('flex');

    if (mode === 'locating') {
      stateLocating.classList.remove('hidden');
      stateLocating.classList.add('flex');
      const gpsStatus = document.getElementById('overlay-gps-status');
      if (gpsStatus) gpsStatus.textContent = 'Contacting Satellites...';
      const azStatus = document.getElementById('overlay-azimuth-status');
      if (azStatus) azStatus.textContent = 'Pending';
      const prStatus = document.getElementById('overlay-prayer-status');
      if (prStatus) prStatus.textContent = 'Pending';
    } else if (mode === 'success') {
      stateSuccess.classList.remove('hidden');
      stateSuccess.classList.add('flex');
      const successLoc = document.getElementById('overlay-success-location');
      if (successLoc) successLoc.textContent = this.userLocationName;
      setTimeout(() => {
        this.hideLocationOverlay();
      }, 1400);
    } else if (mode === 'error') {
      stateError.classList.remove('hidden');
      stateError.classList.add('flex');
      const titleEl = document.getElementById('overlay-error-title');
      const descEl = document.getElementById('overlay-error-desc');
      if (titleEl && errorTitle) titleEl.textContent = errorTitle;
      if (descEl && errorDesc) descEl.textContent = errorDesc;
    }

    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
  }

  public hideLocationOverlay(): void {
    const overlay = document.getElementById('location-loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.classList.remove('flex');
    }
  }

  /* ----------------------------------------------------
   * EXACT HIGH-PRECISION GEOLOCATION
   * ---------------------------------------------------- */
  public requestGPSLocation(explicitUserTap: boolean = false): void {
    const gpsBadgeText = document.getElementById('nav-gps-text');
    if (gpsBadgeText) gpsBadgeText.textContent = 'Locating GPS...';

    if (explicitUserTap) {
      this.showLocationOverlay('locating');
    }

    if (!navigator.geolocation) {
      if (explicitUserTap) {
        this.showLocationOverlay(
          'error',
          'Geolocation Unsupported',
          'Your browser does not support GPS geolocation. Please use the search bar below to find your town or village.'
        );
      } else {
        this.showAlertBanner(
          'Geolocation Unsupported',
          'Your browser does not support GPS geolocation. Please select your exact city/town from the search bar or map below.',
          'warning',
          true
        );
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.hideAlertBanner();
        this.gpsAccuracyMeters = pos.coords.accuracy || null;
        this.handlePositionReceived(pos.coords.latitude, pos.coords.longitude, true);
        if (explicitUserTap) {
          const gpsStatus = document.getElementById('overlay-gps-status');
          if (gpsStatus) gpsStatus.textContent = `✓ Locked (±${Math.round(pos.coords.accuracy)}m)`;
          const azStatus = document.getElementById('overlay-azimuth-status');
          if (azStatus) azStatus.textContent = `✓ ${this.currentQiblaAngle.toFixed(1)}°`;
          const prStatus = document.getElementById('overlay-prayer-status');
          if (prStatus) prStatus.textContent = '✓ Ready';
          this.showLocationOverlay('success');
          this.startCompassSensors();
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        if (gpsBadgeText) gpsBadgeText.textContent = this.userLocationName.split(',')[0];

        if (err.code === 1) { // PERMISSION_DENIED
          if (explicitUserTap) {
            this.showLocationOverlay(
              'error',
              'Location Access Blocked',
              'Location permission was denied. Tap the tune/lock 🔒 icon next to the URL in your browser address bar and choose "Allow Location", then tap Retry.'
            );
          }
        } else if (err.code === 2 || err.code === 3) {
          if (explicitUserTap) {
            this.showLocationOverlay(
              'error',
              'GPS Satellite Fix Delayed',
              'GPS signal took longer than usual. Please ensure your device has location turned on, or search your exact town/village below.'
            );
          }
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );

    // Continuous watchPosition for live tracking
    if (this.watchLocationId === null && navigator.geolocation.watchPosition) {
      this.watchLocationId = navigator.geolocation.watchPosition(
        (pos) => {
          this.gpsAccuracyMeters = pos.coords.accuracy || null;
          this.handlePositionReceived(pos.coords.latitude, pos.coords.longitude, false);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }
  }

  private handlePositionReceived(lat: number, lng: number, isInitial: boolean): void {
    // Store exact raw coordinates
    this.userLat = lat;
    this.userLng = lng;
    this.isLocationReady = true;

    // Fast synchronous offline resolution (0ms delay)
    const instantName = this.findNearestOfflineCityName(lat, lng);
    this.userLocationName = instantName;
    this.saveCurrentLocation();

    const gpsBadgeText = document.getElementById('nav-gps-text');
    if (gpsBadgeText) gpsBadgeText.textContent = instantName.split(',')[0] || 'GPS Active';

    const accuracyText = this.gpsAccuracyMeters ? ` (GPS ±${Math.round(this.gpsAccuracyMeters)}m)` : '';
    const metricLocationSource = document.getElementById('metric-location-source');
    if (metricLocationSource) {
      metricLocationSource.innerHTML = `
        <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        <span>Exact GPS Fix: ${instantName}${accuracyText}</span>
      `;
    }

    // Immediately calculate Qibla, prayer times, map, and dial rotation on EXACT lat/lng
    this.updateCalculations();

    if (isInitial && this.map) {
      this.map.setView([lat, lng], 12);
    }

    // Asynchronously in background refine with detailed locality name
    this.refineReverseGeocoding(lat, lng);
  }

  private findNearestOfflineCityName(lat: number, lng: number): string {
    const isKeralaRegion = lat >= 8.1 && lat <= 12.9 && lng >= 74.8 && lng <= 77.6;

    let minDistance = Infinity;
    let closestCity = POPULAR_CITIES[0];
    for (const c of POPULAR_CITIES) {
      const distToCity = Math.hypot(lat - c.lat, lng - c.lng);
      if (distToCity < minDistance) {
        minDistance = distToCity;
        closestCity = c;
      }
    }

    if (minDistance < 0.4) {
      const statePart = closestCity.state ? `${closestCity.state}, ` : isKeralaRegion ? 'Kerala, ' : '';
      return `${closestCity.city}, ${statePart}${closestCity.country}`;
    }

    const stateLabel = isKeralaRegion ? 'Kerala, India' : 'GPS Coordinates';
    return `${lat.toFixed(4)}°, ${lng.toFixed(4)}° (${stateLabel})`;
  }

  private async refineReverseGeocoding(lat: number, lng: number): Promise<void> {
    // 1. Query OpenStreetMap Nominatim with high resolution for exact neighborhood/town
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal
        }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const addr = data.address;
        if (addr) {
          const locality = addr.village || addr.town || addr.suburb || addr.municipality || addr.city || addr.county;
          const state = addr.state;
          const country = addr.country;
          if (locality && country) {
            const refined = state && state !== locality ? `${locality}, ${state}, ${country}` : `${locality}, ${country}`;
            this.applyRefinedLocation(refined, locality);
            return;
          }
        }
      }
    } catch {
      // Try next provider
    }

    // 2. Query BigDataCloud reverse geocoding
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const locality = data.locality || data.city || data.principalSubdivision;
        const state = data.principalSubdivision;
        const country = data.countryName;
        if (locality && country) {
          const refined = state && state !== locality ? `${locality}, ${state}, ${country}` : `${locality}, ${country}`;
          this.applyRefinedLocation(refined, locality);
        }
      }
    } catch {
      // Offline fallback is already active
    }
  }

  private applyRefinedLocation(refinedFullName: string, shortName: string): void {
    this.userLocationName = refinedFullName;
    this.saveCurrentLocation();

    const metricCityName = document.getElementById('metric-city-name');
    if (metricCityName) metricCityName.textContent = refinedFullName;

    const gpsBadgeText = document.getElementById('nav-gps-text');
    if (gpsBadgeText) gpsBadgeText.textContent = shortName;

    const accuracyText = this.gpsAccuracyMeters ? ` (GPS ±${Math.round(this.gpsAccuracyMeters)}m)` : '';
    const metricLocationSource = document.getElementById('metric-location-source');
    if (metricLocationSource) {
      metricLocationSource.innerHTML = `
        <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        <span>Exact GPS Fix: ${refinedFullName}${accuracyText}</span>
      `;
    }
  }

  public setLocation(name: string, lat: number, lng: number): void {
    this.userLocationName = name;
    this.userLat = lat;
    this.userLng = lng;
    this.gpsAccuracyMeters = null;
    this.isLocationReady = true;
    this.saveCurrentLocation();

    const gpsBadgeText = document.getElementById('nav-gps-text');
    if (gpsBadgeText) gpsBadgeText.textContent = name.split(',')[0];

    const metricLocationSource = document.getElementById('metric-location-source');
    if (metricLocationSource) {
      metricLocationSource.innerHTML = `
        <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        <span>Selected Location: ${name}</span>
      `;
    }

    this.updateCalculations();

    if (this.map) {
      this.map.setView([lat, lng], 12);
    }
  }

  /* ----------------------------------------------------
   * MATHEMATICAL CALCULATIONS (EXACT LAT/LNG)
   * ---------------------------------------------------- */
  private updateCalculations(): void {
    // Exact spherical Great-Circle forward azimuth to Kaaba
    this.currentQiblaAngle = calculateQiblaDirection(this.userLat, this.userLng);
    const cardinal = getCompassCardinal(this.currentQiblaAngle);
    const distance = calculateDistanceToKaaba(this.userLat, this.userLng, this.settings.unit);

    // Update UI Metrics
    const qiblaBearingDisplay = document.getElementById('qibla-bearing-display');
    if (qiblaBearingDisplay) qiblaBearingDisplay.textContent = `${this.currentQiblaAngle.toFixed(1)}°`;

    const qiblaCardinalDisplay = document.getElementById('qibla-cardinal-display');
    if (qiblaCardinalDisplay) qiblaCardinalDisplay.textContent = cardinal;

    const metricQiblaDeg = document.getElementById('metric-qibla-deg');
    if (metricQiblaDeg) metricQiblaDeg.textContent = `${this.currentQiblaAngle.toFixed(1)}°`;

    const metricQiblaCardinal = document.getElementById('metric-qibla-cardinal');
    if (metricQiblaCardinal) metricQiblaCardinal.textContent = cardinal;

    const metricCityName = document.getElementById('metric-city-name');
    if (metricCityName) metricCityName.textContent = this.userLocationName;

    const metricCoordsText = document.getElementById('metric-coords-text');
    if (metricCoordsText) {
      metricCoordsText.textContent = `Lat: ${this.userLat.toFixed(4)}°, Lng: ${this.userLng.toFixed(4)}°`;
    }

    const metricDistanceVal = document.getElementById('metric-distance-val');
    if (metricDistanceVal) {
      metricDistanceVal.textContent = distance.toLocaleString(undefined, { maximumFractionDigits: 1 });
    }

    const metricDistanceUnit = document.getElementById('metric-distance-unit');
    if (metricDistanceUnit) metricDistanceUnit.textContent = this.settings.unit;

    // Rotate Kaaba marker on the SVG dial
    const kaabaMarkerGroup = document.getElementById('kaaba-marker-group');
    if (kaabaMarkerGroup) {
      kaabaMarkerGroup.style.transform = `rotate(${this.currentQiblaAngle}deg)`;
    }

    // When compass sensors are idle, point arrow straight at Qibla
    const svgArrow = document.getElementById('svg-arrow-pointer');
    if (svgArrow && !this.isCompassActive) {
      svgArrow.style.transform = `rotate(${this.currentQiblaAngle}deg)`;
    }

    this.updatePrayerTimesDisplay();
    this.updateMapLayers();
  }

  private updateSolarCalculations(): void {
    const sun = calculateSunPosition(this.userLat, this.userLng, new Date());

    const guideSunAzimuth = document.getElementById('guide-sun-azimuth');
    if (guideSunAzimuth) guideSunAzimuth.textContent = `${sun.azimuth.toFixed(1)}°`;

    const guideSunAltitude = document.getElementById('guide-sun-altitude');
    if (guideSunAltitude) guideSunAltitude.textContent = `${sun.altitude.toFixed(1)}°`;

    const solarSunAltitudeText = document.getElementById('solar-sun-altitude-text');
    if (solarSunAltitudeText) {
      solarSunAltitudeText.textContent = `Sun Altitude: ${sun.altitude.toFixed(1)}° (${sun.isVisible ? 'Daylight' : 'Below Horizon'})`;
    }

    const solarSunRay = document.getElementById('solar-sun-ray');
    if (solarSunRay) {
      solarSunRay.style.transform = `rotate(${sun.azimuth}deg)`;
    }

    const solarQiblaRay = document.getElementById('solar-qibla-ray');
    if (solarQiblaRay) {
      solarQiblaRay.style.transform = `rotate(${this.currentQiblaAngle}deg)`;
    }

    const diff = (this.currentQiblaAngle - sun.azimuth + 360) % 360;
    const diffNorm = diff > 180 ? diff - 360 : diff;
    const guideSunDiffText = document.getElementById('guide-sun-diff-text');

    if (guideSunDiffText) {
      if (!sun.isVisible) {
        guideSunDiffText.textContent = `Sun is currently below horizon. Use 360° Compass mode or night polar alignment.`;
      } else if (Math.abs(diffNorm) < 3) {
        guideSunDiffText.textContent = `SubhanAllah! The sun is currently directly aligned with the Qibla (${this.currentQiblaAngle.toFixed(1)}°). Look directly in the direction of the sun!`;
      } else {
        const dir = diffNorm > 0 ? 'clockwise (right)' : 'counter-clockwise (left)';
        guideSunDiffText.textContent = `Turn ${Math.abs(diffNorm).toFixed(1)}° ${dir} from the sun position to face the Holy Kaaba.`;
      }
    }
  }

  private updatePrayerTimesDisplay(): void {
    // Exact prayer times calculated for precise latitude and longitude
    const prayer = calculatePrayerTimes(
      this.userLat,
      this.userLng,
      new Date(),
      this.settings.prayerMethod,
      this.settings.asrSchool
    );

    const setTime = (id: string, date: Date) => {
      const el = document.getElementById(id);
      if (el) el.textContent = formatPrayerTime(date);
    };

    setTime('prayer-time-fajr', prayer.fajr);
    setTime('prayer-time-sunrise', prayer.sunrise);
    setTime('prayer-time-dhuhr', prayer.dhuhr);
    setTime('prayer-time-asr', prayer.asr);
    setTime('prayer-time-maghrib', prayer.maghrib);
    setTime('prayer-time-isha', prayer.isha);

    const nextPrayerName = document.getElementById('next-prayer-name');
    if (nextPrayerName) nextPrayerName.textContent = prayer.nextPrayer;

    const nextPrayerCountdown = document.getElementById('next-prayer-countdown');
    if (nextPrayerCountdown) nextPrayerCountdown.textContent = formatTimeRemaining(prayer.timeRemainingSeconds);

    const cardMap: Record<string, string> = {
      Fajr: 'prayer-card-fajr',
      Sunrise: 'prayer-card-sunrise',
      Dhuhr: 'prayer-card-dhuhr',
      Asr: 'prayer-card-asr',
      Maghrib: 'prayer-card-maghrib',
      Isha: 'prayer-card-isha'
    };

    Object.values(cardMap).forEach((id) => {
      const card = document.getElementById(id);
      if (card) {
        card.classList.remove('border-emerald-500', 'bg-emerald-50/50', 'dark:bg-emerald-950/30', 'ring-1', 'ring-emerald-500');
        card.classList.add('border-[#ebebeb]', 'dark:border-[#262626]', 'bg-[#fafafa]', 'dark:bg-[#171717]');
      }
    });

    const activeCardId = cardMap[prayer.currentPrayer] || cardMap[prayer.nextPrayer];
    if (activeCardId) {
      const activeCard = document.getElementById(activeCardId);
      if (activeCard) {
        activeCard.classList.remove('border-[#ebebeb]', 'dark:border-[#262626]', 'bg-[#fafafa]', 'dark:bg-[#171717]');
        activeCard.classList.add('border-emerald-500', 'bg-emerald-50/50', 'dark:bg-emerald-950/30', 'ring-1', 'ring-emerald-500');
      }
    }
  }

  private startPrayerTimesClock(): void {
    setInterval(() => {
      if (this.isLocationReady) {
        this.updatePrayerTimesDisplay();
      }
    }, 1000);
  }

  /* ----------------------------------------------------
   * COMPASS ORIENTATION SENSORS & MOBILE SUPPORT
   * ---------------------------------------------------- */
  public async startCompassSensors(): Promise<void> {
    const btnText = document.getElementById('btn-enable-compass-text');
    if (btnText) btnText.textContent = 'Starting Sensors...';

    // iOS 13+ Permission Handler
    const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof DeviceOrientation !== 'undefined' && typeof DeviceOrientation.requestPermission === 'function') {
      try {
        const response = await DeviceOrientation.requestPermission();
        if (response === 'granted') {
          this.bindOrientationListeners();
        } else {
          this.showAlertBanner(
            'Motion Permission Denied',
            'iOS requires motion sensor access to rotate the compass dial. Open iPhone Settings > Safari > Motion & Orientation Access and turn it ON.',
            'warning',
            true
          );
          this.showTroubleshootModal();
        }
      } catch (err) {
        console.warn('iOS permission error:', err);
        this.bindOrientationListeners();
      }
    } else {
      this.bindOrientationListeners();
    }
  }

  private bindOrientationListeners(): void {
    this.isCompassActive = true;
    this.hasSensorFired = false;

    const btnText = document.getElementById('btn-enable-compass-text');
    if (btnText) btnText.textContent = 'Compass Active';

    const diagSensorSupport = document.getElementById('diag-sensor-support');
    if (diagSensorSupport) diagSensorSupport.textContent = 'Active (Connected)';

    const orientationHandler = (event: DeviceOrientationEvent) => {
      let heading: number | null = null;

      // iOS Safari (webkitCompassHeading is 0..360 where 0 is True/Magnetic North)
      if ('webkitCompassHeading' in event && typeof (event as unknown as { webkitCompassHeading: number }).webkitCompassHeading === 'number') {
        const iosHeading = (event as unknown as { webkitCompassHeading: number }).webkitCompassHeading;
        if (!isNaN(iosHeading) && iosHeading !== 0) {
          this.hasSensorFired = true;
          heading = iosHeading;
        }
      } else if (event.alpha !== null && !isNaN(event.alpha)) {
        // Android / standard W3C DeviceOrientation (alpha: 0..360 counter-clockwise)
        this.hasSensorFired = true;
        heading = (360 - event.alpha) % 360;
      }

      if (heading !== null && !isNaN(heading)) {
        this.currentHeading = (heading + 360) % 360;
        this.onSensorHeadingReceived(this.currentHeading);
      }
    };

    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', orientationHandler as EventListener, true);
    }
    window.addEventListener('deviceorientation', orientationHandler as EventListener, true);

    this.startCompassRenderLoop();

    setTimeout(() => {
      if (!this.hasSensorFired) {
        const diagSensorSupport = document.getElementById('diag-sensor-support');
        if (diagSensorSupport) diagSensorSupport.textContent = 'No Hardware Magnetometer';

        this.showAlertBanner(
          'Compass Sensor Notice',
          'Your device does not have a built-in magnetometer (compass sensor). You can use our Sun & Shadow Alignment Mode to find the Qibla physically, or follow the degree heading on the map.',
          'info',
          true
        );
      }
    }, 2000);
  }

  private onSensorHeadingReceived(heading: number): void {
    const diagHeading = document.getElementById('diag-sensor-heading');
    if (diagHeading) diagHeading.textContent = `${heading.toFixed(1)}°`;
  }

  private startCompassRenderLoop(): void {
    if (this.animationFrameId !== null) return;

    const render = () => {
      this.smoothedHeading = smoothAngle(this.smoothedHeading, this.currentHeading, 0.22);
      const targetDialRotation = -this.smoothedHeading;
      this.smoothedDialAngle = smoothAngle(this.smoothedDialAngle, targetDialRotation, 0.22);

      const relativeQiblaAngle = getRelativeTurnAngle(this.smoothedHeading, this.currentQiblaAngle);
      this.smoothedArrowAngle = smoothAngle(this.smoothedArrowAngle, relativeQiblaAngle, 0.22);

      const svgDial = document.getElementById('svg-compass-dial');
      if (svgDial) {
        svgDial.style.transform = `rotate(${this.smoothedDialAngle}deg)`;
      }

      const svgArrow = document.getElementById('svg-arrow-pointer');
      if (svgArrow) {
        // If orientation sensor is active, point relative to device; if idle, point at absolute Qibla
        const arrowRot = this.hasSensorFired ? this.smoothedArrowAngle : this.currentQiblaAngle;
        svgArrow.style.transform = `rotate(${arrowRot}deg)`;
      }

      const centerHeading = document.getElementById('center-heading-text');
      if (centerHeading) {
        centerHeading.textContent = `${Math.round(this.smoothedHeading)}°`;
      }

      const angularDistance = Math.abs(relativeQiblaAngle);
      const isFacing = angularDistance <= this.settings.tolerance;

      this.updateAlignmentState(isFacing, relativeQiblaAngle);

      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  private updateAlignmentState(isFacing: boolean, relativeAngle: number): void {
    const liveTitle = document.getElementById('live-guidance-title');
    const turnInstruction = document.getElementById('turn-instruction');
    const halo = document.getElementById('qibla-aligned-halo');
    const outerBezel = document.getElementById('compass-outer-bezel');
    const targetTriangle = document.getElementById('target-bezel-triangle');
    const arrowPath = document.getElementById('arrow-pointer-path');

    if (isFacing) {
      if (!this.isAligned) {
        this.isAligned = true;
        if (this.settings.audio) audioFeedback.playQiblaLockedChime();
        if (this.settings.vibration) audioFeedback.triggerHaptic(180);
      }

      if (liveTitle) {
        liveTitle.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 animate-pulse"><span>✓</span> Facing Holy Kaaba</span>`;
      }
      if (turnInstruction) {
        turnInstruction.textContent = `You are aligned with Makkah. Ready for Salah.`;
        turnInstruction.className = 'text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400 mt-1 transition-all';
      }
      if (halo) halo.style.opacity = '1';
      if (outerBezel) outerBezel.classList.add('border-emerald-500', 'animate-qibla-aligned');
      if (targetTriangle) targetTriangle.className = 'w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-emerald-500';
      if (arrowPath) arrowPath.setAttribute('fill', '#059669');
    } else {
      this.isAligned = false;

      const turnDir = relativeAngle > 0 ? 'Right ↻' : 'Left ↺';
      const degAbs = Math.round(Math.abs(relativeAngle));

      if (liveTitle) {
        if (this.hasSensorFired) {
          liveTitle.innerHTML = `Turn <span class="text-blue-600 dark:text-blue-400 font-bold">${degAbs}° ${turnDir}</span>`;
        } else {
          liveTitle.textContent = `Rotate Phone Towards Kaaba`;
        }
      }

      if (turnInstruction) {
        turnInstruction.textContent = this.hasSensorFired
          ? `Rotate your body until the needle turns green`
          : `Hold phone flat to activate live compass guidance`;
        turnInstruction.className = 'text-sm sm:text-base font-medium text-[#737373] dark:text-[#a1a1a1] mt-1 transition-all';
      }
      if (halo) halo.style.opacity = '0';
      if (outerBezel) outerBezel.classList.remove('border-emerald-500', 'animate-qibla-aligned');
      if (targetTriangle) targetTriangle.className = 'w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-[#171717] dark:border-t-white';
      if (arrowPath) arrowPath.setAttribute('fill', 'url(#pointer-arrow-grad)');
    }
  }

  public switchDisplayMode(mode: 'compass' | 'arrow'): void {
    this.settings.mode = mode;
    this.saveSettings();

    const compassDialMode = document.getElementById('compass-dial-mode');
    const compassArrowMode = document.getElementById('compass-arrow-mode');

    const tabCompass = document.getElementById('mode-tab-compass');
    const tabArrow = document.getElementById('mode-tab-arrow');
    const navModeText = document.getElementById('nav-mode-text');

    const resetTabs = () => {
      [tabCompass, tabArrow].forEach((t) => {
        if (t) {
          t.className = 'flex-1 py-1.5 px-3 rounded-full text-xs font-medium text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-white transition-all cursor-pointer';
        }
      });
    };

    resetTabs();

    if (compassDialMode) compassDialMode.classList.add('hidden');
    if (compassArrowMode) compassArrowMode.classList.add('hidden');

    if (mode === 'compass') {
      if (compassDialMode) compassDialMode.classList.remove('hidden');
      if (tabCompass) tabCompass.className = 'flex-1 py-1.5 px-3 rounded-full text-xs font-medium text-[#171717] dark:text-white bg-white dark:bg-[#262626] shadow-xs transition-all cursor-pointer';
      if (navModeText) navModeText.textContent = '360° Compass';
    } else if (mode === 'arrow') {
      if (compassArrowMode) compassArrowMode.classList.remove('hidden');
      if (tabArrow) tabArrow.className = 'flex-1 py-1.5 px-3 rounded-full text-xs font-medium text-[#171717] dark:text-white bg-white dark:bg-[#262626] shadow-xs transition-all cursor-pointer';
      if (navModeText) navModeText.textContent = 'Pointer Arrow';

      const svgArrow = document.getElementById('svg-arrow-pointer');
      if (svgArrow && !this.hasSensorFired) {
        svgArrow.style.transform = `rotate(${this.currentQiblaAngle}deg)`;
      }
    }
  }

  /* ----------------------------------------------------
   * LEAFLET MAP CARTOGRAPHY
   * ---------------------------------------------------- */
  private initLeafletMap(): void {
    if (!L || this.map) return;

    const mapContainer = document.getElementById('qibla-leaflet-map');
    if (!mapContainer) return;

    this.map = L.map('qibla-leaflet-map', {
      zoomControl: true,
      attributionControl: false
    }).setView([this.userLat, this.userLng], 4);

    const isDark = document.documentElement.classList.contains('dark');
    this.updateMapTiles(isDark);

    const kaabaIcon = L.divIcon({
      html: `
        <div style="background:#171717;border:2px solid #fbbf24;width:24px;height:24px;border-radius:4px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.4);">
          <div style="background:#fbbf24;width:12px;height:3px;"></div>
        </div>
      `,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    this.kaabaMarker = L.marker([KAABA_COORDS.latitude, KAABA_COORDS.longitude], {
      icon: kaabaIcon,
      title: 'Holy Kaaba, Makkah'
    }).addTo(this.map);

    const userIcon = L.divIcon({
      html: `
        <div style="background:#2563eb;border:2px solid #ffffff;width:16px;height:16px;border-radius:50%;box-shadow:0 0 0 4px rgba(37,99,235,0.25);"></div>
      `,
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    this.userMarker = L.marker([this.userLat, this.userLng], {
      icon: userIcon,
      title: 'Your Location'
    }).addTo(this.map);

    this.map.on('click', (e: LeafletType.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const nearestName = this.findNearestOfflineCityName(lat, lng);
      this.setLocation(nearestName, lat, lng);
      this.refineReverseGeocoding(lat, lng);
    });

    this.updateMapLayers();
  }

  private updateMapTiles(isDark: boolean): void {
    if (!L || !this.map) return;

    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
    }

    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    this.tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 18,
      subdomains: 'abcd'
    }).addTo(this.map);
  }

  private updateMapLayers(): void {
    if (!L || !this.map) return;

    if (this.userMarker) {
      this.userMarker.setLatLng([this.userLat, this.userLng]);
    }

    const points: [number, number][] = this.generateGreatCirclePoints(
      [this.userLat, this.userLng],
      [KAABA_COORDS.latitude, KAABA_COORDS.longitude],
      30
    );

    if (this.geodesicLine) {
      this.geodesicLine.setLatLngs(points);
    } else {
      this.geodesicLine = L.polyline(points, {
        color: '#e11d48',
        weight: 3,
        opacity: 0.85,
        dashArray: '6,6'
      }).addTo(this.map);
    }
  }

  private generateGreatCirclePoints(
    start: [number, number],
    end: [number, number],
    numPoints: number = 30
  ): [number, number][] {
    const lat1 = (start[0] * Math.PI) / 180;
    const lon1 = (start[1] * Math.PI) / 180;
    const lat2 = (end[0] * Math.PI) / 180;
    const lon2 = (end[1] * Math.PI) / 180;

    const d =
      2 *
      Math.asin(
        Math.sqrt(
          Math.sin((lat2 - lat1) / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
        )
      );

    if (d === 0) return [start, end];

    const result: [number, number][] = [];
    for (let i = 0; i <= numPoints; i++) {
      const f = i / numPoints;
      const A = Math.sin((1 - f) * d) / Math.sin(d);
      const B = Math.sin(f * d) / Math.sin(d);

      const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
      const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
      const z = A * Math.sin(lat1) + B * Math.sin(lat2);

      const lat = Math.atan2(z, Math.sqrt(x ** 2 + y ** 2));
      const lon = Math.atan2(y, x);

      result.push([(lat * 180) / Math.PI, (lon * 180) / Math.PI]);
    }
    return result;
  }

  public fitMapRoute(): void {
    if (!L || !this.map) return;
    const bounds = L.latLngBounds([
      [this.userLat, this.userLng],
      [KAABA_COORDS.latitude, KAABA_COORDS.longitude]
    ]);
    this.map.fitBounds(bounds, { padding: [40, 40] });
  }

  public centerMapOnUser(): void {
    if (!this.map) return;
    this.map.setView([this.userLat, this.userLng], 12);
  }

  public centerMapOnKaaba(): void {
    if (!this.map) return;
    this.map.setView([KAABA_COORDS.latitude, KAABA_COORDS.longitude], 14);
  }

  /* ----------------------------------------------------
   * UI EVENT LISTENERS
   * ---------------------------------------------------- */
  private setupUIEventListeners(): void {
    // Dark/Light Theme Toggle
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => this.toggleTheme());

    // Mode tabs
    document.getElementById('mode-tab-compass')?.addEventListener('click', () => this.switchDisplayMode('compass'));
    document.getElementById('mode-tab-arrow')?.addEventListener('click', () => this.switchDisplayMode('arrow'));

    // Enable compass / Detect Location
    document.getElementById('btn-enable-compass')?.addEventListener('click', () => {
      this.requestGPSLocation(true);
      this.startCompassSensors();
    });

    document.getElementById('nav-gps-badge')?.addEventListener('click', () => {
      this.requestGPSLocation(true);
    });

    document.getElementById('btn-retry-location-card')?.addEventListener('click', () => {
      this.requestGPSLocation(true);
    });

    // Location Finding Overlay Buttons (Retry, Search, Close)
    document.getElementById('btn-close-location-overlay')?.addEventListener('click', () => this.hideLocationOverlay());
    document.getElementById('btn-overlay-retry')?.addEventListener('click', () => this.requestGPSLocation(true));
    document.getElementById('btn-overlay-error-retry')?.addEventListener('click', () => this.requestGPSLocation(true));
    document.getElementById('btn-overlay-search')?.addEventListener('click', () => {
      this.hideLocationOverlay();
      const input = document.getElementById('city-search-input');
      input?.focus();
      input?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('btn-overlay-error-search')?.addEventListener('click', () => {
      this.hideLocationOverlay();
      const input = document.getElementById('city-search-input');
      input?.focus();
      input?.scrollIntoView({ behavior: 'smooth' });
    });

    // Alert Banner Buttons
    document.getElementById('btn-dismiss-alert')?.addEventListener('click', () => this.hideAlertBanner());
    document.getElementById('btn-alert-search')?.addEventListener('click', () => {
      this.hideAlertBanner();
      const input = document.getElementById('city-search-input');
      input?.focus();
      input?.scrollIntoView({ behavior: 'smooth' });
    });

    // Welcome & Language Selection Modal
    document.getElementById('btn-open-language')?.addEventListener('click', () => {
      this.showWelcomeModal();
    });

    document.getElementById('btn-start-qibla-finder')?.addEventListener('click', () => {
      audioFeedback.unlockAudio();
      const langSelect = document.getElementById('welcome-language-select') as HTMLSelectElement | null;
      if (langSelect) {
        localStorage.setItem('checkqibla_lang', langSelect.value);
        const navLangLabel = document.getElementById('nav-lang-label');
        if (navLangLabel) navLangLabel.textContent = langSelect.value.toUpperCase();
      }
      localStorage.setItem('checkqibla_welcome_seen', 'true');
      this.hideWelcomeModal();
      this.requestGPSLocation(true);
      this.startCompassSensors();
    });

    // Modals
    document.getElementById('btn-troubleshoot')?.addEventListener('click', () => this.showTroubleshootModal());
    document.getElementById('footer-link-calibrate')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showTroubleshootModal();
    });
    document.getElementById('btn-recalibrate-quick')?.addEventListener('click', () => this.showTroubleshootModal());
    document.getElementById('btn-close-troubleshoot-modal')?.addEventListener('click', () => this.hideTroubleshootModal());
    document.getElementById('btn-recalibrate-action')?.addEventListener('click', () => this.hideTroubleshootModal());

    document.getElementById('btn-open-settings')?.addEventListener('click', () => this.showSettingsModal());
    document.getElementById('footer-link-settings')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showSettingsModal();
    });
    document.getElementById('btn-open-prayer-settings')?.addEventListener('click', () => this.showSettingsModal());
    document.getElementById('btn-close-settings-modal')?.addEventListener('click', () => this.hideSettingsModal());

    // Settings save
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      const audioToggle = document.getElementById('setting-audio-toggle') as HTMLInputElement | null;
      const vibToggle = document.getElementById('setting-vibration-toggle') as HTMLInputElement | null;
      const unitSelect = document.getElementById('setting-unit-select') as HTMLSelectElement | null;
      const prayerSelect = document.getElementById('setting-prayer-method') as HTMLSelectElement | null;
      const asrSelect = document.getElementById('setting-asr-school') as HTMLSelectElement | null;
      const themeSelect = document.getElementById('setting-theme-select') as HTMLSelectElement | null;

      if (audioToggle) this.settings.audio = audioToggle.checked;
      if (vibToggle) this.settings.vibration = vibToggle.checked;
      if (unitSelect) this.settings.unit = unitSelect.value as 'km' | 'mi';
      if (prayerSelect) this.settings.prayerMethod = prayerSelect.value as CalculationMethod;
      if (asrSelect) this.settings.asrSchool = asrSelect.value as AsrJuristic;
      if (themeSelect) this.setTheme(themeSelect.value as 'system' | 'light' | 'dark', true);

      const activeMethodLabel = document.getElementById('active-method-label');
      if (activeMethodLabel && prayerSelect) {
        activeMethodLabel.textContent = prayerSelect.options[prayerSelect.selectedIndex].text.split('(')[0];
      }

      this.saveSettings();
      this.applySettingsToUI();
      this.updateCalculations();
      this.hideSettingsModal();
    });

    // Quick audio/haptic toggles
    document.getElementById('btn-toggle-audio-quick')?.addEventListener('click', () => {
      this.settings.audio = !this.settings.audio;
      this.saveSettings();
      this.applySettingsToUI();
    });

    document.getElementById('btn-toggle-haptic-quick')?.addEventListener('click', () => {
      this.settings.vibration = !this.settings.vibration;
      this.saveSettings();
      this.applySettingsToUI();
    });

    // Map controls
    document.getElementById('btn-map-fit')?.addEventListener('click', () => this.fitMapRoute());
    document.getElementById('btn-map-center-user')?.addEventListener('click', () => this.centerMapOnUser());
    document.getElementById('btn-map-center-kaaba')?.addEventListener('click', () => this.centerMapOnKaaba());

    // Search bar with live Geocoding
    const searchInput = document.getElementById('city-search-input') as HTMLInputElement | null;
    const searchResults = document.getElementById('city-search-results');
    const clearBtn = document.getElementById('btn-clear-search');

    searchInput?.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      if (clearBtn) clearBtn.classList.toggle('hidden', query.length === 0);

      if (query.trim().length > 0) {
        const matches = searchCities(query, 8);
        this.renderSearchResults(matches);

        // If user typed 3+ letters, also do live Nominatim online geocode
        if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = window.setTimeout(async () => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data) && data.length > 0) {
                const onlineResults: CityLocation[] = data.map((item) => ({
                  city: item.name || item.display_name.split(',')[0],
                  country: item.address?.country || 'Location',
                  state: item.address?.state || item.address?.county,
                  lat: parseFloat(item.lat),
                  lng: parseFloat(item.lon)
                }));
                // Merge unique
                const combined = [...matches, ...onlineResults].filter(
                  (v, i, a) => a.findIndex((t) => Math.hypot(t.lat - v.lat, t.lng - v.lng) < 0.01) === i
                );
                this.renderSearchResults(combined.slice(0, 8));
              }
            }
          } catch {
            // Keep offline results
          }
        }, 400);
      } else {
        if (searchResults) searchResults.classList.add('hidden');
      }
    });

    clearBtn?.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      clearBtn.classList.add('hidden');
      if (searchResults) searchResults.classList.add('hidden');
    });

    document.getElementById('btn-search-city-trigger')?.addEventListener('click', () => {
      searchInput?.focus();
      searchInput?.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('btn-use-gps')?.addEventListener('click', () => {
      this.requestGPSLocation(true);
    });

    // Quick City Pills
    document.querySelectorAll('.quick-city-pill').forEach((el) => {
      el.addEventListener('click', () => {
        const lat = parseFloat(el.getAttribute('data-lat') || '0');
        const lng = parseFloat(el.getAttribute('data-lng') || '0');
        const name = el.getAttribute('data-name') || 'City';
        this.setLocation(name, lat, lng);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Table City Row Clicks (Global Qibla & Prayer Times Table)
    document.querySelectorAll('.table-city-row').forEach((row) => {
      row.addEventListener('click', () => {
        const lat = parseFloat(row.getAttribute('data-lat') || '0');
        const lng = parseFloat(row.getAttribute('data-lng') || '0');
        const name = row.getAttribute('data-name') || 'Selected City';
        this.setLocation(name, lat, lng);

        const prayerSection = document.getElementById('section-prayer');
        if (prayerSection) {
          prayerSection.scrollIntoView({ behavior: 'smooth' });
          prayerSection.classList.add('ring-2', 'ring-emerald-500', 'transition-all');
          setTimeout(() => {
            prayerSection.classList.remove('ring-2', 'ring-emerald-500');
          }, 1600);
        }
      });
    });

    // Share action
    document.getElementById('btn-share-app')?.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'CheckQibla.com - Free Accurate Qibla Finder',
            text: 'Find the exact Qibla direction, Kaaba angle, and live prayer times in your browser.',
            url: window.location.href
          });
        } catch {
          // User cancelled
        }
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('CheckQibla.com link copied to clipboard!');
      }
    });
  }

  private renderSearchResults(cities: CityLocation[]): void {
    const resultsContainer = document.getElementById('city-search-results');
    if (!resultsContainer) return;

    if (cities.length === 0) {
      resultsContainer.innerHTML = `<div class="p-2 text-xs text-[#888888] dark:text-[#737373]">No matching cities found. Try searching town, village or district.</div>`;
      resultsContainer.classList.remove('hidden');
      return;
    }

    resultsContainer.innerHTML = cities
      .map(
        (c) => `
        <button
          type="button"
          class="city-result-row w-full flex items-center justify-between p-2 rounded hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-left transition-colors cursor-pointer"
          data-lat="${c.lat}"
          data-lng="${c.lng}"
          data-name="${c.city}, ${c.state ? c.state + ', ' : ''}${c.country}"
        >
          <div class="flex items-center gap-2">
            <span class="text-rose-500">📍</span>
            <span class="text-xs font-medium text-[#171717] dark:text-white">${c.city}</span>
            <span class="text-xs text-[#888888] dark:text-[#737373]">${c.state ? c.state + ', ' : ''}${c.country}</span>
          </div>
          <span class="text-[11px] font-mono text-[#888888] dark:text-[#737373]">${c.lat.toFixed(4)}°, ${c.lng.toFixed(4)}°</span>
        </button>
      `
      )
      .join('');

    resultsContainer.classList.remove('hidden');

    resultsContainer.querySelectorAll('.city-result-row').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lat = parseFloat(btn.getAttribute('data-lat') || '0');
        const lng = parseFloat(btn.getAttribute('data-lng') || '0');
        const name = btn.getAttribute('data-name') || 'Selected City';

        this.setLocation(name, lat, lng);
        resultsContainer.classList.add('hidden');
        const searchInput = document.getElementById('city-search-input') as HTMLInputElement | null;
        if (searchInput) searchInput.value = name;
      });
    });
  }

  private showTroubleshootModal(): void {
    const m = document.getElementById('troubleshoot-modal');
    if (m) {
      m.classList.remove('hidden');
      m.classList.add('flex');
    }
  }

  private hideTroubleshootModal(): void {
    const m = document.getElementById('troubleshoot-modal');
    if (m) {
      m.classList.add('hidden');
      m.classList.remove('flex');
    }
  }

  private showSettingsModal(): void {
    const m = document.getElementById('settings-modal');
    if (m) {
      m.classList.remove('hidden');
      m.classList.add('flex');
    }
  }

  private hideSettingsModal(): void {
    const m = document.getElementById('settings-modal');
    if (m) {
      m.classList.add('hidden');
      m.classList.remove('flex');
    }
  }

  private initWelcomeModal(): void {
    const hasSeen = localStorage.getItem('checkqibla_welcome_seen');
    const savedLang = localStorage.getItem('checkqibla_lang') || 'en';
    const langSelect = document.getElementById('welcome-language-select') as HTMLSelectElement | null;
    if (langSelect) langSelect.value = savedLang;

    const navLangLabel = document.getElementById('nav-lang-label');
    if (navLangLabel) navLangLabel.textContent = savedLang.toUpperCase();

    const m = document.getElementById('welcome-intro-modal');
    if (!hasSeen && m) {
      this.showWelcomeModal();
    } else if (m) {
      this.hideWelcomeModal();
    }
  }

  public showWelcomeModal(): void {
    const m = document.getElementById('welcome-intro-modal');
    if (m) {
      m.classList.remove('hidden');
      m.classList.add('flex');
    }
  }

  public hideWelcomeModal(): void {
    const m = document.getElementById('welcome-intro-modal');
    if (m) {
      m.classList.add('hidden');
      m.classList.remove('flex');
    }
  }

  private registerServiceWorker(): void {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.log('SW registration notice:', err);
        });
      });
    }
  }
}

// Bootstrap app on DOMContentLoaded
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new QiblaApp();
    app.init();
    (window as unknown as { checkQiblaApp: QiblaApp }).checkQiblaApp = app;
  });
}
