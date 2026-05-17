import type { FlightOption, HotelOption, SeatOption } from "./types";

export const mockFlightOptions: FlightOption[] = [
  {
    id: "fl-1",
    airline: "United",
    airlineLogo: "🌐",
    departTime: "8:00 AM",
    arriveTime: "10:30 AM",
    duration: "2h 30m",
    stops: 0,
    price: 420,
    priceDiff: 0,
    tags: ["Recommended", "Nonstop"],
    origin: "ORD",
    destination: "SFO",
  },
  {
    id: "fl-2",
    airline: "Delta",
    airlineLogo: "🔷",
    departTime: "6:30 AM",
    arriveTime: "9:45 AM",
    duration: "3h 15m",
    stops: 0,
    price: 380,
    priceDiff: -40,
    tags: ["Cheapest", "Early departure"],
    origin: "ORD",
    destination: "SFO",
  },
  {
    id: "fl-3",
    airline: "American",
    airlineLogo: "🦅",
    departTime: "10:15 AM",
    arriveTime: "1:00 PM",
    duration: "2h 45m",
    stops: 0,
    price: 455,
    priceDiff: 35,
    tags: ["Nonstop"],
    origin: "ORD",
    destination: "SFO",
  },
  {
    id: "fl-4",
    airline: "Southwest",
    airlineLogo: "❤️",
    departTime: "7:00 AM",
    arriveTime: "11:30 AM",
    duration: "4h 30m",
    stops: 1,
    stopCity: "DEN",
    price: 290,
    priceDiff: -130,
    tags: ["Budget", "1 stop"],
    origin: "ORD",
    destination: "SFO",
  },
  {
    id: "fl-5",
    airline: "Alaska",
    airlineLogo: "🏔️",
    departTime: "2:00 PM",
    arriveTime: "4:30 PM",
    duration: "2h 30m",
    stops: 0,
    price: 410,
    priceDiff: -10,
    tags: ["Afternoon", "Nonstop"],
    origin: "ORD",
    destination: "SFO",
  },
  {
    id: "fl-6",
    airline: "JetBlue",
    airlineLogo: "💙",
    departTime: "12:30 PM",
    arriveTime: "5:45 PM",
    duration: "5h 15m",
    stops: 1,
    stopCity: "BOS",
    price: 315,
    priceDiff: -105,
    tags: ["1 stop", "Extra legroom available"],
    origin: "ORD",
    destination: "SFO",
  },
];

