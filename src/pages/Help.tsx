import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Search, 
  ArrowLeft, 
  Rocket, 
  Plane, 
  CreditCard, 
  Receipt, 
  Shield, 
  Puzzle, 
  AlertTriangle,
  MessageCircle,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContactSupportModal } from "@/components/settings/ContactSupportModal";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    category: "Getting Started",
    question: "How do I get started with FlyBy?",
    answer: "Welcome to FlyBy! Start by connecting your calendar to automatically detect upcoming travel. Then, when you see a trip suggestion, click 'Plan Trip' to let our AI assistant find flights, hotels, and ground transport for you. You can customize preferences in Settings to personalize your experience."
  },
  {
    category: "Getting Started",
    question: "How do I plan a trip?",
    answer: "There are two ways to plan a trip: 1) Connect your calendar and click 'Plan Trip' on detected events, or 2) Go to the Trips page and click 'New Trip' to manually create one. Our AI will search for the best flight, hotel, and ground transport options based on your preferences."
  },
  {
    category: "Getting Started",
    question: "What information do I need to book a trip?",
    answer: "To book a trip, you'll need: destination, travel dates, and preferred departure city. Optional but helpful: specific venue address, budget constraints, and any special requirements like accessibility needs or dietary restrictions."
  },

  // Booking & Trip Planning
  {
    category: "Booking & Trip Planning",
    question: "Can I book flights and hotels in one request?",
    answer: "Yes! FlyBy's AI automatically bundles flights, hotels, and ground transportation into a single trip plan. When you click 'Plan Trip', we search all three categories simultaneously and present you with coordinated options that work together."
  },
  {
    category: "Booking & Trip Planning",
    question: "How do I modify a confirmed trip?",
    answer: "Go to the Trips page, find your trip, and click on it to open the details panel. From there, you can click 'Modify Trip' to change flights, hotels, or dates. Note that changes may incur fees depending on the booking policies."
  },
  {
    category: "Booking & Trip Planning",
    question: "Can I save a trip without booking?",
    answer: "Yes! Click 'Save as Draft' instead of 'Confirm Trip' to save your planned itinerary without booking. You can return to drafts anytime from the Trips page and confirm when ready."
  },
  {
    category: "Booking & Trip Planning",
    question: "Why isn't my trip plan generating?",
    answer: "Trip planning may fail if: 1) The destination is unclear or misspelled, 2) Dates are in the past, 3) There's a temporary service issue. Try refreshing the page, checking your internet connection, or rephrasing the destination. If issues persist, contact support."
  },

  // Payments & Billing
  {
    category: "Payments & Billing",
    question: "How do I add a corporate card for bookings?",
    answer: "Go to Settings → Travel Preferences → Expenses & Payments. Click 'Add Payment Method' and enter your corporate card details. Cards are encrypted and stored securely. Your company admin can also pre-configure cards for the entire team."
  },
  {
    category: "Payments & Billing",
    question: "Will I be charged immediately when I confirm a trip?",
    answer: "Most bookings are charged immediately upon confirmation. Some hotels may only authorize your card and charge at checkout. Flight tickets are typically charged right away. Review the payment terms shown before confirming."
  },

  // Expense & Receipts
  {
    category: "Expense & Receipts",
    question: "How do I submit an expense report?",
    answer: "Go to the Expenses page and click 'Add Expense'. Upload your receipt, enter the amount and category, and link it to a trip if applicable. Once all expenses are added, click 'Submit for Approval' to send to your manager."
  },
  {
    category: "Expense & Receipts",
    question: "Can expenses be automatically matched to trips?",
    answer: "Yes! Enable 'Auto-match expenses to trips' in Settings → Travel Preferences. FlyBy will automatically link credit card transactions to your confirmed trips based on date, location, and merchant."
  },

  // Account & Security
  {
    category: "Account & Security",
    question: "How do I reset my password?",
    answer: "Go to Settings → Security & Privacy and click 'Change Password'. You'll need to enter your current password, then your new password twice. For forgotten passwords, click 'Forgot Password' on the login page to receive a reset link via email."
  },
  {
    category: "Account & Security",
    question: "How do I enable 2FA (two-factor authentication)?",
    answer: "Go to Settings → Security & Privacy and toggle on 'Two-factor authentication'. You'll be prompted to enter your phone number and verify it with a code. Once enabled, you'll receive SMS codes when logging in from new devices."
  },
  {
    category: "Account & Security",
    question: "How do I update my seat or meal preferences?",
    answer: "Go to Settings → Travel Preferences. Click on your preferred seat type (Window, Aisle, or Middle) to select it. For meal preferences, select from the available options (Standard, Vegetarian, Vegan, Kosher, Halal). Changes are saved automatically and applied to future bookings."
  },

  // Integrations
  {
    category: "Integrations",
    question: "How do Slack and Teams replies work?",
    answer: "When connected, FlyBy sends trip notifications to your Slack/Teams. You can reply directly in the chat to modify trips, approve expenses, or ask questions. Commands like 'change hotel' or 'approve expense' are understood automatically."
  },
  {
    category: "Integrations",
    question: "How do I connect my calendar?",
    answer: "Go to Settings → Integrations and click 'Connect' next to Google Calendar or Outlook. Authorize FlyBy to read your calendar events. Once connected, travel-related events will appear as trip suggestions on your dashboard."
  },

  // Troubleshooting
  {
    category: "Troubleshooting",
    question: "My calendar events aren't syncing. What should I do?",
    answer: "First, check that your calendar is still connected in Settings → Integrations. Try disconnecting and reconnecting. Ensure FlyBy has permission to read your calendar. If using Outlook, verify your company allows third-party calendar access."
  },
  {
    category: "Troubleshooting",
    question: "I'm seeing an error when trying to book. What should I do?",
    answer: "Common fixes: 1) Refresh the page, 2) Check your payment method is valid, 3) Verify the trip dates and destination, 4) Clear your browser cache. If the error persists, take a screenshot and contact support with details about what you were trying to do."
  },
];

