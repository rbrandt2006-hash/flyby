import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SeatOption } from "./types";

interface SeatMapViewProps {
  seats: SeatOption[];
  selectedSeat: SeatOption | null;
  onSelectSeat: (seat: SeatOption) => void;
}

const seatTypeLabels: Record<SeatOption['type'], { label: string; color: string; bgColor: string }> = {
  first: { label: "First Class", color: "text-amber-700 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  business: { label: "Business", color: "text-purple-700 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  exit: { label: "Exit Row", color: "text-blue-700 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  preferred: { label: "Preferred", color: "text-green-700 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30" },
  economy: { label: "Economy", color: "text-muted-foreground", bgColor: "bg-muted" },
};

export function SeatMapView({ seats, selectedSeat, onSelectSeat }: SeatMapViewProps) {
  const groupedByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<number, SeatOption[]>);

  const rows = Object.keys(groupedByRow)
    .map(Number)
    .sort((a, b) => a - b);

  const getSeatStyle = (seat: SeatOption) => {
    const typeInfo = seatTypeLabels[seat.type];
    if (!seat.available) {
      return "bg-muted/50 text-muted-foreground/30 cursor-not-allowed";
    }
    if (selectedSeat?.id === seat.id) {
      return "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2";
    }
    return cn(typeInfo.bgColor, typeInfo.color, "hover:ring-2 hover:ring-primary/50 cursor-pointer");
  };

  return (
    <div className="px-4 py-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 p-3 rounded-xl bg-muted/30 border border-border/40">
        {Object.entries(seatTypeLabels).map(([type, info]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={cn("w-5 h-5 rounded", info.bgColor)} />
            <span className="text-xs text-muted-foreground">{info.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-muted/50 border-2 border-dashed border-muted-foreground/20" />
          <span className="text-xs text-muted-foreground">Taken</span>
        </div>
      </div>

      {/* Seat pricing */}
      <div className="grid grid-cols-4 gap-2 mb-6 text-center">
        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-muted-foreground">First</p>
          <p className="font-semibold text-amber-700 dark:text-amber-400">+$250</p>
        </div>
        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-muted-foreground">Business</p>
          <p className="font-semibold text-purple-700 dark:text-purple-400">+$150</p>
        </div>
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-muted-foreground">Exit</p>
          <p className="font-semibold text-blue-700 dark:text-blue-400">+$75</p>
        </div>
        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-xs text-muted-foreground">Preferred</p>
          <p className="font-semibold text-green-700 dark:text-green-400">+$45</p>
        </div>
      </div>

      {/* Plane visualization */}
      <div className="relative">
        {/* Plane nose */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-8 bg-muted/50 rounded-t-full border border-border/40" />
        </div>

        {/* Seat grid */}
        <div className="space-y-1.5 max-w-[280px] mx-auto">
          {rows.map((rowNum) => {
            const rowSeats = groupedByRow[rowNum].sort((a, b) => a.seat.localeCompare(b.seat));
            const leftSeats = rowSeats.filter(s => ['A', 'B', 'C'].includes(s.seat));
            const rightSeats = rowSeats.filter(s => ['D', 'E', 'F'].includes(s.seat));
            
            // Determine row type for styling
            const rowType = rowSeats[0]?.type;
            const isSpecialRow = rowType !== 'economy';
            
            return (
              <div key={rowNum} className="flex items-center gap-2">
                {/* Row number */}
                <span className="w-5 text-xs text-muted-foreground text-right shrink-0">
                  {rowNum}
                </span>
                
                {/* Left side seats */}
                <div className="flex gap-0.5">
                  {leftSeats.map((seat) => (
                    <motion.button
                      key={seat.id}
                      whileHover={seat.available ? { scale: 1.1 } : undefined}
                      whileTap={seat.available ? { scale: 0.95 } : undefined}
                      onClick={() => seat.available && onSelectSeat(seat)}
                      disabled={!seat.available}
                      className={cn(
                        "w-8 h-8 rounded text-xs font-medium transition-all",
                        getSeatStyle(seat)
                      )}
                    >
                      {seat.seat}
                    </motion.button>
                  ))}
                </div>

                {/* Aisle */}
                <div className="w-8 flex items-center justify-center">
                  {isSpecialRow && (
                    <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                      {rowType === 'first' ? 'F' : rowType === 'business' ? 'B' : rowType === 'exit' ? 'E' : 'P'}
                    </span>
                  )}
                </div>

                {/* Right side seats */}
                <div className="flex gap-0.5">
                  {rightSeats.map((seat) => (
                    <motion.button
                      key={seat.id}
                      whileHover={seat.available ? { scale: 1.1 } : undefined}
                      whileTap={seat.available ? { scale: 0.95 } : undefined}
                      onClick={() => seat.available && onSelectSeat(seat)}
                      disabled={!seat.available}
                      className={cn(
                        "w-8 h-8 rounded text-xs font-medium transition-all",
                        getSeatStyle(seat)
                      )}
                    >
                      {seat.seat}
                    </motion.button>
                  ))}
                </div>

                {/* Row number (right) */}
                <span className="w-5 text-xs text-muted-foreground text-left shrink-0">
                  {rowNum}
                </span>
              </div>
            );
          })}
        </div>

        {/* Plane tail */}
        <div className="flex justify-center mt-4">
          <div className="w-16 h-4 bg-muted/50 rounded-b border border-t-0 border-border/40" />
        </div>
      </div>
    </div>
  );
}
