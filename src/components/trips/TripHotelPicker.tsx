import { HotelSelectionPage } from "@/components/trips/HotelSelectionPage";
import type { HotelOption } from "@/components/chats/booking/types";

interface TripHotelPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotels: HotelOption[];
  selectedHotel: HotelOption | null;
  onSelect: (hotel: HotelOption) => void;
  nights: number;
  venueName?: string;
}

/**
 * TripHotelPicker - Wrapper component that opens the full-screen hotel selection page
 * This replaces the previous drawer implementation with a full-screen experience
 */
export function TripHotelPicker({
  open,
  onOpenChange,
  hotels,
  selectedHotel,
  onSelect,
  nights,
  venueName = "venue",
}: TripHotelPickerProps) {
  return (
    <HotelSelectionPage
      open={open}
      onClose={() => onOpenChange(false)}
      hotels={hotels}
      selectedHotel={selectedHotel}
      onSelect={onSelect}
      nights={nights}
      venueName={venueName}
    />
  );
}
