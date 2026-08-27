export const ALL_LOCATIONS_OPTION = 'All Locations';

export interface CityItem {
  id: string;
  name: string;
  state?: string;
  isPopular?: boolean;
}

export const POPULAR_CITIES: CityItem[] = [
  { id: 'all', name: 'All Locations', isPopular: true },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', isPopular: true },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', isPopular: true },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', isPopular: true },
  { id: 'delhi', name: 'New Delhi', state: 'Delhi NCR', isPopular: true },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', isPopular: true },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', isPopular: true },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', isPopular: true },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', isPopular: true },
  { id: 'goa', name: 'Goa', state: 'Goa', isPopular: true },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', isPopular: true },
  { id: 'kochi', name: 'Kochi', state: 'Kerala', isPopular: true },
  { id: 'chandigarh', name: 'Chandigarh', state: 'Punjab/Haryana', isPopular: true },
];

export const OTHER_CITIES: CityItem[] = [
  { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh' },
  { id: 'indore', name: 'Indore', state: 'Madhya Pradesh' },
  { id: 'nagpur', name: 'Nagpur', state: 'Maharashtra' },
  { id: 'coimbatore', name: 'Coimbatore', state: 'Tamil Nadu' },
  { id: 'visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh' },
  { id: 'surat', name: 'Surat', state: 'Gujarat' },
  { id: 'patna', name: 'Patna', state: 'Bihar' },
  { id: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha' },
  { id: 'guwahati', name: 'Guwahati', state: 'Assam' },
  { id: 'thiruvananthapuram', name: 'Thiruvananthapuram', state: 'Kerala' },
  { id: 'london', name: 'London', state: 'United Kingdom' },
  { id: 'dubai', name: 'Dubai', state: 'United Arab Emirates' },
  { id: 'singapore', name: 'Singapore', state: 'Singapore' },
  { id: 'new-york', name: 'New York', state: 'United States' },
];

export const ALL_CITIES = [...POPULAR_CITIES, ...OTHER_CITIES];

export const searchCities = (query: string): CityItem[] => {
  if (!query || !query.trim()) {
    return ALL_CITIES;
  }
  const q = query.trim().toLowerCase();
  return ALL_CITIES.filter(
    (c) => c.name.toLowerCase().includes(q) || (c.state && c.state.toLowerCase().includes(q))
  );
};
