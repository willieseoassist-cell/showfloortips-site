const fs = require('fs');

// Load new shows data
const newShows = JSON.parse(fs.readFileSync('/Volumes/Willie Extr/tradeshow-website/new-shows-data.json', 'utf8'));

// Load existing titles for dedup
const existingTitles = new Set(
  fs.readFileSync('/tmp/existing_titles.txt', 'utf8')
    .split('\n')
    .filter(t => t.trim())
    .map(t => t.trim().toLowerCase())
);

console.log(`Existing shows: ${existingTitles.size}`);
console.log(`New shows to process: ${newShows.length}`);

// Hotel mappings by city
const hotelsByCity = {
  'Las Vegas': [
    { name: 'The Venetian Resort', price: '$200-$400/night', distance: '0.2 miles' },
    { name: 'Wynn Las Vegas', price: '$250-$500/night', distance: '0.5 miles' },
    { name: 'Hilton Grand Vacations', price: '$150-$300/night', distance: '0.8 miles' }
  ],
  'Orlando': [
    { name: 'Rosen Centre Hotel', price: '$150-$280/night', distance: '0.3 miles' },
    { name: 'Hilton Orlando', price: '$180-$350/night', distance: '0.5 miles' },
    { name: 'Hyatt Regency Orlando', price: '$160-$320/night', distance: '0.4 miles' }
  ],
  'Chicago': [
    { name: 'Hilton Chicago', price: '$180-$350/night', distance: '0.5 miles' },
    { name: 'Hyatt Regency McCormick Place', price: '$200-$380/night', distance: '0.2 miles' },
    { name: 'Marriott Marquis Chicago', price: '$220-$400/night', distance: '0.3 miles' }
  ],
  'New York': [
    { name: 'New York Hilton Midtown', price: '$250-$500/night', distance: '0.5 miles' },
    { name: 'Sheraton New York Times Square', price: '$200-$400/night', distance: '0.8 miles' },
    { name: 'The Manhattan at Times Square', price: '$180-$350/night', distance: '1.0 miles' }
  ],
  'Houston': [
    { name: 'Hilton Americas-Houston', price: '$180-$350/night', distance: '0.3 miles' },
    { name: 'Marriott Marquis Houston', price: '$200-$380/night', distance: '0.2 miles' },
    { name: 'Four Seasons Houston', price: '$300-$500/night', distance: '1.0 miles' }
  ],
  'Atlanta': [
    { name: 'Omni Atlanta Hotel at CNN Center', price: '$180-$350/night', distance: '0.3 miles' },
    { name: 'Hilton Atlanta', price: '$160-$300/night', distance: '0.5 miles' },
    { name: 'The Westin Peachtree Plaza', price: '$170-$320/night', distance: '0.4 miles' }
  ],
  'Dallas': [
    { name: 'Omni Dallas Hotel', price: '$180-$350/night', distance: '0.3 miles' },
    { name: 'Hilton Dallas Lincoln Centre', price: '$150-$280/night', distance: '1.0 miles' },
    { name: 'Sheraton Dallas Hotel', price: '$160-$300/night', distance: '0.5 miles' }
  ],
  'San Antonio': [
    { name: 'Grand Hyatt San Antonio', price: '$180-$350/night', distance: '0.2 miles' },
    { name: 'Marriott Rivercenter', price: '$170-$320/night', distance: '0.3 miles' },
    { name: 'Hilton Palacio del Rio', price: '$160-$300/night', distance: '0.4 miles' }
  ],
  'Anaheim': [
    { name: 'Hilton Anaheim', price: '$180-$350/night', distance: '0.2 miles' },
    { name: 'Marriott Anaheim', price: '$170-$320/night', distance: '0.3 miles' },
    { name: 'Sheraton Park Hotel', price: '$150-$280/night', distance: '0.5 miles' }
  ],
  'Indianapolis': [
    { name: 'JW Marriott Indianapolis', price: '$200-$380/night', distance: '0.3 miles' },
    { name: 'Hyatt Regency Indianapolis', price: '$170-$320/night', distance: '0.2 miles' },
    { name: 'Westin Indianapolis', price: '$160-$300/night', distance: '0.5 miles' }
  ],
  'San Francisco': [
    { name: 'San Francisco Marriott Marquis', price: '$250-$450/night', distance: '0.3 miles' },
    { name: 'Hilton San Francisco Union Square', price: '$220-$400/night', distance: '0.5 miles' },
    { name: 'InterContinental San Francisco', price: '$280-$500/night', distance: '0.2 miles' }
  ],
  'Detroit': [
    { name: 'Detroit Marriott at the Renaissance Center', price: '$170-$320/night', distance: '0.5 miles' },
    { name: 'Westin Book Cadillac', price: '$180-$350/night', distance: '0.3 miles' },
    { name: 'Crowne Plaza Detroit Downtown', price: '$140-$260/night', distance: '0.8 miles' }
  ],
  'Salt Lake City': [
    { name: 'Hilton Salt Lake City Center', price: '$150-$280/night', distance: '0.3 miles' },
    { name: 'Salt Lake City Marriott Downtown', price: '$160-$300/night', distance: '0.2 miles' },
    { name: 'Radisson Hotel Salt Lake City', price: '$130-$240/night', distance: '0.5 miles' }
  ],
  'Louisville': [
    { name: 'Louisville Marriott Downtown', price: '$160-$300/night', distance: '0.3 miles' },
    { name: 'Hyatt Regency Louisville', price: '$170-$320/night', distance: '0.2 miles' },
    { name: 'Omni Louisville Hotel', price: '$180-$350/night', distance: '0.5 miles' }
  ],
  'Dubai': [
    { name: 'JW Marriott Marquis Dubai', price: '$200-$400/night', distance: '2.0 miles' },
    { name: 'Hilton Dubai Al Habtoor City', price: '$180-$350/night', distance: '3.0 miles' },
    { name: 'Sofitel Dubai Downtown', price: '$220-$450/night', distance: '4.0 miles' }
  ],
  'Abu Dhabi': [
    { name: 'Andaz Capital Gate Abu Dhabi', price: '$200-$400/night', distance: '0.5 miles' },
    { name: 'Aloft Abu Dhabi', price: '$120-$220/night', distance: '1.0 miles' },
    { name: 'Park Hyatt Abu Dhabi', price: '$250-$450/night', distance: '5.0 miles' }
  ],
  'Riyadh': [
    { name: 'Four Seasons Riyadh', price: '$250-$500/night', distance: '3.0 miles' },
    { name: 'Hilton Riyadh Hotel & Residences', price: '$150-$300/night', distance: '2.0 miles' },
    { name: 'Marriott Riyadh Diplomatic Quarter', price: '$180-$350/night', distance: '4.0 miles' }
  ],
  'Munich': [
    { name: 'Novotel München Messe', price: '$150-$300/night', distance: '0.3 miles' },
    { name: 'Hilton Munich Park', price: '$180-$350/night', distance: '3.0 miles' },
    { name: 'Holiday Inn Munich City Centre', price: '$120-$250/night', distance: '5.0 miles' }
  ],
  'Frankfurt': [
    { name: 'Maritim Hotel Frankfurt', price: '$150-$300/night', distance: '0.5 miles' },
    { name: 'Hilton Frankfurt City Centre', price: '$180-$350/night', distance: '2.0 miles' },
    { name: 'Radisson Blu Hotel Frankfurt', price: '$160-$320/night', distance: '1.0 miles' }
  ],
  'Dusseldorf': [
    { name: 'Maritim Hotel Dusseldorf', price: '$140-$280/night', distance: '0.5 miles' },
    { name: 'Hilton Dusseldorf', price: '$170-$320/night', distance: '2.0 miles' },
    { name: 'Hyatt Regency Dusseldorf', price: '$180-$350/night', distance: '3.0 miles' }
  ],
  'Paris': [
    { name: 'Hyatt Regency Paris CDG', price: '$180-$350/night', distance: '2.0 miles' },
    { name: 'Hilton Paris Charles de Gaulle', price: '$160-$300/night', distance: '3.0 miles' },
    { name: 'Novotel Paris Nord Expo', price: '$120-$250/night', distance: '0.5 miles' }
  ],
  'Barcelona': [
    { name: 'Fira Congress Barcelona', price: '$150-$300/night', distance: '0.3 miles' },
    { name: 'Hilton Diagonal Mar Barcelona', price: '$180-$350/night', distance: '5.0 miles' },
    { name: 'Melia Barcelona Sky', price: '$170-$320/night', distance: '4.0 miles' }
  ],
  'Milan': [
    { name: 'Novotel Milano Nord Ca Granda', price: '$130-$260/night', distance: '3.0 miles' },
    { name: 'Hilton Milan', price: '$180-$350/night', distance: '5.0 miles' },
    { name: 'NH Collection Milano CityLife', price: '$160-$320/night', distance: '4.0 miles' }
  ],
  'London': [
    { name: 'Novotel London ExCeL', price: '$160-$320/night', distance: '0.3 miles' },
    { name: 'DoubleTree by Hilton London ExCeL', price: '$150-$300/night', distance: '0.5 miles' },
    { name: 'Sunborn London Yacht Hotel', price: '$180-$350/night', distance: '0.2 miles' }
  ],
  'Cologne': [
    { name: 'Dorint Hotel am Heumarkt', price: '$140-$280/night', distance: '2.0 miles' },
    { name: 'Maritim Hotel Koln', price: '$130-$260/night', distance: '1.5 miles' },
    { name: 'Hilton Cologne', price: '$160-$320/night', distance: '3.0 miles' }
  ],
  'Nuremberg': [
    { name: 'Maritim Hotel Nurnberg', price: '$120-$240/night', distance: '0.5 miles' },
    { name: 'Le Meridien Grand Hotel', price: '$150-$300/night', distance: '2.0 miles' },
    { name: 'Holiday Inn Nurnberg City Centre', price: '$100-$200/night', distance: '3.0 miles' }
  ],
  'Hamburg': [
    { name: 'Hamburg Messe und Congress Hotel', price: '$140-$280/night', distance: '0.2 miles' },
    { name: 'Radisson Blu Hotel Hamburg', price: '$160-$320/night', distance: '1.0 miles' },
    { name: 'Scandic Hamburg Emporio', price: '$130-$260/night', distance: '1.5 miles' }
  ],
  'Stuttgart': [
    { name: 'Mövenpick Hotel Stuttgart Airport', price: '$130-$260/night', distance: '1.0 miles' },
    { name: 'Hilton Garden Inn Stuttgart', price: '$120-$240/night', distance: '2.0 miles' },
    { name: 'Maritim Hotel Stuttgart', price: '$140-$280/night', distance: '3.0 miles' }
  ],
  'Berlin': [
    { name: 'InterContinental Berlin', price: '$180-$350/night', distance: '3.0 miles' },
    { name: 'Hilton Berlin', price: '$170-$320/night', distance: '4.0 miles' },
    { name: 'Novotel Berlin Mitte', price: '$130-$260/night', distance: '5.0 miles' }
  ],
  'Amsterdam': [
    { name: 'NH Collection Amsterdam Grand Hotel Krasnapolsky', price: '$200-$400/night', distance: '5.0 miles' },
    { name: 'Novotel Amsterdam City', price: '$150-$300/night', distance: '2.0 miles' },
    { name: 'DoubleTree by Hilton Amsterdam', price: '$160-$320/night', distance: '3.0 miles' }
  ],
  'Geneva': [
    { name: 'Mövenpick Hotel Geneva', price: '$200-$400/night', distance: '1.0 miles' },
    { name: 'InterContinental Geneva', price: '$250-$500/night', distance: '5.0 miles' },
    { name: 'Crowne Plaza Geneva', price: '$180-$350/night', distance: '2.0 miles' }
  ],
  'Basel': [
    { name: 'Hilton Basel', price: '$180-$350/night', distance: '1.0 miles' },
    { name: 'Radisson Blu Hotel Basel', price: '$160-$320/night', distance: '0.5 miles' },
    { name: 'Swissotel Le Plaza Basel', price: '$200-$400/night', distance: '2.0 miles' }
  ],
  'Madrid': [
    { name: 'Novotel Madrid Campo de las Naciones', price: '$130-$260/night', distance: '0.5 miles' },
    { name: 'Hilton Madrid Airport', price: '$150-$300/night', distance: '2.0 miles' },
    { name: 'Marriott Auditorium Madrid', price: '$140-$280/night', distance: '1.0 miles' }
  ],
  'Cannes': [
    { name: 'InterContinental Carlton Cannes', price: '$350-$700/night', distance: '0.5 miles' },
    { name: 'Majestic Barrière', price: '$400-$800/night', distance: '0.3 miles' },
    { name: 'Novotel Cannes Montfleury', price: '$150-$300/night', distance: '1.0 miles' }
  ],
  'Bologna': [
    { name: 'Savoia Hotel Regency', price: '$120-$240/night', distance: '2.0 miles' },
    { name: 'NH Bologna de la Gare', price: '$100-$200/night', distance: '3.0 miles' },
    { name: 'Royal Hotel Carlton', price: '$130-$260/night', distance: '1.5 miles' }
  ],
  'Verona': [
    { name: 'Hotel Firenze', price: '$100-$200/night', distance: '0.5 miles' },
    { name: 'Hotel Colomba d\'Oro', price: '$120-$240/night', distance: '1.0 miles' },
    { name: 'Best Western Hotel Turismo', price: '$90-$180/night', distance: '2.0 miles' }
  ],
  'Singapore': [
    { name: 'Marina Bay Sands', price: '$300-$600/night', distance: '0.5 miles' },
    { name: 'The Fullerton Hotel', price: '$250-$500/night', distance: '2.0 miles' },
    { name: 'Novotel Singapore on Stevens', price: '$150-$300/night', distance: '3.0 miles' }
  ],
  'Hong Kong': [
    { name: 'Renaissance Hong Kong Harbour View', price: '$200-$400/night', distance: '0.3 miles' },
    { name: 'Grand Hyatt Hong Kong', price: '$300-$600/night', distance: '0.5 miles' },
    { name: 'Novotel Century Hong Kong', price: '$150-$300/night', distance: '1.0 miles' }
  ],
  'Bangkok': [
    { name: 'Centara Grand & Convention Centre', price: '$120-$250/night', distance: '0.3 miles' },
    { name: 'Novotel Bangkok IMPACT', price: '$80-$160/night', distance: '0.2 miles' },
    { name: 'Pullman Bangkok King Power', price: '$100-$200/night', distance: '5.0 miles' }
  ],
  'Tokyo': [
    { name: 'The Prince Park Tower Tokyo', price: '$200-$400/night', distance: '1.0 miles' },
    { name: 'Hilton Tokyo Odaiba', price: '$180-$350/night', distance: '2.0 miles' },
    { name: 'InterContinental Tokyo Bay', price: '$220-$450/night', distance: '0.5 miles' }
  ],
  'Chiba': [
    { name: 'Hotel The Manhattan', price: '$120-$240/night', distance: '0.5 miles' },
    { name: 'APA Hotel & Resort Tokyo Bay Makuhari', price: '$80-$160/night', distance: '0.3 miles' },
    { name: 'Hotel New Otani Makuhari', price: '$100-$200/night', distance: '0.4 miles' }
  ],
  'Seoul': [
    { name: 'InterContinental COEX', price: '$200-$400/night', distance: '0.2 miles' },
    { name: 'Oakwood Premier COEX Center', price: '$180-$350/night', distance: '0.3 miles' },
    { name: 'Park Hyatt Seoul', price: '$250-$500/night', distance: '1.0 miles' }
  ],
  'Shanghai': [
    { name: 'Kerry Hotel Pudong Shanghai', price: '$180-$350/night', distance: '2.0 miles' },
    { name: 'Hilton Shanghai Pudong', price: '$150-$300/night', distance: '3.0 miles' },
    { name: 'Novotel Shanghai Clover', price: '$100-$200/night', distance: '1.0 miles' }
  ],
  'Guangzhou': [
    { name: 'The Westin Pazhou', price: '$150-$300/night', distance: '0.3 miles' },
    { name: 'Langham Place Guangzhou', price: '$120-$250/night', distance: '1.0 miles' },
    { name: 'Four Points by Sheraton Guangzhou', price: '$80-$160/night', distance: '0.5 miles' }
  ],
  'Shenzhen': [
    { name: 'Hilton Shenzhen Shekou', price: '$150-$300/night', distance: '3.0 miles' },
    { name: 'JW Marriott Hotel Shenzhen Bao\'an', price: '$120-$250/night', distance: '0.5 miles' },
    { name: 'Sheraton Shenzhen Futian Hotel', price: '$100-$200/night', distance: '5.0 miles' }
  ],
  'Beijing': [
    { name: 'China National Convention Center Grand Hotel', price: '$150-$300/night', distance: '0.2 miles' },
    { name: 'InterContinental Beijing Beichen', price: '$130-$260/night', distance: '0.5 miles' },
    { name: 'Hilton Beijing', price: '$120-$250/night', distance: '3.0 miles' }
  ],
  'Taipei': [
    { name: 'Courtyard by Marriott Taipei', price: '$120-$250/night', distance: '0.5 miles' },
    { name: 'Grand Hyatt Taipei', price: '$200-$400/night', distance: '3.0 miles' },
    { name: 'Humble House Taipei', price: '$150-$300/night', distance: '2.0 miles' }
  ],
  'New Delhi': [
    { name: 'The Leela Palace New Delhi', price: '$200-$400/night', distance: '3.0 miles' },
    { name: 'Hyatt Regency Delhi', price: '$150-$300/night', distance: '2.0 miles' },
    { name: 'ITC Maurya New Delhi', price: '$180-$350/night', distance: '4.0 miles' }
  ],
  'Mumbai': [
    { name: 'The Taj Mahal Palace', price: '$250-$500/night', distance: '5.0 miles' },
    { name: 'ITC Grand Central Mumbai', price: '$150-$300/night', distance: '3.0 miles' },
    { name: 'Novotel Mumbai Juhu Beach', price: '$100-$200/night', distance: '8.0 miles' }
  ],
  'Bengaluru': [
    { name: 'The Leela Palace Bengaluru', price: '$200-$400/night', distance: '5.0 miles' },
    { name: 'Taj West End Bengaluru', price: '$180-$350/night', distance: '7.0 miles' },
    { name: 'ITC Gardenia Bengaluru', price: '$150-$300/night', distance: '6.0 miles' }
  ],
  'Greater Noida': [
    { name: 'Radisson Blu MBD Hotel Noida', price: '$80-$150/night', distance: '5.0 miles' },
    { name: 'Crowne Plaza Greater Noida', price: '$70-$140/night', distance: '2.0 miles' },
    { name: 'Jaypee Greens Golf & Spa Resort', price: '$100-$200/night', distance: '3.0 miles' }
  ],
  'Cape Town': [
    { name: 'Table Bay Hotel', price: '$200-$400/night', distance: '1.0 miles' },
    { name: 'Hilton Cape Town City Centre', price: '$150-$300/night', distance: '0.5 miles' },
    { name: 'Southern Sun Waterfront Cape Town', price: '$120-$250/night', distance: '0.3 miles' }
  ],
  'Johannesburg': [
    { name: 'Sandton Sun', price: '$150-$300/night', distance: '1.0 miles' },
    { name: 'Hilton Sandton', price: '$120-$250/night', distance: '0.5 miles' },
    { name: 'InterContinental Johannesburg Sandton Towers', price: '$130-$260/night', distance: '0.8 miles' }
  ],
  'Sao Paulo': [
    { name: 'Hilton Sao Paulo Morumbi', price: '$150-$300/night', distance: '3.0 miles' },
    { name: 'Grand Hyatt Sao Paulo', price: '$180-$350/night', distance: '5.0 miles' },
    { name: 'Novotel Sao Paulo Jaragua', price: '$100-$200/night', distance: '2.0 miles' }
  ],
  'Mexico City': [
    { name: 'Hilton Mexico City Reforma', price: '$150-$300/night', distance: '3.0 miles' },
    { name: 'St. Regis Mexico City', price: '$250-$500/night', distance: '5.0 miles' },
    { name: 'InterContinental Presidente', price: '$180-$350/night', distance: '4.0 miles' }
  ],
  'Toronto': [
    { name: 'InterContinental Toronto Centre', price: '$200-$400/night', distance: '0.3 miles' },
    { name: 'Fairmont Royal York', price: '$250-$500/night', distance: '0.5 miles' },
    { name: 'Hilton Toronto', price: '$180-$350/night', distance: '0.8 miles' }
  ],
  'Calgary': [
    { name: 'Fairmont Palliser', price: '$180-$350/night', distance: '0.5 miles' },
    { name: 'Hilton Garden Inn Calgary Downtown', price: '$140-$280/night', distance: '0.8 miles' },
    { name: 'Marriott Calgary Downtown', price: '$160-$320/night', distance: '0.3 miles' }
  ],
  'Ottawa': [
    { name: 'Fairmont Château Laurier', price: '$200-$400/night', distance: '3.0 miles' },
    { name: 'Westin Ottawa', price: '$180-$350/night', distance: '2.0 miles' },
    { name: 'Hilton Garden Inn Ottawa Downtown', price: '$140-$280/night', distance: '4.0 miles' }
  ],
  'Santiago': [
    { name: 'W Santiago', price: '$180-$350/night', distance: '3.0 miles' },
    { name: 'Hilton Garden Inn Santiago Airport', price: '$100-$200/night', distance: '1.0 miles' },
    { name: 'Marriott Santiago', price: '$150-$300/night', distance: '5.0 miles' }
  ],
  'Lima': [
    { name: 'JW Marriott Lima', price: '$200-$400/night', distance: '3.0 miles' },
    { name: 'Hilton Lima Miraflores', price: '$150-$300/night', distance: '2.0 miles' },
    { name: 'Swissotel Lima', price: '$180-$350/night', distance: '4.0 miles' }
  ],
  'Lyon': [
    { name: 'Marriott Lyon Cité Internationale', price: '$150-$300/night', distance: '3.0 miles' },
    { name: 'Novotel Lyon Bron Eurexpo', price: '$100-$200/night', distance: '0.5 miles' },
    { name: 'Hilton Lyon', price: '$140-$280/night', distance: '2.0 miles' }
  ],
  'Marrakech': [
    { name: 'Sofitel Marrakech Lounge and Spa', price: '$150-$300/night', distance: '2.0 miles' },
    { name: 'Kenzi Menara Palace', price: '$100-$200/night', distance: '1.0 miles' },
    { name: 'Movenpick Hotel Mansour Eddahbi', price: '$120-$250/night', distance: '1.5 miles' }
  ],
  'Cairo': [
    { name: 'Marriott Mena House Cairo', price: '$150-$300/night', distance: '5.0 miles' },
    { name: 'InterContinental Cairo Semiramis', price: '$130-$260/night', distance: '3.0 miles' },
    { name: 'Hilton Cairo Heliopolis', price: '$100-$200/night', distance: '2.0 miles' }
  ],
  'Jakarta': [
    { name: 'The Ritz-Carlton Jakarta', price: '$150-$300/night', distance: '3.0 miles' },
    { name: 'Hilton Jakarta', price: '$100-$200/night', distance: '2.0 miles' },
    { name: 'InterContinental Jakarta Pondok Indah', price: '$120-$250/night', distance: '5.0 miles' }
  ],
  'Ho Chi Minh City': [
    { name: 'InterContinental Saigon', price: '$150-$300/night', distance: '3.0 miles' },
    { name: 'Lotte Hotel Saigon', price: '$120-$250/night', distance: '2.0 miles' },
    { name: 'Novotel Saigon Centre', price: '$80-$160/night', distance: '4.0 miles' }
  ],
  'Guadalajara': [
    { name: 'Hilton Guadalajara', price: '$120-$250/night', distance: '0.5 miles' },
    { name: 'Fiesta Americana Guadalajara', price: '$100-$200/night', distance: '1.0 miles' },
    { name: 'Hotel Riu Plaza Guadalajara', price: '$80-$160/night', distance: '2.0 miles' }
  ],
  'Rio de Janeiro': [
    { name: 'Hilton Copacabana', price: '$200-$400/night', distance: '5.0 miles' },
    { name: 'Windsor Atlantica Hotel', price: '$150-$300/night', distance: '6.0 miles' },
    { name: 'Sheraton Grand Rio Hotel & Resort', price: '$180-$350/night', distance: '3.0 miles' }
  ],
  'Bogota': [
    { name: 'JW Marriott Bogota', price: '$150-$300/night', distance: '3.0 miles' },
    { name: 'Hilton Bogota', price: '$120-$250/night', distance: '2.0 miles' },
    { name: 'Four Seasons Bogota', price: '$200-$400/night', distance: '4.0 miles' }
  ],
  'Medellin': [
    { name: 'InterContinental Medellin', price: '$120-$250/night', distance: '2.0 miles' },
    { name: 'Marriott Medellin', price: '$100-$200/night', distance: '3.0 miles' },
    { name: 'Hotel & Spa Dann Carlton', price: '$80-$160/night', distance: '1.0 miles' }
  ],
  'Ribeirao Preto': [
    { name: 'JPark Hotel', price: '$60-$120/night', distance: '2.0 miles' },
    { name: 'Hotel Mercure Ribeirao Preto', price: '$70-$140/night', distance: '3.0 miles' },
    { name: 'Comfort Suites Ribeirao Preto', price: '$50-$100/night', distance: '4.0 miles' }
  ],
  'Athens': [
    { name: 'InterContinental Athenaeum', price: '$180-$350/night', distance: '2.0 miles' },
    { name: 'Hilton Athens', price: '$160-$320/night', distance: '3.0 miles' },
    { name: 'NJV Athens Plaza', price: '$150-$300/night', distance: '4.0 miles' }
  ],
  'Oslo': [
    { name: 'Radisson Blu Scandinavia Hotel Oslo', price: '$180-$350/night', distance: '1.0 miles' },
    { name: 'Thon Hotel Opera Oslo', price: '$150-$300/night', distance: '2.0 miles' },
    { name: 'Clarion Hotel The Hub', price: '$160-$320/night', distance: '1.5 miles' }
  ],
  'Farnborough': [
    { name: 'Holiday Inn Farnborough', price: '$120-$250/night', distance: '0.5 miles' },
    { name: 'Aviator Hotel', price: '$150-$300/night', distance: '0.3 miles' },
    { name: 'Mercure Farnborough', price: '$100-$200/night', distance: '1.0 miles' }
  ],
  'Birmingham': [
    { name: 'Resorts World Birmingham', price: '$130-$260/night', distance: '0.3 miles' },
    { name: 'Genting Hotel at Resorts World', price: '$120-$240/night', distance: '0.2 miles' },
    { name: 'Hilton Birmingham Metropole', price: '$140-$280/night', distance: '0.5 miles' }
  ],
  'Istanbul': [
    { name: 'Radisson Blu Conference & Airport Hotel Istanbul', price: '$100-$200/night', distance: '2.0 miles' },
    { name: 'Hilton Istanbul Bomonti', price: '$130-$260/night', distance: '5.0 miles' },
    { name: 'Crowne Plaza Istanbul Asia', price: '$80-$160/night', distance: '3.0 miles' }
  ],
  'Maastricht': [
    { name: 'NH Maastricht', price: '$120-$250/night', distance: '1.0 miles' },
    { name: 'Crowne Plaza Maastricht', price: '$130-$260/night', distance: '0.5 miles' },
    { name: 'Hotel Derlon Maastricht', price: '$140-$280/night', distance: '1.5 miles' }
  ],
  'Manila': [
    { name: 'Conrad Manila', price: '$150-$300/night', distance: '1.0 miles' },
    { name: 'Okada Manila', price: '$200-$400/night', distance: '2.0 miles' },
    { name: 'Sofitel Philippine Plaza', price: '$180-$350/night', distance: '1.5 miles' }
  ]
};

