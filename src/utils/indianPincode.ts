/**
 * Indian Postal PIN Code Lookup & Auto-fill Utility
 * Exclusively designed for Indian Postal Network (110000 - 859999)
 */

export interface IndianPincodeResult {
  pinCode: string;
  city: string;
  district: string;
  state: string;
  country: 'India';
  localities: string[];
  isDeliverable: boolean;
  source: 'india_post_api' | 'local_database';
}

// In-memory cache for ultra-fast instant lookups
const pincodeCache = new Map<string, IndianPincodeResult>();

/**
 * Top Indian Metro and Tier-1/2 PIN ranges for instant offline fallback
 */
const KNOWN_INDIAN_PINCODES: Record<string, { city: string; state: string; district: string; localities: string[] }> = {
  // Bengaluru / Karnataka
  '560001': { city: 'Bengaluru', district: 'Bangalore Urban', state: 'Karnataka', localities: ['MG Road', 'Brigade Road', 'Cubbon Park'] },
  '560038': { city: 'Bengaluru', district: 'Bangalore Urban', state: 'Karnataka', localities: ['Indiranagar', 'HAL 2nd Stage', 'Defence Colony'] },
  '560034': { city: 'Bengaluru', district: 'Bangalore Urban', state: 'Karnataka', localities: ['Koramangala', 'St Johns Medical College'] },
  '560100': { city: 'Bengaluru', district: 'Bangalore Urban', state: 'Karnataka', localities: ['Electronic City Phase 1', 'Wipro Gate'] },
  '560066': { city: 'Bengaluru', district: 'Bangalore Urban', state: 'Karnataka', localities: ['Whitefield', 'Hope Farm', 'ITPL'] },
  '560076': { city: 'Bengaluru', district: 'Bangalore Urban', state: 'Karnataka', localities: ['JP Nagar', 'Bannerghatta Road', 'Arekere'] },
  '560011': { city: 'Bengaluru', district: 'Bangalore Urban', state: 'Karnataka', localities: ['Jayanagar 4th Block', 'Madhavan Park'] },
  '560004': { city: 'Bengaluru', district: 'Bangalore Urban', state: 'Karnataka', localities: ['Basavanagudi', 'Gandhi Bazaar'] },
  '560085': { city: 'Bengaluru', district: 'Bangalore Urban', state: 'Karnataka', localities: ['Banashankari 3rd Stage', 'Kathriguppe'] },
  '560092': { city: 'Bengaluru', district: 'Bangalore Urban', state: 'Karnataka', localities: ['Hebbal', 'Sahakara Nagar'] },

  // Mumbai & MMR / Maharashtra
  '400001': { city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', localities: ['Fort', 'Nariman Point', 'Colaba'] },
  '400050': { city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', localities: ['Bandra West', 'Pali Hill', 'Hill Road'] },
  '400051': { city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', localities: ['Bandra East', 'BKC (Bandra Kurla Complex)'] },
  '400053': { city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', localities: ['Andheri West', 'Lokhandwala', 'Oshiwara'] },
  '400069': { city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', localities: ['Andheri East', 'Chakala', 'JB Nagar'] },
  '400076': { city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', localities: ['Powai', 'Hiranandani Gardens', 'IIT Bombay'] },
  '400092': { city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', localities: ['Borivali West', 'Shimpoli', 'Gorai'] },
  '411001': { city: 'Pune', district: 'Pune', state: 'Maharashtra', localities: ['Pune Cantonment', 'Camp', 'Station Road'] },
  '411004': { city: 'Pune', district: 'Pune', state: 'Maharashtra', localities: ['Deccan Gymkhana', 'FC Road', 'Shivajinagar'] },
  '411014': { city: 'Pune', district: 'Pune', state: 'Maharashtra', localities: ['Viman Nagar', 'Kalyani Nagar', 'Airport Road'] },
  '411057': { city: 'Pune', district: 'Pune', state: 'Maharashtra', localities: ['Hinjawadi Phase 1', 'Phase 2', 'Wakad'] },

  // Delhi NCR
  '110001': { city: 'New Delhi', district: 'Central Delhi', state: 'Delhi', localities: ['Connaught Place', 'Barakhamba', 'Janpath'] },
  '110003': { city: 'New Delhi', district: 'South Delhi', state: 'Delhi', localities: ['Khan Market', 'Golf Links', 'Lodhi Colony'] },
  '110016': { city: 'New Delhi', district: 'South West Delhi', state: 'Delhi', localities: ['Hauz Khas', 'Green Park', 'Safdarjung'] },
  '110019': { city: 'New Delhi', district: 'South East Delhi', state: 'Delhi', localities: ['Kalkaji', 'Nehru Place', 'Chittaranjan Park'] },
  '110024': { city: 'New Delhi', district: 'South Delhi', state: 'Delhi', localities: ['Lajpat Nagar', 'Defence Colony'] },
  '110070': { city: 'New Delhi', district: 'South West Delhi', state: 'Delhi', localities: ['Vasant Kunj', 'Mahipalpur'] },
  '110085': { city: 'New Delhi', district: 'North West Delhi', state: 'Delhi', localities: ['Rohini Sector 7', 'Sector 8', 'Pitampura'] },
  '122001': { city: 'Gurugram', district: 'Gurugram', state: 'Haryana', localities: ['Sector 14', 'Old DLF', 'Civil Lines'] },
  '122002': { city: 'Gurugram', district: 'Gurugram', state: 'Haryana', localities: ['DLF Phase 1', 'DLF Phase 2', 'Golf Course Road'] },
  '122018': { city: 'Gurugram', district: 'Gurugram', state: 'Haryana', localities: ['Cyber Hub', 'DLF Phase 3', 'Udyog Vihar'] },
  '201301': { city: 'Noida', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', localities: ['Sector 18', 'Sector 15', 'Atta Market'] },
  '201304': { city: 'Noida', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', localities: ['Sector 137', 'Sector 128', 'Expressway'] },

  // Hyderabad / Telangana
  '500001': { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', localities: ['Abids', 'Koti', 'Gunfoundry'] },
  '500034': { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', localities: ['Banjara Hills', 'Somajiguda'] },
  '500033': { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', localities: ['Jubilee Hills', 'Film Nagar'] },
  '500081': { city: 'Hyderabad', district: 'Ranga Reddy', state: 'Telangana', localities: ['HITEC City', 'Madhapur', 'Mindspace'] },
  '500032': { city: 'Hyderabad', district: 'Ranga Reddy', state: 'Telangana', localities: ['Gachibowli', 'Financial District', 'Nanakramguda'] },
  '500072': { city: 'Hyderabad', district: 'Medchal-Malkajgiri', state: 'Telangana', localities: ['Kukatpally', 'KPHB Colony'] },

  // Chennai / Tamil Nadu
  '600001': { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', localities: ['George Town', 'Parrys Corner', 'Broadway'] },
  '600004': { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', localities: ['Mylapore', 'Mandaveli'] },
  '600017': { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', localities: ['T. Nagar', 'Pondy Bazaar', 'Panagal Park'] },
  '600020': { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', localities: ['Adyar', 'Besant Nagar', 'Thiruvanmiyur'] },
  '600028': { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', localities: ['R.A. Puram', 'Alwarpet'] },
  '600096': { city: 'Chennai', district: 'Kanchipuram', state: 'Tamil Nadu', localities: ['OMR Perungudi', 'Kandanchavadi'] },

  // Kolkata / West Bengal
  '700001': { city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', localities: ['BBD Bagh', 'Dalhousie Square', 'Strand Road'] },
  '700019': { city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', localities: ['Ballygunge', 'Gariahat', 'Hazra'] },
  '700029': { city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', localities: ['Kalighat', 'Southern Avenue'] },
  '700091': { city: 'Kolkata', district: 'North 24 Parganas', state: 'West Bengal', localities: ['Salt Lake Sector 5', 'Tech Park', 'Karunamoyee'] },
  '700156': { city: 'Kolkata', district: 'North 24 Parganas', state: 'West Bengal', localities: ['New Town', 'Action Area 1', 'Rajarhat'] },

  // Ahmedabad / Gujarat
  '380001': { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', localities: ['Bhadra', 'Lal Darwaja', 'Relief Road'] },
  '380015': { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', localities: ['Satellite', 'Prahlad Nagar', 'Vastrapur'] },
  '380054': { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', localities: ['Bodakdev', 'SG Highway', 'Thaltej'] },

  // Jaipur / Rajasthan
  '302001': { city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', localities: ['Pink City', 'Johari Bazaar', 'MI Road'] },
  '302017': { city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', localities: ['Malviya Nagar', 'Jagatpura', 'Gaurav Tower'] },
  '302020': { city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', localities: ['Mansarovar', 'VT Road'] },

  // Chandigarh & Punjab/Haryana
  '160001': { city: 'Chandigarh', district: 'Chandigarh', state: 'Chandigarh', localities: ['Sector 1', 'Sector 2', 'Capitol Complex'] },
  '160017': { city: 'Chandigarh', district: 'Chandigarh', state: 'Chandigarh', localities: ['Sector 17 Plaza', 'Sector 18'] },
  '160022': { city: 'Chandigarh', district: 'Chandigarh', state: 'Chandigarh', localities: ['Sector 22', 'Sector 23'] },

  // Kochi / Kerala
  '682001': { city: 'Kochi', district: 'Ernakulam', state: 'Kerala', localities: ['Fort Kochi', 'Mattancherry'] },
  '682016': { city: 'Kochi', district: 'Ernakulam', state: 'Kerala', localities: ['MG Road Kochi', 'Ernakulam South'] },
  '682030': { city: 'Kochi', district: 'Ernakulam', state: 'Kerala', localities: ['Kakkanad', 'Infopark', 'SmartCity'] },
};

/**
 * State & Primary City resolution based on Indian Postal 2-digit Circle Codes
 */
const INDIAN_POSTAL_CIRCLES: Record<string, { state: string; defaultCity: string }> = {
  '11': { state: 'Delhi', defaultCity: 'New Delhi' },
  '12': { state: 'Haryana', defaultCity: 'Gurugram' },
  '13': { state: 'Haryana', defaultCity: 'Ambala' },
  '14': { state: 'Punjab', defaultCity: 'Ludhiana' },
  '15': { state: 'Punjab', defaultCity: 'Bathinda' },
  '16': { state: 'Chandigarh', defaultCity: 'Chandigarh' },
  '17': { state: 'Himachal Pradesh', defaultCity: 'Shimla' },
  '18': { state: 'Jammu & Kashmir', defaultCity: 'Srinagar' },
  '19': { state: 'Jammu & Kashmir', defaultCity: 'Jammu' },
  '20': { state: 'Uttar Pradesh', defaultCity: 'Noida' },
  '21': { state: 'Uttar Pradesh', defaultCity: 'Prayagraj' },
  '22': { state: 'Uttar Pradesh', defaultCity: 'Lucknow' },
  '23': { state: 'Uttar Pradesh', defaultCity: 'Varanasi' },
  '24': { state: 'Uttarakhand', defaultCity: 'Dehradun' },
  '25': { state: 'Uttar Pradesh', defaultCity: 'Meerut' },
  '26': { state: 'Uttarakhand', defaultCity: 'Nainital' },
  '27': { state: 'Uttar Pradesh', defaultCity: 'Gorakhpur' },
  '28': { state: 'Uttar Pradesh', defaultCity: 'Agra' },
  '30': { state: 'Rajasthan', defaultCity: 'Jaipur' },
  '31': { state: 'Rajasthan', defaultCity: 'Udaipur' },
  '32': { state: 'Rajasthan', defaultCity: 'Kota' },
  '33': { state: 'Rajasthan', defaultCity: 'Bikaner' },
  '34': { state: 'Rajasthan', defaultCity: 'Jodhpur' },
  '36': { state: 'Gujarat', defaultCity: 'Rajkot' },
  '37': { state: 'Gujarat', defaultCity: 'Surat' },
  '38': { state: 'Gujarat', defaultCity: 'Ahmedabad' },
  '39': { state: 'Gujarat', defaultCity: 'Vadodara' },
  '40': { state: 'Maharashtra', defaultCity: 'Mumbai' },
  '41': { state: 'Maharashtra', defaultCity: 'Pune' },
  '42': { state: 'Maharashtra', defaultCity: 'Nashik' },
  '43': { state: 'Maharashtra', defaultCity: 'Aurangabad' },
  '44': { state: 'Maharashtra', defaultCity: 'Nagpur' },
  '45': { state: 'Madhya Pradesh', defaultCity: 'Indore' },
  '46': { state: 'Madhya Pradesh', defaultCity: 'Bhopal' },
  '47': { state: 'Madhya Pradesh', defaultCity: 'Gwalior' },
  '48': { state: 'Madhya Pradesh', defaultCity: 'Jabalpur' },
  '49': { state: 'Chhattisgarh', defaultCity: 'Raipur' },
  '50': { state: 'Telangana', defaultCity: 'Hyderabad' },
  '51': { state: 'Andhra Pradesh', defaultCity: 'Tirupati' },
  '52': { state: 'Andhra Pradesh', defaultCity: 'Vijayawada' },
  '53': { state: 'Andhra Pradesh', defaultCity: 'Visakhapatnam' },
  '56': { state: 'Karnataka', defaultCity: 'Bengaluru' },
  '57': { state: 'Karnataka', defaultCity: 'Mangalore' },
  '58': { state: 'Karnataka', defaultCity: 'Hubballi' },
  '59': { state: 'Karnataka', defaultCity: 'Belagavi' },
  '60': { state: 'Tamil Nadu', defaultCity: 'Chennai' },
  '61': { state: 'Tamil Nadu', defaultCity: 'Tiruchirappalli' },
  '62': { state: 'Tamil Nadu', defaultCity: 'Madurai' },
  '63': { state: 'Tamil Nadu', defaultCity: 'Vellore' },
  '64': { state: 'Tamil Nadu', defaultCity: 'Coimbatore' },
  '67': { state: 'Kerala', defaultCity: 'Kozhikode' },
  '68': { state: 'Kerala', defaultCity: 'Kochi' },
  '69': { state: 'Kerala', defaultCity: 'Thiruvananthapuram' },
  '70': { state: 'West Bengal', defaultCity: 'Kolkata' },
  '71': { state: 'West Bengal', defaultCity: 'Durgapur' },
  '72': { state: 'West Bengal', defaultCity: 'Siliguri' },
  '73': { state: 'West Bengal', defaultCity: 'Darjeeling' },
  '74': { state: 'West Bengal', defaultCity: 'Howrah' },
  '75': { state: 'Odisha', defaultCity: 'Bhubaneswar' },
  '76': { state: 'Odisha', defaultCity: 'Cuttack' },
  '77': { state: 'Odisha', defaultCity: 'Rourkela' },
  '78': { state: 'Assam', defaultCity: 'Guwahati' },
  '79': { state: 'Meghalaya', defaultCity: 'Shillong' },
  '80': { state: 'Bihar', defaultCity: 'Patna' },
  '81': { state: 'Bihar', defaultCity: 'Bhagalpur' },
  '82': { state: 'Bihar', defaultCity: 'Gaya' },
  '83': { state: 'Jharkhand', defaultCity: 'Ranchi' },
  '84': { state: 'Bihar', defaultCity: 'Muzaffarpur' },
  '85': { state: 'Bihar', defaultCity: 'Darbhanga' },
};

/**
 * Check if the input is a valid 6-digit Indian PIN code format
 */
export function isValidIndianPincodeFormat(pinCode: string): boolean {
  if (!pinCode) return false;
  const clean = pinCode.trim().replace(/\D/g, '');
  return /^[1-9][0-9]{5}$/.test(clean);
}

/**
 * Resolve Indian Pincode details
 * 1. Checks in-memory cache
 * 2. Tries India Post public API (`api.postalpincode.in`)
 * 3. Falls back to comprehensive built-in Indian database
 */
export async function lookupIndianPincode(pinCode: string): Promise<IndianPincodeResult | null> {
  const clean = (pinCode || '').trim().replace(/\D/g, '');
  if (!isValidIndianPincodeFormat(clean)) {
    return null;
  }

  // 1. Check in-memory cache
  if (pincodeCache.has(clean)) {
    return pincodeCache.get(clean)!;
  }

  // 2. Try fetching from India Post public API with 3s timeout
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

    const response = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      signal: controller ? controller.signal : undefined,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice)) {
        const offices = data[0].PostOffice;
        const primary = offices[0];

        const district = primary.District || primary.Division || primary.Block || 'District';
        const state = primary.State || 'State';
        // Preferred city name: either district, division, or name
        let city = district;
        if (city.toLowerCase().includes('district') || city.toLowerCase().includes('urban') || city.toLowerCase().includes('suburban')) {
          city = city.replace(/district|urban|suburban/gi, '').trim();
        }
        if (!city && primary.Name) {
          city = primary.Name;
        }

        const localities = offices
          .map((o: any) => o.Name)
          .filter(Boolean)
          .slice(0, 8);

        const result: IndianPincodeResult = {
          pinCode: clean,
          city: city || district || 'City',
          district: district,
          state: state,
          country: 'India',
          localities: localities.length > 0 ? localities : [primary.Name || 'Main Post Office'],
          isDeliverable: true,
          source: 'india_post_api',
        };

        pincodeCache.set(clean, result);
        return result;
      }
    }
  } catch (err) {
    // Graceful fallback to offline Indian Postal Directory
  }

  // 3. Check known database or circle prefix
  if (KNOWN_INDIAN_PINCODES[clean]) {
    const known = KNOWN_INDIAN_PINCODES[clean];
    const result: IndianPincodeResult = {
      pinCode: clean,
      city: known.city,
      district: known.district,
      state: known.state,
      country: 'India',
      localities: known.localities,
      isDeliverable: true,
      source: 'local_database',
    };
    pincodeCache.set(clean, result);
    return result;
  }

  // Fallback by 2-digit postal circle code
  const circlePrefix = clean.substring(0, 2);
  if (INDIAN_POSTAL_CIRCLES[circlePrefix]) {
    const circle = INDIAN_POSTAL_CIRCLES[circlePrefix];
    const result: IndianPincodeResult = {
      pinCode: clean,
      city: circle.defaultCity,
      district: circle.defaultCity,
      state: circle.state,
      country: 'India',
      localities: [`Zone ${clean.substring(2, 4)} Area`],
      isDeliverable: true,
      source: 'local_database',
    };
    pincodeCache.set(clean, result);
    return result;
  }

  return null;
}