const categories = [
  { name: "Getting Started", icon: Rocket },
  { name: "Booking & Trip Planning", icon: Plane },
  { name: "Payments & Billing", icon: CreditCard },
  { name: "Expense & Receipts", icon: Receipt },
  { name: "Account & Security", icon: Shield },
  { name: "Integrations", icon: Puzzle },
  { name: "Troubleshooting", icon: AlertTriangle },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function Help() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Filter FAQs based on search and category
  const filteredFAQs = useMemo(() => {
    let items = faqData;
    
    if (selectedCategory) {
      items = items.filter(item => item.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        item =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }
    
    return items;
  }, [searchQuery, selectedCategory]);

  // Group FAQs by category for display
  const groupedFAQs = useMemo(() => {
    const groups: Record<string, FAQItem[]> = {};
    filteredFAQs.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredFAQs]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-4xl mx-auto pb-20 md:pb-0"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/settings")}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
            <p className="text-muted-foreground">Find answers and get support</p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search FlyBy help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 pl-12 pr-4 rounded-2xl text-lg bg-card border-2 focus:border-primary"
          />
        </div>
      </motion.div>

      {/* Category Pills */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="rounded-full"
          >
            All Topics
          </Button>
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.name}
                variant={selectedCategory === cat.name ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.name)}
                className="rounded-full"
              >
                <Icon className="w-4 h-4 mr-1.5" />
                {cat.name}
              </Button>
            );
          })}
        </div>
      </motion.div>

      {/* FAQ Accordion */}
      <motion.div variants={itemVariants}>
        {filteredFAQs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4">
                We couldn't find any articles matching "{searchQuery}"
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFAQs).map(([category, items]) => {
              const categoryConfig = categories.find(c => c.name === category);
              const Icon = categoryConfig?.icon || HelpCircle;
              
              return (
                <Card key={category}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold">{category}</h2>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {items.length} {items.length === 1 ? 'article' : 'articles'}
                      </span>
                    </div>
                    
                    <Accordion type="single" collapsible className="w-full">
                      {items.map((item, index) => (
                        <AccordionItem 
                          key={index} 
                          value={`${category}-${index}`}
                          className="border-b last:border-b-0"
                        >
                          <AccordionTrigger className="text-left hover:no-underline py-4">
                            <span className="font-medium">{item.question}</span>
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground pb-4">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Contact Support CTA */}
      <motion.div variants={itemVariants} className="mt-8">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Still need help?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Can't find what you're looking for? Our support team is here to help you.
            </p>
            <Button onClick={() => setContactModalOpen(true)} size="lg" className="rounded-xl">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact Support Modal */}
      <ContactSupportModal 
        open={contactModalOpen} 
        onOpenChange={setContactModalOpen} 
      />
    </motion.div>
  );
}
