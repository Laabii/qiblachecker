/**
 * Global Major Cities Index for Instant Offline Search & Quick Selection
 * CheckQibla.com
 */

export interface CityLocation {
  city: string;
  country: string;
  lat: number;
  lng: number;
  state?: string;
  district?: string;
  timezone?: string;
}

export const POPULAR_CITIES: CityLocation[] = [
  // Holy Cities & Middle East
  { city: 'Makkah', country: 'Saudi Arabia', lat: 21.4225, lng: 39.8262 },
  { city: 'Madinah', country: 'Saudi Arabia', lat: 24.5247, lng: 39.5692 },
  { city: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
  { city: 'Jeddah', country: 'Saudi Arabia', lat: 21.5433, lng: 39.1728 },
  { city: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708 },
  { city: 'Abu Dhabi', country: 'United Arab Emirates', lat: 24.4539, lng: 54.3773 },
  { city: 'Sharjah', country: 'United Arab Emirates', lat: 25.3463, lng: 55.4209 },
  { city: 'Doha', country: 'Qatar', lat: 25.2854, lng: 51.5310 },
  { city: 'Kuwait City', country: 'Kuwait', lat: 29.3759, lng: 47.9774 },
  { city: 'Manama', country: 'Bahrain', lat: 26.2285, lng: 50.5860 },
  { city: 'Muscat', country: 'Oman', lat: 23.5880, lng: 58.3829 },
  { city: 'Amman', country: 'Jordan', lat: 31.9454, lng: 35.9284 },
  { city: 'Jerusalem / Al-Quds', country: 'Palestine', lat: 31.7683, lng: 35.2137 },
  { city: 'Beirut', country: 'Lebanon', lat: 33.8938, lng: 35.5018 },
  { city: 'Baghdad', country: 'Iraq', lat: 33.3152, lng: 44.3661 },
  { city: 'Erbil', country: 'Iraq', lat: 36.1911, lng: 44.0091 },
  { city: 'Tehran', country: 'Iran', lat: 35.6892, lng: 51.3890 },
  { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { city: 'Alexandria', country: 'Egypt', lat: 31.2001, lng: 29.9187 },
  { city: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784 },
  { city: 'Ankara', country: 'Turkey', lat: 39.9334, lng: 32.8597 },

  // Kerala, India - Towns & Municipalities (Hyper-local precision)
  { city: 'Iritty', country: 'India', state: 'Kerala', district: 'Kannur', lat: 11.9818, lng: 75.6669 },
  { city: 'Kannur', country: 'India', state: 'Kerala', district: 'Kannur', lat: 11.8745, lng: 75.3704 },
  { city: 'Thalassery (Tellicherry)', country: 'India', state: 'Kerala', district: 'Kannur', lat: 11.7491, lng: 75.4890 },
  { city: 'Mattannur', country: 'India', state: 'Kerala', district: 'Kannur', lat: 11.9167, lng: 75.5667 },
  { city: 'Payyanur', country: 'India', state: 'Kerala', district: 'Kannur', lat: 12.1000, lng: 75.2000 },
  { city: 'Taliparamba', country: 'India', state: 'Kerala', district: 'Kannur', lat: 12.0437, lng: 75.3585 },
  { city: 'Kuthuparamba', country: 'India', state: 'Kerala', district: 'Kannur', lat: 11.8267, lng: 75.5683 },
  { city: 'Panoor', country: 'India', state: 'Kerala', district: 'Kannur', lat: 11.7583, lng: 75.5833 },
  { city: 'Peravoor', country: 'India', state: 'Kerala', district: 'Kannur', lat: 11.8900, lng: 75.7800 },
  { city: 'Sreekandapuram', country: 'India', state: 'Kerala', district: 'Kannur', lat: 12.0292, lng: 75.5186 },
  { city: 'Anjarakandy', country: 'India', state: 'Kerala', district: 'Kannur', lat: 11.8542, lng: 75.5042 },
  { city: 'Valapattanam', country: 'India', state: 'Kerala', district: 'Kannur', lat: 11.9167, lng: 75.3667 },
  { city: 'Chakkarakkal', country: 'India', state: 'Kerala', district: 'Kannur', lat: 11.8600, lng: 75.4600 },

  // Kerala - Other Districts & Centers
  { city: 'Kozhikode (Calicut)', country: 'India', state: 'Kerala', district: 'Kozhikode', lat: 11.2588, lng: 75.7804 },
  { city: 'Vatakara', country: 'India', state: 'Kerala', district: 'Kozhikode', lat: 11.6083, lng: 75.5917 },
  { city: 'Koyilandy', country: 'India', state: 'Kerala', district: 'Kozhikode', lat: 11.4333, lng: 75.7000 },
  { city: 'Malappuram', country: 'India', state: 'Kerala', district: 'Malappuram', lat: 11.0510, lng: 76.0711 },
  { city: 'Manjeri', country: 'India', state: 'Kerala', district: 'Malappuram', lat: 11.1194, lng: 76.1206 },
  { city: 'Perinthalmanna', country: 'India', state: 'Kerala', district: 'Malappuram', lat: 10.9760, lng: 76.2254 },
  { city: 'Tirur', country: 'India', state: 'Kerala', district: 'Malappuram', lat: 10.9167, lng: 75.9234 },
  { city: 'Ponnani', country: 'India', state: 'Kerala', district: 'Malappuram', lat: 10.7719, lng: 75.9250 },
  { city: 'Kottakkal', country: 'India', state: 'Kerala', district: 'Malappuram', lat: 10.9983, lng: 75.9983 },
  { city: 'Nilambur', country: 'India', state: 'Kerala', district: 'Malappuram', lat: 11.2764, lng: 76.2244 },
  { city: 'Kochi (Cochin)', country: 'India', state: 'Kerala', district: 'Ernakulam', lat: 9.9312, lng: 76.2673 },
  { city: 'Aluva', country: 'India', state: 'Kerala', district: 'Ernakulam', lat: 10.1076, lng: 76.3516 },
  { city: 'Thiruvananthapuram (Trivandrum)', country: 'India', state: 'Kerala', district: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366 },
  { city: 'Thrissur', country: 'India', state: 'Kerala', district: 'Thrissur', lat: 10.5276, lng: 76.2144 },
  { city: 'Guruvayur', country: 'India', state: 'Kerala', district: 'Thrissur', lat: 10.5947, lng: 76.0409 },
  { city: 'Kollam', country: 'India', state: 'Kerala', district: 'Kollam', lat: 8.8932, lng: 76.6141 },
  { city: 'Palakkad', country: 'India', state: 'Kerala', district: 'Palakkad', lat: 10.7867, lng: 76.6548 },
  { city: 'Alappuzha (Alleppey)', country: 'India', state: 'Kerala', district: 'Alappuzha', lat: 9.4981, lng: 76.3388 },
  { city: 'Kottayam', country: 'India', state: 'Kerala', district: 'Kottayam', lat: 9.5916, lng: 76.5222 },
  { city: 'Kasaragod', country: 'India', state: 'Kerala', district: 'Kasaragod', lat: 12.4996, lng: 74.9869 },
  { city: 'Kanhangad', country: 'India', state: 'Kerala', district: 'Kasaragod', lat: 12.3083, lng: 75.0917 },
  { city: 'Wayanad (Kalpetta)', country: 'India', state: 'Kerala', district: 'Wayanad', lat: 11.6050, lng: 76.0827 },
  { city: 'Sulthan Bathery', country: 'India', state: 'Kerala', district: 'Wayanad', lat: 11.6667, lng: 76.2833 },
  { city: 'Mananthavady', country: 'India', state: 'Kerala', district: 'Wayanad', lat: 11.8000, lng: 76.0000 },

  // India - Other Major Centers
  { city: 'Delhi / New Delhi', country: 'India', lat: 28.6139, lng: 77.2090 },
  { city: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },
  { city: 'Hyderabad', country: 'India', lat: 17.3850, lng: 78.4867 },
  { city: 'Bangalore (Bengaluru)', country: 'India', lat: 12.9716, lng: 77.5946 },
  { city: 'Chennai', country: 'India', lat: 13.0827, lng: 80.2707 },
  { city: 'Kolkata', country: 'India', lat: 22.5726, lng: 88.3639 },
  { city: 'Mangalore', country: 'India', lat: 12.9141, lng: 74.8560 },

  // South Asia
  { city: 'Karachi', country: 'Pakistan', lat: 24.8607, lng: 67.0011 },
  { city: 'Lahore', country: 'Pakistan', lat: 31.5204, lng: 74.3587 },
  { city: 'Islamabad', country: 'Pakistan', lat: 33.6844, lng: 73.0479 },
  { city: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lng: 90.4125 },
  { city: 'Chittagong', country: 'Bangladesh', lat: 22.3569, lng: 91.7832 },
  { city: 'Colombo', country: 'Sri Lanka', lat: 6.9271, lng: 79.8612 },
  { city: 'Male', country: 'Maldives', lat: 4.1755, lng: 73.5093 },

  // Southeast Asia
  { city: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456 },
  { city: 'Surabaya', country: 'Indonesia', lat: -7.2575, lng: 112.7521 },
  { city: 'Bandung', country: 'Indonesia', lat: -6.9175, lng: 107.6191 },
  { city: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869 },
  { city: 'Penang', country: 'Malaysia', lat: 5.4164, lng: 100.3327 },
  { city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },

  // Europe & Americas
  { city: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { city: 'Birmingham', country: 'United Kingdom', lat: 52.4862, lng: -1.8904 },
  { city: 'Manchester', country: 'United Kingdom', lat: 53.4808, lng: -2.2426 },
  { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { city: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
  { city: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060 },
  { city: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298 },
  { city: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437 },
  { city: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 }
];

export function searchCities(query: string, limit: number = 8): CityLocation[] {
  if (!query || query.trim().length === 0) {
    return POPULAR_CITIES.slice(0, limit);
  }
  const clean = query.toLowerCase().trim();
  return POPULAR_CITIES.filter(
    (c) =>
      c.city.toLowerCase().includes(clean) ||
      c.country.toLowerCase().includes(clean) ||
      (c.state && c.state.toLowerCase().includes(clean)) ||
      (c.district && c.district.toLowerCase().includes(clean))
  ).slice(0, limit);
}
