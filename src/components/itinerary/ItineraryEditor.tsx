import { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { format, addDays } from "date-fns";
import { 
  Plus, AlertTriangle, Clock, Globe, Save, RotateCcw, 
  ChevronDown, ChevronUp, Pencil, Check, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useItinerary } from "@/hooks/useItinerary";
import { ItineraryBlockCard } from "./ItineraryBlockCard";
import { BlockEditorPanel } from "./BlockEditorPanel";
import { ItineraryBlock, ItineraryBlockType, ItineraryWarning } from "@/types/itinerary";
import { toast } from "sonner";

interface ItineraryEditorProps {
  tripId: string;
  startDate: Date;
  endDate: Date;
  destination?: string;
  tripData?: {
    destination?: string;
    flight?: {
      airline?: string;
      flightNumber?: string;
      departTime?: string;
      returnTime?: string;
    };
    hotel?: {
      name?: string;
      location?: string;
    };
  };
  isEditing: boolean;
  onSave?: () => void;
}

export function ItineraryEditor({
  tripId,
  startDate,
  endDate,
  destination,
  tripData,
  isEditing,
  onSave,
}: ItineraryEditorProps) {
  const {
    itinerary,
    warnings,
    hasUnsavedChanges,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    reorderBlocks,
    updateDayTitle,
    resetItinerary,
    markAsSaved,
  } = useItinerary({
    tripId,
    startDate,
    endDate,
    tripData,
  });
  
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0, 1, 2]));
  const [editingBlock, setEditingBlock] = useState<ItineraryBlock | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [newBlockDayIndex, setNewBlockDayIndex] = useState<number | null>(null);
  const [newBlockType, setNewBlockType] = useState<ItineraryBlockType>("meeting");
  const [editingDayTitle, setEditingDayTitle] = useState<number | null>(null);
  const [dayTitleValue, setDayTitleValue] = useState("");
  
  const toggleDay = useCallback((dayIndex: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayIndex)) {
        next.delete(dayIndex);
      } else {
        next.add(dayIndex);
      }
      return next;
    });
  }, []);
  
  const handleEditBlock = useCallback((block: ItineraryBlock) => {
    setEditingBlock(block);
    setNewBlockDayIndex(null);
    setIsEditorOpen(true);
  }, []);
  
  const handleAddBlock = useCallback((dayIndex: number, type: ItineraryBlockType) => {
    setEditingBlock(null);
    setNewBlockDayIndex(dayIndex);
    setNewBlockType(type);
    setIsEditorOpen(true);
  }, []);
  
  const handleSaveBlock = useCallback((blockData: Record<string, unknown>) => {
    if (editingBlock) {
      updateBlock(editingBlock.id, blockData);
      toast.success("Block updated");
    } else if (newBlockDayIndex !== null) {
      addBlock(newBlockDayIndex, blockData as Omit<ItineraryBlock, "id" | "order" | "dayIndex">);
      toast.success("Block added");
    }
    setIsEditorOpen(false);
    setEditingBlock(null);
    setNewBlockDayIndex(null);
  }, [editingBlock, newBlockDayIndex, updateBlock, addBlock]);
  
  const handleDeleteBlock = useCallback((blockId: string) => {
    deleteBlock(blockId);
    toast.success("Block removed");
  }, [deleteBlock]);
  
  const handleDuplicateBlock = useCallback((blockId: string) => {
    duplicateBlock(blockId);
    toast.success("Block duplicated");
  }, [duplicateBlock]);
  
  const startEditingDayTitle = useCallback((dayIndex: number, currentTitle: string) => {
    setEditingDayTitle(dayIndex);
    setDayTitleValue(currentTitle);
  }, []);
  
  const saveDayTitle = useCallback(() => {
    if (editingDayTitle !== null && dayTitleValue.trim()) {
      updateDayTitle(editingDayTitle, dayTitleValue.trim());
      toast.success("Day title updated");
    }
    setEditingDayTitle(null);
    setDayTitleValue("");
  }, [editingDayTitle, dayTitleValue, updateDayTitle]);
  
  const handleSaveAll = useCallback(() => {
    markAsSaved();
    toast.success("Itinerary saved");
    onSave?.();
  }, [markAsSaved, onSave]);
  
  const handleReset = useCallback(() => {
    resetItinerary();
    toast.success("Itinerary reset to default");
  }, [resetItinerary]);
  
  const getWarningsForBlock = useCallback((blockId: string): ItineraryWarning | undefined => {
    return warnings.find(w => w.blockIds.includes(blockId));
  }, [warnings]);
  
  const getWarningsForDay = useCallback((dayIndex: number): ItineraryWarning[] => {
    return warnings.filter(w => w.dayIndex === dayIndex);
  }, [warnings]);
  
  const blockTypeOptions: { type: ItineraryBlockType; label: string; emoji: string }[] = [
    { type: "meeting", label: "Meeting", emoji: "👥" },
    { type: "meal", label: "Business Meal", emoji: "🍽️" },
    { type: "transport", label: "Transportation", emoji: "🚗" },
    { type: "free_time", label: "Free Time", emoji: "🕐" },
    { type: "flight", label: "Flight", emoji: "✈️" },
    { type: "hotel_checkin", label: "Hotel Check-in", emoji: "🏨" },
    { type: "hotel_checkout", label: "Hotel Check-out", emoji: "🚪" },
    { type: "custom", label: "Other", emoji: "📝" },
  ];
  
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span>{itinerary.timezone}</span>
          </div>
          {hasUnsavedChanges && isEditing && (
            <Badge variant="secondary" className="text-xs bg-warning/10 text-warning border-warning/20">
              Unsaved changes
            </Badge>
          )}
        </div>
        
        {isEditing && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveAll}
              disabled={!hasUnsavedChanges}
            >
              <Save className="w-4 h-4 mr-1" />
              Save Itinerary
            </Button>
          </div>
        )}
      </div>
      
      {/* Warnings summary */}
      {warnings.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning">
                  {warnings.length} schedule {warnings.length === 1 ? "warning" : "warnings"}
                </p>
                <ul className="mt-1 space-y-1">
                  {warnings.slice(0, 3).map(warning => (
                    <li key={warning.id} className="text-sm text-warning/80">
                      • {warning.message}
                    </li>
                  ))}
                  {warnings.length > 3 && (
                    <li className="text-sm text-warning/60">
                      ...and {warnings.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Days */}
      <div className="space-y-4">
        {itinerary.days.map((day) => {
          const dayWarnings = getWarningsForDay(day.dayIndex);
          const isExpanded = expandedDays.has(day.dayIndex);
          
          return (
            <Card 
              key={day.dayIndex} 
              className={cn(
                "border transition-all",
                dayWarnings.length > 0 ? "border-warning/30" : "border-border/50"
              )}
            >
              <CardHeader 
                className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleDay(day.dayIndex)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Day number badge */}
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {format(day.date, "EEE")}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {format(day.date, "d")}
                      </span>
                    </div>
                    
                    {/* Day title */}
                    <div>
                      {editingDayTitle === day.dayIndex && isEditing ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <Input
                            value={dayTitleValue}
                            onChange={(e) => setDayTitleValue(e.target.value)}
                            className="h-8 w-48"
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveDayTitle}>
                            <Check className="w-4 h-4 text-success" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingDayTitle(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{day.title}</CardTitle>
                          {isEditing && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingDayTitle(day.dayIndex, day.title);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {format(day.date, "MMMM d, yyyy")} • {day.blocks.length} {day.blocks.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {dayWarnings.length > 0 && (
                      <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10">
                        {dayWarnings.length} {dayWarnings.length === 1 ? "warning" : "warnings"}
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="pt-0 space-y-3">
                      {/* Blocks */}
                      {day.blocks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No activities scheduled</p>
                          {isEditing && (
                            <p className="text-xs mt-1">Click "Add item" to add activities</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {day.blocks.map((block, blockIndex) => {
                            const blockWarning = getWarningsForBlock(block.id);
                            return (
                              <ItineraryBlockCard
                                key={block.id}
                                block={block}
                                isEditing={isEditing}
                                hasWarning={!!blockWarning}
                                warningMessage={blockWarning?.message}
                                onEdit={() => handleEditBlock(block)}
                                onDelete={() => handleDeleteBlock(block.id)}
                                onDuplicate={() => handleDuplicateBlock(block.id)}
                              />
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Add block button */}
                      {isEditing && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full border-dashed hover:border-primary/50 hover:bg-primary/5"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add item
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center" className="w-48">
                            {blockTypeOptions.map(option => (
                              <DropdownMenuItem
                                key={option.type}
                                onClick={() => handleAddBlock(day.dayIndex, option.type)}
                              >
                                <span className="mr-2">{option.emoji}</span>
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
      
      {/* Block Editor Panel */}
      <BlockEditorPanel
        block={editingBlock}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingBlock(null);
          setNewBlockDayIndex(null);
        }}
        onSave={handleSaveBlock}
        isNewBlock={newBlockDayIndex !== null}
        defaultType={newBlockType}
      />
    </div>
  );
}