export const mockHotelOptions: HotelOption[] = [
  {
    id: "ht-1",
    name: "Marriott Marquis",
    area: "SOMA District",
    pricePerNight: 249,
    totalPrice: 996,
    rating: 4.6,
    distanceToVenue: "0.1 mi",
    tags: ["Recommended", "Policy compliant", "Conference hotel"],
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=500&fit=crop",
    ],
    amenities: ["Free Wi-Fi", "Gym", "Pool", "Business center", "Restaurant", "Room service"],
    reviewCount: 2847,
    description: "Adjacent to Moscone Center, the Marriott Marquis offers unparalleled convenience for conference attendees. Modern rooms with stunning city views and world-class amenities.",
    cancellationPolicy: "Free cancellation until 48 hours before check-in",
    roomTypes: ["King Room", "Double Queen", "Executive Suite"],
  },
  {
    id: "ht-2",
    name: "Hilton Union Square",
    area: "Union Square",
    pricePerNight: 289,
    totalPrice: 1156,
    rating: 4.4,
    distanceToVenue: "0.8 mi",
    tags: ["Policy compliant", "Great value"],
    images: [
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=500&fit=crop",
    ],
    amenities: ["Free Wi-Fi", "Gym", "Restaurant", "Parking", "Concierge"],
    reviewCount: 1923,
    description: "Located in the heart of Union Square, walking distance to shops, restaurants, and easy transit to Moscone Center. Ideal for combining business with city exploration.",
    cancellationPolicy: "Free cancellation until 24 hours before check-in",
    roomTypes: ["Standard King", "Deluxe Double", "Premium Suite"],
  },
  {
    id: "ht-3",
    name: "Four Seasons",
    area: "Financial District",
    pricePerNight: 595,
    totalPrice: 2380,
    rating: 4.9,
    distanceToVenue: "0.5 mi",
    tags: ["Luxury", "Top rated", "Out of policy"],
    images: [
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=500&fit=crop",
    ],
    amenities: ["Free Wi-Fi", "Spa", "Pool", "Fine dining", "24/7 concierge", "Valet parking", "Fitness center"],
    reviewCount: 892,
    description: "Experience five-star luxury in the heart of San Francisco. The Four Seasons offers exceptional service, stunning views, and world-renowned dining options.",
    cancellationPolicy: "Free cancellation until 72 hours before check-in",
    roomTypes: ["Superior Room", "Deluxe Suite", "Presidential Suite"],
  },
  {
    id: "ht-4",
    name: "Holiday Inn Express",
    area: "SOMA District",
    pricePerNight: 189,
    totalPrice: 756,
    rating: 4.1,
    distanceToVenue: "0.3 mi",
    tags: ["Budget friendly", "Breakfast included"],
    images: [
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1587213811864-46e59f6873b1?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=500&fit=crop",
    ],
    amenities: ["Free Wi-Fi", "Breakfast included", "Fitness center", "Business center"],
    reviewCount: 1456,
    description: "Clean, comfortable, and budget-friendly. Perfect for business travelers who want convenience without the premium price tag. Complimentary hot breakfast included.",
    cancellationPolicy: "Free cancellation until 24 hours before check-in",
    roomTypes: ["Standard Room", "King Room"],
  },
  {
    id: "ht-5",
    name: "W San Francisco",
    area: "SOMA District",
    pricePerNight: 425,
    totalPrice: 1700,
    rating: 4.5,
    distanceToVenue: "0.2 mi",
    tags: ["Trendy", "Out of policy"],
    images: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=500&fit=crop",
    ],
    amenities: ["Free Wi-Fi", "Rooftop bar", "Gym", "Spa", "Restaurant", "Room service"],
    reviewCount: 1678,
    description: "Modern luxury meets urban energy. The W offers bold design, vibrant nightlife, and all the amenities for the style-conscious business traveler.",
    cancellationPolicy: "Free cancellation until 48 hours before check-in",
    roomTypes: ["Wonderful Room", "Spectacular Suite", "Extreme Wow Suite"],
  },
];

export function generateSeatMap(): SeatOption[] {
  const seats: SeatOption[] = [];
  const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  // First class (rows 1-2)
  for (let row = 1; row <= 2; row++) {
    for (const letter of ['A', 'C', 'D', 'F']) {
      seats.push({
        id: `${row}${letter}`,
        row,
        seat: letter,
        type: 'first',
        available: Math.random() > 0.3,
        price: 250,
      });
    }
  }
  
  // Business (rows 3-5)
  for (let row = 3; row <= 5; row++) {
    for (const letter of ['A', 'B', 'E', 'F']) {
      seats.push({
        id: `${row}${letter}`,
        row,
        seat: letter,
        type: 'business',
        available: Math.random() > 0.4,
        price: 150,
      });
    }
  }
  
  // Exit row (row 10)
  for (const letter of seatLetters) {
    seats.push({
      id: `10${letter}`,
      row: 10,
      seat: letter,
      type: 'exit',
      available: Math.random() > 0.5,
      price: 75,
    });
  }
  
  // Preferred (rows 6-9)
  for (let row = 6; row <= 9; row++) {
    for (const letter of seatLetters) {
      seats.push({
        id: `${row}${letter}`,
        row,
        seat: letter,
        type: 'preferred',
        available: Math.random() > 0.3,
        price: 45,
      });
    }
  }
  
  // Economy (rows 11-25)
  for (let row = 11; row <= 25; row++) {
    for (const letter of seatLetters) {
      seats.push({
        id: `${row}${letter}`,
        row,
        seat: letter,
        type: 'economy',
        available: Math.random() > 0.25,
        price: 0,
      });
    }
  }
  
  return seats;
}
