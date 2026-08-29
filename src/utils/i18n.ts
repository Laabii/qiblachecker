/**
 * Natural Native Internationalization (i18n) Engine
 * Authentic, culturally accurate translations for English, Arabic (العربية), and Malayalam (മലയാളം).
 * CheckQibla.com
 */

export type SupportedLanguage = 'en' | 'ar' | 'ml';

export interface Translations {
  // Navigation & Brand
  appTitle: string;
  appSubtitle: string;
  compassDial: string;
  pointerArrow: string;
  startCompass: string;
  compassActive: string;
  calibrating: string;
  settings: string;
  share: string;
  nearbyMosques: string;
  
  // Hero & Live Status
  heroHeadline: string;
  heroSubtitle: string;
  rotateTowardsKaaba: string;
  facingKaaba: string;
  readyForSalah: string;
  holdPhoneFlat: string;
  rotateBodyPrompt: string;
  turnRight: (deg: number) => string;
  turnLeft: (deg: number) => string;
  kaabaAzimuth: string;

  // Metric Cards
  qiblaBearing: string;
  fromTrueNorth: string;
  locationAndCoords: string;
  detectingLocation: string;
  wrongLocationRetry: string;
  distanceToKaaba: string;
  distanceSubtitle: string;

  // Search & History
  searchPlaceholder: string;
  useCurrentGps: string;
  recentPlaces: string;
  saveThisPlace: string;
  savedSuccess: string;
  savedLocationsTitle: string;
  savedLocationsSubtitle: string;
  clearHistory: string;
  activeBadge: string;
  loadLocation: string;
  currentFix: string;

  // Prayer Times
  prayerTimesTitle: string;
  todayPrayerTimes: string;
  nextPrayerLabel: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;

  // Islamic Holidays
  upcomingHolidaysTitle: string;
  hijriCalendar: string;
  nextBadge: string;
  todayBadge: string;
  daysRemaining: (days: number) => string;
  findMosquesTitle: string;
  findMosquesDesc: string;
  findMosquesBtn: string;