// Default hotels for cities not in the map
const defaultHotels = [
  { name: 'Hilton Convention Center Hotel', price: '$150-$300/night', distance: '0.5 miles' },
  { name: 'Marriott City Center', price: '$140-$280/night', distance: '1.0 miles' },
  { name: 'Holiday Inn Express', price: '$100-$200/night', distance: '1.5 miles' }
];

// Tips by category
const tipsByCategory = {
  'tech': [
    "Set up interactive product demos with tablets or touchscreens to engage visitors.",
    "Offer live coding or product demonstrations at scheduled times to draw crowds.",
    "Create a charging station at your booth — attendees will appreciate it and stay longer.",
    "Use QR codes linked to landing pages for easy lead capture.",
    "Prepare technical spec sheets and comparison guides for serious buyers."
  ],
  'health': [
    "Ensure all marketing materials comply with healthcare advertising regulations.",
    "Bring clinical study data and peer-reviewed research to support your products.",
    "Offer hands-on demonstrations with proper sanitization protocols.",
    "Network with KOLs (Key Opinion Leaders) to build credibility.",
    "Schedule private meeting rooms for sensitive healthcare discussions."
  ],
  'food': [
    "Offer product sampling — it's the most effective way to convert at food shows.",
    "Ensure all food safety and handling certifications are visible at your booth.",
    "Bring a commercial-grade display cooler or heated unit for your products.",
    "Prepare nutritional information and ingredient lists for health-conscious buyers.",
    "Consider sustainable packaging samples to appeal to eco-conscious retailers."
  ],
  'construction': [
    "Bring scaled models or VR demonstrations of large equipment.",
    "Prepare project case studies with ROI data and timelines.",
    "Staff your booth with experienced project managers who can speak technically.",
    "Display certifications and safety compliance documentation prominently.",
    "Offer on-site equipment demonstrations if the venue allows outdoor space."
  ],
  'manufacturing': [
    "Bring working prototypes or sample parts to demonstrate quality.",
    "Prepare detailed technical specifications and tolerance data.",
    "Show before/after comparisons of manufacturing improvements.",
    "Have engineers on-site who can discuss custom fabrication needs.",
    "Display your quality certifications (ISO, AS9100, etc.) prominently."
  ],
  'energy': [
    "Prepare data on energy savings and ROI for your products.",
    "Bring case studies from successful installations and deployments.",
    "Display relevant certifications (UL, CE, Energy Star, etc.).",
    "Have technical experts available for detailed engineering discussions.",
    "Showcase sustainability credentials and carbon reduction metrics."
  ],
  'auto': [
    "Display actual automotive parts and components for hands-on evaluation.",
    "Prepare compatibility guides for different vehicle makes and models.",
    "Bring diagnostic or installation tools for live demonstrations.",
    "Have warranty and guarantee information readily available.",
    "Showcase any OEM partnerships or certifications."
  ],
  'defense': [
    "Ensure all export compliance and ITAR regulations are followed.",
    "Prepare classified and unclassified versions of your materials.",
    "Staff your booth with personnel who have appropriate security clearances.",
    "Schedule private meetings for sensitive defense discussions.",
    "Bring mission-specific case studies and operational testimonials."
  ],
  'aviation': [
    "Display certified components with relevant airworthiness documentation.",
    "Prepare FAA/EASA compliance documentation for your products.",
    "Bring scale models or simulation demos for large aerospace systems.",
    "Network at the show's flight demonstrations and static displays.",
    "Have MRO case studies and fleet operator testimonials available."
  ],
  'beauty': [
    "Offer live product demonstrations and makeovers at your booth.",
    "Provide generous sample sizes that attendees can take home.",
    "Display before/after photos and clinical testing results.",
    "Have ingredient transparency cards for clean beauty-conscious buyers.",
    "Create an Instagram-worthy booth backdrop for social media sharing."
  ],
  'retail': [
    "Showcase your products in a mock retail display for visual impact.",
    "Prepare volume pricing and wholesale catalog information.",
    "Bring POS integration demos and retail technology solutions.",
    "Display sell-through data and consumer insights from existing retailers.",
    "Offer exclusive show specials to drive on-site orders."
  ],
  'security': [
    "Set up live demonstration stations showing your security solutions in action.",
    "Prepare ROI calculators showing cost of security breaches vs. your solution.",
    "Have certified security professionals staff your booth.",
    "Display integration capabilities with existing security infrastructure.",
    "Bring case studies from successful security deployments."
  ],
  'pharma': [
    "Ensure all booth materials comply with FDA/EMA advertising regulations.",
    "Prepare clinical trial data summaries and regulatory filing timelines.",
    "Staff booth with medical science liaisons and regulatory affairs specialists.",
    "Offer private consultation rooms for detailed scientific discussions.",
    "Display your drug development pipeline with key milestone dates."
  ],
  'design': [
    "Create an immersive booth experience that showcases your design philosophy.",
    "Bring physical material samples and finish swatches for tactile evaluation.",
    "Display a portfolio of completed projects with stunning photography.",
    "Offer live design consultations to attract and engage visitors.",
    "Use augmented reality to show how products look in different spaces."
  ],
  'sports': [
    "Set up product testing stations where attendees can try your equipment.",
    "Bring athlete endorsements and performance testing data.",
    "Display products in action with video loops and action photography.",
    "Offer exclusive show pricing and pre-order opportunities for new products.",
    "Have fitting specialists available for personalized product recommendations."
  ],
  'electronics': [
    "Create interactive demo stations showing your electronics in action.",
    "Prepare technical comparison charts against competitor products.",
    "Bring development kits and evaluation boards for engineers.",
    "Display certification marks and compliance documentation.",
    "Offer volume pricing and supply chain information for OEM buyers."
  ],
  'entertainment': [
    "Create an experiential booth with immersive audio/visual elements.",
    "Offer hands-on gameplay or content demos at your booth.",
    "Prepare audience engagement metrics and platform statistics.",
    "Have creative talent available for discussions and signings.",
    "Display cross-platform compatibility and integration capabilities."
  ],
  'general': [
    "Research the attendee demographics and tailor your pitch accordingly.",
    "Bring plenty of business cards and marketing materials.",
    "Set up a digital lead capture system to collect contact information.",
    "Offer a prize drawing to attract visitors to your booth.",
    "Follow up with leads within 48 hours of the show ending."
  ],
  'travel': [
    "Create a destination-inspired booth design with immersive elements.",
    "Offer virtual tours and 360-degree video experiences of your properties.",
    "Prepare group booking packages and incentive travel programs.",
    "Have multilingual staff available for international networking.",
    "Display recent guest satisfaction scores and industry awards."
  ],
  'education': [
    "Offer free trial access or demo accounts for your education technology.",
    "Bring student outcome data and educational research to support your products.",
    "Create hands-on learning stations where educators can experience your tools.",
    "Display implementation guides and professional development resources.",
    "Prepare ROI data showing how your solution improves learning outcomes."
  ],
  'packaging': [
    "Bring physical samples of your packaging solutions in various sizes.",
    "Display sustainability credentials and recyclability information.",
    "Prepare cost comparison data showing total cost of ownership.",
    "Show integration capabilities with existing packaging lines.",
    "Have material specialists available for technical discussions."
  ],
  'maritime': [
    "Display scale models or VR simulations of vessel equipment.",
    "Prepare IMO compliance and classification society documentation.",
    "Bring case studies from successful maritime installations.",
    "Have marine engineers available for technical consultations.",
    "Showcase environmental compliance and emissions reduction solutions."
  ],
  'environmental': [
    "Display environmental impact data and sustainability metrics.",
    "Prepare regulatory compliance documentation for relevant standards.",
    "Bring case studies showing measurable environmental improvements.",
    "Have certified environmental professionals staff your booth.",
    "Showcase circular economy and waste reduction solutions."
  ],
  'logistics': [
    "Demonstrate your logistics software with real-time tracking demos.",
    "Prepare supply chain efficiency case studies with ROI data.",
    "Display integration capabilities with major ERP and WMS systems.",
    "Have logistics experts available for supply chain consultations.",
    "Showcase automation and AI-driven optimization solutions."
  ],
  'media': [
    "Set up live broadcasting or streaming demos at your booth.",
    "Display signal quality and performance benchmarks.",
    "Prepare integration guides for common broadcast workflows.",
    "Have broadcast engineers available for technical demonstrations.",
    "Showcase IP-based and cloud production capabilities."
  ],
  'mining': [
    "Display equipment models and ore sample processing demos.",
    "Prepare safety record data and compliance documentation.",
    "Bring case studies from successful mining operations.",
    "Have mining engineers available for technical consultations.",
    "Showcase sustainability and environmental remediation solutions."
  ],
  'agriculture': [
    "Display precision agriculture and smart farming technology demos.",
    "Prepare crop yield improvement data and case studies.",
    "Bring soil and water management solution samples.",
    "Have agronomists available for technical discussions.",
    "Showcase sustainable farming and organic certification solutions."
  ],
  'realestate': [
    "Prepare 3D renderings and virtual tours of your properties.",
    "Display market analysis and investment return projections.",
    "Bring detailed floor plans and specification sheets.",
    "Have financial analysts available for investment discussions.",
    "Showcase sustainability certifications and green building features."
  ],
  'science': [
    "Set up working instrument demonstrations at your booth.",
    "Prepare application notes and method development data.",
    "Display peer-reviewed publications featuring your technology.",
    "Have application scientists available for method consultations.",
    "Showcase sample preparation and data analysis capabilities."
  ],
  'hvac': [
    "Display cut-away models showing internal system components.",
    "Prepare energy efficiency ratings and comparison data.",
    "Bring installation guides and maintenance schedule information.",
    "Have HVAC engineers available for system design consultations.",
    "Showcase smart building integration and IoT capabilities."
  ],
  'safety': [
    "Display PPE and safety equipment with live testing demonstrations.",
    "Prepare compliance documentation for OSHA and international standards.",
    "Bring incident reduction case studies and safety program ROI data.",
    "Have certified safety professionals staff your booth.",
    "Showcase training programs and safety culture development tools."
  ],
  'creative': [
    "Display a stunning portfolio of your creative work.",
    "Offer live demonstrations of your creative tools and techniques.",
    "Prepare client testimonials and project case studies.",
    "Have creative directors available for portfolio reviews.",
    "Showcase collaboration and workflow management capabilities."
  ],
  'pet': [
    "Bring product samples that attendees can evaluate hands-on.",
    "Display veterinary endorsements and safety testing data.",
    "Prepare ingredient sourcing transparency documentation.",
    "Have product specialists available for retailer consultations.",
    "Showcase new product launches with promotional display units."
  ],
  'print': [
    "Set up live printing demonstrations showing your technology in action.",
    "Display print sample books showing quality across different substrates.",
    "Prepare total cost of ownership comparisons with competitor solutions.",
    "Have print production experts available for workflow consultations.",
    "Showcase color management and prepress automation capabilities."
  ],
  'cyber': [
    "Set up live threat detection demonstrations at your booth.",
    "Prepare breach prevention case studies with quantified savings.",
    "Display compliance certifications and third-party audit results.",
    "Have cybersecurity analysts available for security assessments.",
    "Showcase integration with existing security infrastructure."
  ]
};

