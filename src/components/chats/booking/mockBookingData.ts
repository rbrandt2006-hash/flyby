import type { FlightOption, HotelOption, SeatOption } from "./types";

export const mockFlightOptions: FlightOption[] = [];

export const mockHotelOptions: HotelOption[] = [];

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
