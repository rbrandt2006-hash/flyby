import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageSquarePlus, AlertCircle } from "lucide-react";
import { ChatUser } from "@/hooks/useChats";

interface CreateGroupChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: ChatUser[];
  onCreateChat: (name: string, memberIds: string[]) => void;
}

export function CreateGroupChatModal({
  open,
  onOpenChange,
  teamMembers,
  onCreateChat,
}: CreateGroupChatModalProps) {
  const [chatName, setChatName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [errors, setErrors] = useState<{ name?: string; members?: string }>({});

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return teamMembers;
    const query = searchQuery.toLowerCase();
    return teamMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.role.toLowerCase().includes(query)
    );
  }, [teamMembers, searchQuery]);

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
    // Clear member error when selecting
    if (errors.members) {
      setErrors((prev) => ({ ...prev, members: undefined }));
    }
  };

  const handleCreate = () => {
    const newErrors: { name?: string; members?: string } = {};

    if (!chatName.trim()) {
      newErrors.name = "Chat name is required";
    }

    if (selectedMembers.length < 2) {
      newErrors.members = "Select at least 2 members";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onCreateChat(chatName.trim(), selectedMembers);
    handleClose();
  };

  const handleClose = () => {
    setChatName("");
    setSelectedMembers([]);
    setSearchQuery("");
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-primary" />
            Create Group Chat
          </DialogTitle>
          <DialogDescription>
            Create a new group chat with your team members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Chat name input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Chat Name</label>
            <Input
              placeholder="e.g., Q1 Planning Team"
              value={chatName}
              onChange={(e) => {
                setChatName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Member search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Select Members ({selectedMembers.length} selected)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Member list */}
          <ScrollArea className="h-[200px] rounded-md border">
            <div className="p-2 space-y-1">
              {filteredMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No members found
                </p>
              ) : (
                filteredMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={() => toggleMember(member.id)}
                    />
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.role}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </ScrollArea>
          {errors.members && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.members}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Chat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