const defaultTips = tipsByCategory['general'];

function makeSlug(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function buildShow(row) {
  const [title, dateSort, dateDisplay, city, state, country, venue, category, categorySlug, attendees, exhibitors, boothPrice, website, host, description] = row;

  const slug = makeSlug(title);
  const location = venue ? `${venue}, ${city}` : city;
  const searchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(title);
  const hotels = hotelsByCity[city] || defaultHotels;
  const tips = tipsByCategory[categorySlug] || defaultTips;

  return {
    title,
    slug,
    date_sort: dateSort,
    date: dateDisplay,
    city,
    state: state || '',
    country,
    venue: venue || '',
    category,
    category_slug: categorySlug,
    attendees: attendees || '',
    exhibitors: exhibitors || '',
    booth_price: boothPrice || '',
    website: website || '',
    host: host || '',
    description,
    location,
    search_url: searchUrl,
    registration_info: 'Online registration available through the official website.',
    image: `https://source.unsplash.com/800x400/?${encodeURIComponent(category.split(' ')[0].toLowerCase())},trade+show`,
    hotels,
    tips
  };
}

// Load shows.js
const showsPath = '/Volumes/Willie Extr/tradeshow-website/shows.js';
let showsData = fs.readFileSync(showsPath, 'utf8');

// Find insertion point
const insertionMarker = '];\nvar SHOWS_DATA';
const insertIdx = showsData.indexOf(insertionMarker);

if (insertIdx === -1) {
  console.error('Could not find insertion point in shows.js');
  process.exit(1);
}

let added = 0;
let skipped = 0;
let duplicates = [];
let newShowStrings = [];

for (const row of newShows) {
  const title = row[0];
  if (existingTitles.has(title.toLowerCase())) {
    skipped++;
    duplicates.push(title);
    continue;
  }

  const show = buildShow(row);
  newShowStrings.push(JSON.stringify(show));
  existingTitles.add(title.toLowerCase());
  added++;
}

if (newShowStrings.length > 0) {
  const insertion = ',' + newShowStrings.join(',');
  showsData = showsData.slice(0, insertIdx) + insertion + showsData.slice(insertIdx);
  fs.writeFileSync(showsPath, showsData);
}

console.log(`\n=== RESULTS ===`);
console.log(`Total processed: ${newShows.length}`);
console.log(`Added: ${added}`);
console.log(`Skipped (duplicates): ${skipped}`);
if (duplicates.length > 0) {
  console.log(`\nDuplicate titles:`);
  duplicates.forEach(d => console.log(`  - ${d}`));
}
console.log(`\nNew total shows: ${existingTitles.size}`);
console.log(`shows.js updated successfully!`);
