import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  X, 
  Share2,
  Check,
  MessageSquare,
  AlertTriangle,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays } from "date-fns";
import type { LocalTrip } from "@/hooks/useTrips";
import { toast } from "sonner";

interface TripConflict {
  tripA: LocalTrip;
  tripB: LocalTrip;
  overlapStart: Date;
  overlapEnd: Date;
}

interface CalendarShareModalProps {
  open: boolean;
  onClose: () => void;
  trips: LocalTrip[];
  conflicts: TripConflict[];
  dateRange: string;
}

// Mock channels for demo
const mockChannels = [
  { id: "ch-1", name: "general", platform: "Slack" },
  { id: "ch-2", name: "travel-requests", platform: "Slack" },
  { id: "ch-3", name: "manager-approvals", platform: "Slack" },
  { id: "ch-4", name: "team-updates", platform: "Teams" },
];

export function CalendarShareModal({ 
  open, 
  onClose, 
  trips,
  conflicts,
  dateRange 
}: CalendarShareModalProps) {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [message, setMessage] = useState(() => {
    const conflictText = conflicts.length > 0 
      ? `Conflicts: ${conflicts.length} overlapping trip(s) need attention.`
      : "Conflicts: None";
    return `Hi — here's my confirmed work travel schedule for ${dateRange}. Let me know if you want changes.\n\n${conflictText}`;
  });
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includePending, setIncludePending] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);

  const handleSend = async () => {
    if (!selectedChannel) {
      toast.error("Please select a channel");
      return;
    }

    setSending(true);
    
    // Simulate sending message
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSending(false);
    setSent(true);
    
    const channel = mockChannels.find(c => c.id === selectedChannel);
    toast.success(`Shared to #${channel?.name}`);
    
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1500);
  };

  const filteredTrips = includePending 
    ? trips 
    : trips.filter(t => t.approvalStatus !== "pending");

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
                <Share2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Share with Manager</h2>
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
          <div className="p-6 space-y-5">
            {/* Channel selection */}
            <div className="space-y-2">
              <Label>Send to channel</Label>
              <div className="relative">
                <button
                  onClick={() => setChannelDropdownOpen(!channelDropdownOpen)}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-lg border border-input bg-background text-left flex items-center justify-between",
                    "hover:border-primary/30 transition-colors"
                  )}
                >
                  {selectedChannel ? (
                    <span>
                      #{mockChannels.find(c => c.id === selectedChannel)?.name}
                      <span className="text-muted-foreground ml-2 text-sm">
                        ({mockChannels.find(c => c.id === selectedChannel)?.platform})
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Select a channel...</span>
                  )}
                  <ChevronDown className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    channelDropdownOpen && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {channelDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
                    >
                      {mockChannels.map(channel => (
                        <button
                          key={channel.id}
                          onClick={() => {
                            setSelectedChannel(channel.id);
                            setChannelDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-muted transition-colors",
                            selectedChannel === channel.id && "bg-primary/5"
                          )}
                        >
                          <span>#{channel.name}</span>
                          <span className="text-xs text-muted-foreground">{channel.platform}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                placeholder="Add a message for your manager..."
                className="resize-none"
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label className="text-sm">Include</Label>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-details"
                  checked={includeDetails}
                  onCheckedChange={(checked) => setIncludeDetails(!!checked)}
                />
                <label htmlFor="include-details" className="text-sm cursor-pointer">
                  Trip itinerary details (flight/hotel/ground)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-pending"
                  checked={includePending}
                  onCheckedChange={(checked) => setIncludePending(!!checked)}
                />
                <label htmlFor="include-pending" className="text-sm cursor-pointer">
                  Include pending approval trips
                </label>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Trips to share:</span>
                <span className="font-medium">{filteredTrips.length}</span>
              </div>
              {conflicts.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} will be highlighted</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/40 bg-muted/30 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending || !selectedChannel}>
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : sent ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Sent!
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send to Channel
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
