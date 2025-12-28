import { useState, useRef, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plane, 
  Building2, 
  Calendar, 
  MapPin, 
  Send,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamMember } from "./TeamMemberCard";

interface TeamMemberPanelProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "member";
  timestamp: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hey! Are you going to be at the NYC office next week?",
    sender: "user",
    timestamp: "10:30 AM",
  },
  {
    id: "2",
    content: "Yes! I'll be there Tuesday through Thursday. Want to grab coffee?",
    sender: "member",
    timestamp: "10:32 AM",
  },
  {
    id: "3",
    content: "Perfect! Let's meet at Blue Bottle around 2pm on Tuesday.",
    sender: "user",
    timestamp: "10:33 AM",
  },
];

export function TeamMemberPanel({ member, open, onOpenChange }: TeamMemberPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initials = member?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    // Simulate response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sounds great! Looking forward to it 👋",
        sender: "member",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, response]);
    }, 1000);
  };

  if (!member) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        {/* Header */}
        <div className="p-6 pb-4">
          <SheetHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl">{member.name}</SheetTitle>
                <SheetDescription>
                  {member.role} · {member.team}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Trip Details */}
        {member.upcomingTrip && (
          <div className="px-6 pb-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Plane className="w-4 h-4 text-primary" />
                Upcoming Trip
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{member.upcomingTrip.destination}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {member.upcomingTrip.startDate} – {member.upcomingTrip.endDate}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Chat Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-6 py-3 flex items-center gap-2 border-b border-border/50">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Messages</span>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5",
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={cn(
                        "text-[10px] mt-1",
                        message.sender === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-muted/50 border-border/50 focus:border-primary/30"
              />
              <Button 
                type="submit" 
                size="icon"
                className="bg-primary hover:bg-primary/90 shrink-0"
                disabled={!newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
