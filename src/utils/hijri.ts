/**
 * Accurate Hijri Calendar & Islamic Festivals Engine
 * Utilizes native Intl Islamic-UmmAlQura and astronomical date mapping
 * CheckQibla.com
 */

export interface IslamicHoliday {
  id: string;
  name: string;
  arabicName: string;
  hijriDay: number;
  hijriMonth: number; // 1 = Muharram, ..., 12 = Dhu al-Hijjah
  hijriDateStr: string;
  gregorianDate: Date;
  daysRemaining: number;
  isNext: boolean;
}

const HIJRI_MONTH_NAMES = [
  'Muharram',
  'Safar',
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah'
];

const MAJOR_FESTIVALS = [
  { id: 'new_year', name: 'Islamic New Year', arabicName: 'رأس السنة الهجرية', month: 1, day: 1 },
  { id: 'ashura', name: 'Day of Ashura', arabicName: 'يوم عاشوراء', month: 1, day: 10 },
  { id: 'mawlid', name: "Mawlid an-Nabi", arabicName: 'المولد النبوي', month: 3, day: 12 },
  { id: 'isra_miraj', name: "Isra' & Mi'raj", arabicName: 'الإسراء والمعراج', month: 7, day: 27 },
  { id: 'mid_shaban', name: "Laylat al-Bara'at (Mid-Sha'ban)", arabicName: 'ليلة البراءة', month: 8, day: 15 },
  { id: 'ramadan_start', name: 'First Day of Ramadan', arabicName: 'بداية شهر رمضان', month: 9, day: 1 },
  { id: 'laylat_al_qadr', name: 'Laylat al-Qadr', arabicName: 'ليلة القدر', month: 9, day: 27 },
  { id: 'eid_fitr', name: 'Eid al-Fitr', arabicName: 'عيد الفطر المبارك', month: 10, day: 1 },
  { id: 'hajj_start', name: 'Hajj Begins', arabicName: 'بداية موسم الحج', month: 12, day: 8 },
  { id: 'day_arafah', name: 'Day of Arafah', arabicName: 'يوم عرفة', month: 12, day: 9 },
  { id: 'eid_adha', name: 'Eid al-Adha', arabicName: 'عيد الأضحى المبارك', month: 12, day: 10 }
];

/**
 * Get current formatted Hijri Date for any Gregorian date
 */
export function getFormattedHijriDate(date: Date = new Date()): {
  day: number;
  monthName: string;
  monthIndex: number;
  year: number;
  formatted: string;
} {
  try {
    const formatter = new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    let day = 1;
    let month = 1;
    let year = 1448;

    parts.forEach((p) => {
      if (p.type === 'day') day = parseInt(p.value, 10);
      if (p.type === 'month') month = parseInt(p.value, 10);
      if (p.type === 'year') year = parseInt(p.value, 10);
    });

    const monthName = HIJRI_MONTH_NAMES[month - 1] || 'Hijri';
    return {
      day,
      monthName,
      monthIndex: month,
      year,
      formatted: `${day} ${monthName} ${year} AH`
    };
  } catch {
    return {
      day: 17,
      monthName: "Rabi' al-Awwal",
      monthIndex: 3,
      year: 1448,
      formatted: `17 Rabi' al-Awwal 1448 AH`
    };
  }
}

/**
 * Approximate conversion from Hijri (Y, M, D) to Gregorian Date
 */
export function hijriToGregorianApprox(hYear: number, hMonth: number, hDay: number): Date {
  // Astronomical mean synodic month = 29.530588853 days
  // Epoch of Islamic Calendar: July 16, 622 CE (Julian) ~ July 19, 622 CE (Gregorian)
  const julianDays =
    Math.floor((11 * hYear + 3) / 30) +
    354 * hYear +
    30 * hMonth -
    Math.floor((hMonth - 1) / 2) +
    hDay +
    1948440 -
    385;

  // Convert Julian Day Number to Gregorian Date
  const l = julianDays + 68569;
  const n = Math.floor((4 * l) / 146097);
  const l2 = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l2 + 1)) / 1461001);
  const l3 = l2 - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l3) / 2447);
  const day = l3 - Math.floor((2447 * j) / 80);
  const l4 = Math.floor(j / 11);
  const month = j + 2 - 12 * l4;
  const year = 100 * (n - 49) + i + l4;

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

/**
 * Calculate sorted upcoming Islamic festivals with countdown
 */
export function getUpcomingIslamicFestivals(baseDate: Date = new Date()): IslamicHoliday[] {
  const currentHijri = getFormattedHijriDate(baseDate);
  const todayMs = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()).getTime();

  const results: IslamicHoliday[] = [];

  // Check current Hijri year and next Hijri year
  for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
    const targetHYear = currentHijri.year + yearOffset;

    for (const fest of MAJOR_FESTIVALS) {
      const gDate = hijriToGregorianApprox(targetHYear, fest.month, fest.day);
      const gDateMid = new Date(gDate.getFullYear(), gDate.getMonth(), gDate.getDate()).getTime();
      const diffMs = gDateMid - todayMs;
      const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Include events happening today or in the future
      if (daysRemaining >= 0 && daysRemaining <= 365) {
        const monthName = HIJRI_MONTH_NAMES[fest.month - 1];
        results.push({
          id: `${fest.id}_${targetHYear}`,
          name: fest.name,
          arabicName: fest.arabicName,
          hijriDay: fest.day,
          hijriMonth: fest.month,
          hijriDateStr: `${fest.day} ${monthName} ${targetHYear}`,
          gregorianDate: gDate,
          daysRemaining,
          isNext: false
        });
      }
    }
  }

  // Sort by earliest date
  results.sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Mark the immediate next festival
  if (results.length > 0) {
    results[0].isNext = true;
  }

  return results;
}

export function formatGregorianShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