  // Welcome Modal
  welcomeTitle: string;
  welcomeDesc: string;
  selectLanguageLabel: string;
  permissionNotice: string;
  findQiblaBtn: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, Translations> = {
  en: {
    appTitle: 'CheckQibla',
    appSubtitle: 'Accurate Qibla Compass',
    compassDial: '360° Compass',
    pointerArrow: 'Pointer Arrow',
    startCompass: 'Start Qibla Compass',
    compassActive: 'Compass Active',
    calibrating: 'Calibrate',
    settings: 'Settings',
    share: 'Share',
    nearbyMosques: 'Nearby Mosques',

    heroHeadline: 'Find the exact Qibla direction for prayer.',
    heroSubtitle: 'High-precision web compass with real-time Kaaba angle, geodesic distance, Islamic holidays calendar, and live prayer times.',
    rotateTowardsKaaba: 'Rotate Phone Towards Kaaba',
    facingKaaba: 'Facing Holy Kaaba',
    readyForSalah: 'You are aligned with Makkah. Ready for Salah.',
    holdPhoneFlat: 'Hold phone flat to activate live compass guidance',
    rotateBodyPrompt: 'Rotate your body until the needle turns green',
    turnRight: (deg) => `Turn ${deg}° Right ↻`,
    turnLeft: (deg) => `Turn ${deg}° Left ↺`,
    kaabaAzimuth: 'Kaaba Azimuth',

    qiblaBearing: 'Qibla Bearing',
    fromTrueNorth: 'Clockwise from True North',
    locationAndCoords: 'Location & Coordinates',
    detectingLocation: 'Detecting location...',
    wrongLocationRetry: 'Wrong Location? Try Again',
    distanceToKaaba: 'Distance to Kaaba',
    distanceSubtitle: 'Direct Great-Circle distance to Makkah',

    searchPlaceholder: 'Search any city or country (e.g. London, Dubai, Kochi, New York)...',
    useCurrentGps: 'Use Current GPS',
    recentPlaces: 'Recent Places:',
    saveThisPlace: 'Save This Place',
    savedSuccess: 'Saved!',
    savedLocationsTitle: 'Your Saved & Frequent Locations',
    savedLocationsSubtitle: 'Your saved and recently checked locations. Tap any place to instantly load its live Qibla compass bearing and 5 daily prayer times.',
    clearHistory: 'Clear History',
    activeBadge: 'ACTIVE',
    loadLocation: 'Load Location →',
    currentFix: 'Current Fix ✓',

    prayerTimesTitle: 'Daily Prayer Times & Next Salah Countdown',
    todayPrayerTimes: 'Today Prayer Times',
    nextPrayerLabel: 'Next Prayer in',
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',

    upcomingHolidaysTitle: 'Upcoming Islamic Holidays',
    hijriCalendar: 'Hijri Calendar',
    nextBadge: 'Next',
    todayBadge: 'Today 🎉',
    daysRemaining: (days) => `In ${days}d`,
    findMosquesTitle: 'Find Mosques Near You',
    findMosquesDesc: 'Open live Google Maps to view all nearby Masjids, walking directions, and prayer facilities from your exact GPS location.',
    findMosquesBtn: 'Find Mosques on Google Maps',

    welcomeTitle: 'Find Your Qibla',
    welcomeDesc: 'Accurate GPS compass, real-time Kaaba direction finder, and precise local prayer times worldwide.',
    selectLanguageLabel: 'Select Language / ഭാഷ / لغة',
    permissionNotice: 'Tap below to allow location & compass for instant alignment.',
    findQiblaBtn: 'Find Qibla Direction'
  },

  ar: {
    appTitle: 'اتجاه القبلة',
    appSubtitle: 'بوصلة القبلة الدقيقة',
    compassDial: 'بوصلة 360°',
    pointerArrow: 'سهم التوجيه',
    startCompass: 'تشغيل البوصلة',
    compassActive: 'البوصلة نشطة',
    calibrating: 'معايرة',
    settings: 'الإعدادات',
    share: 'مشاركة',
    nearbyMosques: 'مساجد قريبة',

    heroHeadline: 'حدد اتجاه القبلة بدقة متناهية للصلاة.',
    heroSubtitle: 'بوصلة إلكترونية دقيقة لحساب زاوية الكعبة المشرفة، المسافة الجيوديسية، التقويم الهجري، ومواقيت الصلاة المباشرة.',
    rotateTowardsKaaba: 'وجّه هاتفك نحو القبلة',
    facingKaaba: 'أنت تواجه الكعبة المشرفة',
    readyForSalah: 'أنت في اتجاه مكة المكرمة تماماً. جاهز للصلاة.',
    holdPhoneFlat: 'ضع الهاتف بشكل أفقي لتفعيل البوصلة المباشرة',
    rotateBodyPrompt: 'استدر حتى يتحول المؤشر إلى اللون الأخضر',
    turnRight: (deg) => `استدر ${deg}° يميناً ↻`,
    turnLeft: (deg) => `استدر ${deg}° يساراً ↺`,
    kaabaAzimuth: 'زاوية القبلة',

    qiblaBearing: 'درجة القبلة',
    fromTrueNorth: 'مع اتجاه عقارب الساعة من الشمال الحقيقي',
    locationAndCoords: 'الموقع والإحداثيات',
    detectingLocation: 'جارٍ تحديد الموقع...',
    wrongLocationRetry: 'موقع غير دقيق؟ حاول ثانية',
    distanceToKaaba: 'المسافة إلى الكعبة المشرفة',
    distanceSubtitle: 'المسافة المباشرة عبر خط الدائرة العظمى إلى مكة',

    searchPlaceholder: 'ابحث عن أي مدينة أو قرية (مثل مكة، دبي، القاهرة، الرياض)...',
    useCurrentGps: 'استخدام الموقع الحالي GPS',
    recentPlaces: 'المواقع الأخيرة:',
    saveThisPlace: 'حفظ هذا الموقع',
    savedSuccess: 'تم الحفظ!',
    savedLocationsTitle: 'مواقعك المحفوظة والمفضلة',
    savedLocationsSubtitle: 'المواقع التي تم حفظها مؤخراً. اضغط على أي موقع لعرض اتجاه القبلة ومواقيت الصلاة فوراً.',
    clearHistory: 'مسح السجل',
    activeBadge: 'الحالي',
    loadLocation: 'عرض الموقع ←',
    currentFix: 'الموقع الحالي ✓',

    prayerTimesTitle: 'مواقيت الصلاة اليومية والعد التنازلي',
    todayPrayerTimes: 'مواقيت الصلاة اليوم',
    nextPrayerLabel: 'الصلاة القادمة بعد',
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',

    upcomingHolidaysTitle: 'المناسبات والأعياد الإسلامية القادمة',
    hijriCalendar: 'التقويم الهجري',
    nextBadge: 'القادم',
    todayBadge: 'اليوم 🎉',
    daysRemaining: (days) => `بعد ${days} يوم`,
    findMosquesTitle: 'ابحث عن المساجد القريبة منك',
    findMosquesDesc: 'افتح خرائط Google مباشرة للاطلاع على المساجد القريبة ومسارات المشي من موقعك الحالي.',
    findMosquesBtn: 'البحث عن مساجد في خرائط Google',

    welcomeTitle: 'حدد اتجاه قبلتك',
    welcomeDesc: 'بوصلة دقيقة بنظام GPS لتحديد اتجاه الكعبة المشرفة ومواقيت الصلاة في أي مكان في العالم.',
    selectLanguageLabel: 'اختر اللغة / Select Language',
    permissionNotice: 'اضغط بالأسفل للسماح بتحديد الموقع ومستشعرات البوصلة.',
    findQiblaBtn: 'ابدأ تحديد القبلة'
  },

  ml: {
    appTitle: 'ചെക്ക് ഖിബ്‌ല',
    appSubtitle: 'കൃത്യമായ ഖിബ്‌ല കോമ്പസ്',
    compassDial: '360° കോമ്പസ്',
    pointerArrow: 'പോയിന്റർ അമ്പടയാളം',
    startCompass: 'കോമ്പസ് ഓൺ ചെയ്യുക',
    compassActive: 'കോമ്പസ് പ്രവർത്തിക്കുന്നു',
    calibrating: 'കാലിബ്രേറ്റ്',
    settings: 'ക്രമീകരണങ്ങൾ',
    share: 'പങ്കുവെക്കുക',
    nearbyMosques: 'അടുത്തുള്ള പള്ളികൾ',

    heroHeadline: 'നിസ്കാരത്തിനുള്ള കൃത്യമായ ഖിബ്‌ല ദിശ കണ്ടെത്താം.',
    heroSubtitle: 'കഅ്ബയുടെ കൃത്യമായ ഡിഗ്രി, നിസ്കാര സമയങ്ങൾ, ഇസ്ലാമിക കലണ്ടർ, യാത്രാ ദൂരം എന്നിവ അറിയാനുള്ള കൃത്യതയാർന്ന ഖിബ്‌ല കോമ്പസ്.',
    rotateTowardsKaaba: 'ഫോൺ കഅ്ബയുടെ നേരെ തിരിക്കുക',
    facingKaaba: 'നിങ്ങൾ കഅ്ബയുടെ നേരെയാണ്',
    readyForSalah: 'കഅ്ബയിലേക്ക് കൃത്യമായി തിരിഞ്ഞിരിക്കുന്നു. നിസ്കാരത്തിന് തയ്യാറാണ്.',
    holdPhoneFlat: 'ലൈവ് കോമ്പസിനായി ഫോൺ നിരപ്പായി പിടിക്കുക',
    rotateBodyPrompt: 'സൂചി പച്ചയാകുന്നതുവരെ ഫോണുമായി തിരിയുക',
    turnRight: (deg) => `വലത്തോട്ട് ${deg}° തിരിയുക ↻`,
    turnLeft: (deg) => `ഇടത്തോട്ട് ${deg}° തിരിയുക ↺`,
    kaabaAzimuth: 'ഖിബ്‌ല ഡിഗ്രി',

    qiblaBearing: 'ഖിബ്‌ല ആംഗിൾ',
    fromTrueNorth: 'യഥാർത്ഥ വടക്ക് ദിശയിൽ നിന്നുള്ള അളവ്',
    locationAndCoords: 'സ്ഥലവും ലൊക്കേഷനും',
    detectingLocation: 'ലൊക്കേഷൻ കണ്ടെത്തുന്നു...',
    wrongLocationRetry: 'സ്ഥലം തെറ്റാണോ? വീണ്ടും ശ്രമിക്കുക',
    distanceToKaaba: 'കഅ്ബയിലേക്കുള്ള ദൂരം',
    distanceSubtitle: 'മക്കയിലേക്കുള്ള നേരിട്ടുള്ള ആകാശ ദൂരം',

    searchPlaceholder: 'സ്ഥലം അല്ലെങ്കിൽ ജില്ല തിരയുക (ഉദാ: കണ്ണൂർ, കോഴിക്കോട്, കൊച്ചി, ദുബായ്)...',
    useCurrentGps: 'നിലവിലെ GPS ഉപയോഗിക്കുക',
    recentPlaces: 'സന്ദർശിച്ച സ്ഥലങ്ങൾ:',
    saveThisPlace: 'ഈ സ്ഥലം സേവ് ചെയ്യുക',
    savedSuccess: 'സേവ് ചെയ്തു!',
    savedLocationsTitle: 'നിങ്ങൾ സേവ് ചെയ്ത സ്ഥലങ്ങൾ',
    savedLocationsSubtitle: 'നിങ്ങൾ പരിശോധിച്ച സ്ഥലങ്ങൾ. ഖിബ്‌ല ദിശയും 5 നേരത്തെ നിസ്കാര സമയങ്ങളും ഉടനടി കാണാൻ ടാപ്പ് ചെയ്യുക.',
    clearHistory: 'ഹിസ്റ്ററി ഒഴിവാക്കുക',
    activeBadge: 'ആക്ടീവ്',
    loadLocation: 'ഈ സ്ഥലം കാണുക →',
    currentFix: 'നിലവിലെ സ്ഥലം ✓',

    prayerTimesTitle: 'നിസ്കാര സമയങ്ങളും അടുത്ത വഖ്‌ത് കൗണ്ട്ഡൗണും',
    todayPrayerTimes: 'ഇന്നത്തെ നിസ്കാര സമയം',
    nextPrayerLabel: 'അടുത്ത നിസ്കാരം',
    fajr: 'സുബ്ഹി',
    sunrise: 'സൂര്യോദയം',
    dhuhr: 'ളുഹ്ർ',
    asr: 'അസ്വർ',
    maghrib: 'മഗ്‌രിബ്',
    isha: 'ഇശാ',

    upcomingHolidaysTitle: 'വരാനിരിക്കുന്ന ഇസ്ലാമിക വിശേഷ ദിവസങ്ങൾ',
    hijriCalendar: 'ഹിജ്റ കലണ്ടർ',
    nextBadge: 'അടുത്തത്',
    todayBadge: 'ഇന്ന് 🎉',
    daysRemaining: (days) => `${days} ദിവസത്തിനകം`,
    findMosquesTitle: 'അടുത്തുള്ള പള്ളികൾ കണ്ടെത്തുക',
    findMosquesDesc: 'നിങ്ങൾ നിൽക്കുന്ന സ്ഥലത്തുനിന്ന് അടുത്തുള്ള മസ്ജിദുകളും അങ്ങോട്ടേക്കുള്ള വഴികളും ഗൂഗിൾ മാപ്പിൽ കാണാം.',
    findMosquesBtn: 'ഗൂഗിൾ മാപ്പിൽ പള്ളികൾ കാണുക',

    welcomeTitle: 'ഖിബ്‌ല കണ്ടെത്താം',
    welcomeDesc: 'GPS സഹായത്തോടെ ലോകത്തെവിടെനിന്നും കഅ്ബയുടെ ദിശയും കൃത്യമായ നിസ്കാര സമയങ്ങളും അറിയാം.',
    selectLanguageLabel: 'ഭാഷ തിരഞ്ഞെടുക്കുക / Select Language',
    permissionNotice: 'കൃത്യമായി ദിശ അറിയാൻ താഴെ ടാപ്പ് ചെയ്ത് ലൊക്കേഷൻ അനുവദിക്കുക.',
    findQiblaBtn: 'ഖിബ്‌ല കണ്ടെത്തുക'
  }
};
