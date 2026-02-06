import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  X, 
  FileDown,
  Check,
  Plane,
  Building2,
  Car,
  AlertTriangle,
  Calendar,
  MapPin,
  DollarSign
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import type { LocalTrip } from "@/hooks/useTrips";
import { toast } from "sonner";

interface TripConflict {
  tripA: LocalTrip;
  tripB: LocalTrip;
  overlapStart: Date;
  overlapEnd: Date;
}

interface CalendarExportModalProps {
  open: boolean;
  onClose: () => void;
  trips: LocalTrip[];
  conflicts: TripConflict[];
  dateRange: string;
}

export function CalendarExportModal({ 
  open, 
  onClose, 
  trips,
  conflicts,
  dateRange 
}: CalendarExportModalProps) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate printable HTML content
    const content = generatePrintableContent(trips, conflicts, dateRange);
    
    // Open in new window for printing/saving
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      
      // Auto-trigger print dialog
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
    
    setExporting(false);
    setExported(true);
    toast.success("PDF ready for download");
    
    setTimeout(() => {
      setExported(false);
    }, 2000);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileDown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Export Calendar</h2>
                <p className="text-sm text-muted-foreground">{dateRange}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <h3 className="font-medium text-sm">Export includes:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  {trips.length} trip{trips.length !== 1 ? 's' : ''} in date range
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  Destination, dates, and status for each trip
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  Flight, hotel, and ground transport details
                </li>
                {conflicts.length > 0 && (
                  <li className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} highlighted
                  </li>
                )}
              </ul>
            </div>

            <p className="text-xs text-muted-foreground">
              The PDF will open in a new window. Use your browser's print dialog to save as PDF or print directly.
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/40 bg-muted/30 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : exported ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Exported
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function generatePrintableContent(
  trips: LocalTrip[], 
  conflicts: TripConflict[],
  dateRange: string
): string {
  const tripRows = trips.map(trip => {
    const startDate = parseISO(trip.startDate);
    const endDate = parseISO(trip.endDate);
    const nights = differenceInDays(endDate, startDate);
    const hasConflict = conflicts.some(c => c.tripA.id === trip.id || c.tripB.id === trip.id);
    
    return `
      <tr style="${hasConflict ? 'background-color: #fef2f2;' : ''}">
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${trip.destination}</strong>
          ${hasConflict ? '<span style="color: #dc2626; font-size: 12px;"> ⚠️ Conflict</span>' : ''}
          <br>
          <span style="color: #6b7280; font-size: 12px;">${trip.purpose || 'Business trip'}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d, yyyy')}<br>
          <span style="color: #6b7280; font-size: 12px;">${nights} night${nights !== 1 ? 's' : ''}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${trip.approvalStatus === 'approved' ? '✅ Approved' : 
            trip.approvalStatus === 'pending' ? '⏳ Pending' : 
            trip.approvalStatus === 'rejected' ? '❌ Rejected' : 'Confirmed'}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${trip.flight ? `✈️ ${trip.flight.airline}` : '-'}<br>
          ${trip.hotel ? `🏨 ${trip.hotel.name}` : '-'}<br>
          ${trip.groundTransport ? `🚗 ${trip.groundTransport}` : '-'}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <strong>$${trip.estimatedCost.toLocaleString()}</strong>
        </td>
      </tr>
    `;
  }).join('');

  const conflictSection = conflicts.length > 0 ? `
    <div style="margin-top: 32px; padding: 16px; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
      <h3 style="color: #dc2626; margin-bottom: 12px;">⚠️ Trip Conflicts (${conflicts.length})</h3>
      ${conflicts.map(c => `
        <p style="margin: 8px 0; font-size: 14px;">
          <strong>${c.tripA.destination}</strong> and <strong>${c.tripB.destination}</strong> 
          overlap from ${format(c.overlapStart, 'MMM d')} to ${format(c.overlapEnd, 'MMM d, yyyy')}
        </p>
      `).join('')}
    </div>
  ` : '';

  const totalCost = trips.reduce((sum, t) => sum + t.estimatedCost, 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Flyby Travel Schedule - ${dateRange}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #1f2937;
          max-width: 1000px;
          margin: 0 auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 24px;
        }
        th {
          text-align: left;
          padding: 12px;
          background-color: #f3f4f6;
          border-bottom: 2px solid #e5e7eb;
          font-weight: 600;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px;">
        <div>
          <h1 style="margin: 0; font-size: 24px;">Travel Schedule</h1>
          <p style="margin: 4px 0 0; color: #6b7280;">${dateRange}</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 20px; font-weight: bold;">flyby</div>
          <div style="font-size: 12px; color: #6b7280;">Generated ${format(new Date(), 'MMM d, yyyy')}</div>
        </div>
      </div>

      <div style="display: flex; gap: 24px; margin-bottom: 24px;">
        <div style="padding: 16px; background-color: #f3f4f6; border-radius: 8px; flex: 1;">
          <div style="font-size: 24px; font-weight: bold;">${trips.length}</div>
          <div style="font-size: 14px; color: #6b7280;">Total Trips</div>
        </div>
        <div style="padding: 16px; background-color: #f3f4f6; border-radius: 8px; flex: 1;">
          <div style="font-size: 24px; font-weight: bold;">$${totalCost.toLocaleString()}</div>
          <div style="font-size: 14px; color: #6b7280;">Estimated Total</div>
        </div>
        <div style="padding: 16px; background-color: ${conflicts.length > 0 ? '#fef2f2' : '#f3f4f6'}; border-radius: 8px; flex: 1;">
          <div style="font-size: 24px; font-weight: bold; color: ${conflicts.length > 0 ? '#dc2626' : 'inherit'};">${conflicts.length}</div>
          <div style="font-size: 14px; color: #6b7280;">Conflicts</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Destination</th>
            <th>Dates</th>
            <th>Status</th>
            <th>Itinerary</th>
            <th style="text-align: right;">Est. Cost</th>
          </tr>
        </thead>
        <tbody>
          ${tripRows}
        </tbody>
      </table>

      ${conflictSection}

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
        Exported from Flyby • ${format(new Date(), 'MMMM d, yyyy h:mm a')}
      </div>
    </body>
    </html>
  `;
}
