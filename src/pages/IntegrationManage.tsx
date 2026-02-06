import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  RefreshCw,
  Settings2,
  Shield,
  Database,
  HelpCircle,
  Check,
  X,
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink,
  Calendar,
  Mail,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

// Integration configs
const integrationConfigs: Record<string, {
  name: string;
  Icon: LucideIcon;
  color: string;
  type: "calendar" | "messaging";
  permissions: string[];
}> = {
  "google-calendar": {
    name: "Google Calendar",
    Icon: Calendar,
    color: "bg-destructive/10",
    type: "calendar",
    permissions: ["Read calendar events", "Create calendar events", "Modify calendar events", "Read event attendees"],
  },
  "outlook": {
    name: "Outlook",
    Icon: Mail,
    color: "bg-primary/10",
    type: "calendar",
    permissions: ["Read calendar events", "Create calendar events", "Read emails", "Send emails"],
  },
  "slack": {
    name: "Slack",
    Icon: MessageSquare,
    color: "bg-purple-500/10",
    type: "messaging",
    permissions: ["Read channels", "Read messages", "Send messages", "Access workspace info"],
  },
  "teams": {
    name: "Microsoft Teams",
    Icon: Users,
    color: "bg-violet-500/10",
    type: "messaging",
    permissions: ["Read channels", "Read messages", "Send messages", "Access team info"],
  },
};

export default function IntegrationManage() {
  const { provider } = useParams<{ provider: string }>();
  const navigate = useNavigate();
  const config = provider ? integrationConfigs[provider] : null;
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [showDeleteDataDialog, setShowDeleteDataDialog] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  
  // Sync settings state
  const [syncSettings, setSyncSettings] = useState({
    syncTrips: true,
    syncUpdates: true,
    readEvents: true,
    syncMessages: true,
    allowReply: true,
    threadedReplies: false,
    selectedCalendars: "primary",
    selectedChannels: "all",
  });

  if (!config) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Integration not found</h1>
        <p className="text-muted-foreground mb-4">The integration you're looking for doesn't exist.</p>
        <Button onClick={() => navigate("/settings#integrations")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Button>
      </div>
    );
  }

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSyncing(false);
    toast.success("Sync complete");
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsDisconnecting(false);
    setShowDisconnectDialog(false);
    toast.success(`Disconnected from ${config.name}`);
    navigate("/settings#integrations");
  };

  const handleDeleteData = async () => {
    setIsDeletingData(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsDeletingData(false);
    setShowDeleteDataDialog(false);
    toast.success("Synced data deleted");
  };

  const handleReauthorize = () => {
    toast.info("Redirecting to authorization...");
  };

  const handleSaveSettings = () => {
    toast.success("Settings saved");
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-4xl mx-auto pb-20 md:pb-0"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <button
          onClick={() => navigate("/settings#integrations")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </button>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", config.color)}>
              <config.Icon className="w-7 h-7 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{config.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                  <Check className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
                <span className="text-sm text-muted-foreground">john@acme.com</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sync now
            </Button>
            <Button 
              variant="outline" 
              className="text-destructive hover:text-destructive"
              onClick={() => setShowDisconnectDialog(true)}
            >
              Disconnect
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mt-4">
          Last synced: 2 minutes ago • Connection healthy
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="sync" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sync" className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Sync Settings
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Data & Privacy
            </TabsTrigger>
            <TabsTrigger value="troubleshoot" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Troubleshooting
            </TabsTrigger>
          </TabsList>

          {/* Sync Settings Tab */}
          <TabsContent value="sync">
            <Card>
              <CardHeader>
                <CardTitle>Sync Settings</CardTitle>
                <CardDescription>
                  Configure how Flyby syncs with {config.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {config.type === "calendar" ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Sync trips to calendar</Label>
                        <p className="text-sm text-muted-foreground">Add confirmed trips as calendar events</p>
                      </div>
                      <Switch 
                        checked={syncSettings.syncTrips}
                        onCheckedChange={(checked) => setSyncSettings(s => ({ ...s, syncTrips: checked }))}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Sync updates & cancellations</Label>
                        <p className="text-sm text-muted-foreground">Keep calendar events up to date with trip changes</p>
                      </div>
                      <Switch 
                        checked={syncSettings.syncUpdates}
                        onCheckedChange={(checked) => setSyncSettings(s => ({ ...s, syncUpdates: checked }))}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Read events to detect travel</Label>
                        <p className="text-sm text-muted-foreground">Scan calendar for meetings that may require travel</p>
                      </div>
                      <Switch 
                        checked={syncSettings.readEvents}
                        onCheckedChange={(checked) => setSyncSettings(s => ({ ...s, readEvents: checked }))}
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-base">Calendars to sync</Label>
                      <Select 
                        value={syncSettings.selectedCalendars}
                        onValueChange={(value) => setSyncSettings(s => ({ ...s, selectedCalendars: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary calendar only</SelectItem>
                          <SelectItem value="all">All calendars</SelectItem>
                          <SelectItem value="select">Select calendars...</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Sync messages into Flyby</Label>
                        <p className="text-sm text-muted-foreground">Import messages from {config.name} channels</p>
                      </div>
                      <Switch 
                        checked={syncSettings.syncMessages}
                        onCheckedChange={(checked) => setSyncSettings(s => ({ ...s, syncMessages: checked }))}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Allow replying from Flyby</Label>
                        <p className="text-sm text-muted-foreground">Send messages to {config.name} from within Flyby</p>
                      </div>
                      <Switch 
                        checked={syncSettings.allowReply}
                        onCheckedChange={(checked) => setSyncSettings(s => ({ ...s, allowReply: checked }))}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Threaded replies</Label>
                        <p className="text-sm text-muted-foreground">Keep replies in the same thread as the original message</p>
                      </div>
                      <Switch 
                        checked={syncSettings.threadedReplies}
                        onCheckedChange={(checked) => setSyncSettings(s => ({ ...s, threadedReplies: checked }))}
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-base">Channels to sync</Label>
                      <Select 
                        value={syncSettings.selectedChannels}
                        onValueChange={(value) => setSyncSettings(s => ({ ...s, selectedChannels: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All channels</SelectItem>
                          <SelectItem value="select">Select channels...</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                
                <div className="pt-4">
                  <Button onClick={handleSaveSettings}>Save settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>
                  Permissions granted to Flyby for {config.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.permissions.map((permission, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
                    <Check className="w-5 h-5 text-success shrink-0" />
                    <span className="text-sm font-medium">{permission}</span>
                  </div>
                ))}
                
                <Separator className="my-6" />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Re-authorize</p>
                    <p className="text-sm text-muted-foreground">
                      Update permissions or refresh connection
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleReauthorize}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Re-authorize
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data & Privacy Tab */}
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
                <CardDescription>
                  Manage data synced from {config.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">What Flyby stores</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {config.type === "calendar" ? (
                      <>
                        <p>• Calendar event titles and dates</p>
                        <p>• Event locations and attendees</p>
                        <p>• Event descriptions (for travel detection)</p>
                        <p>• Calendar metadata (name, timezone)</p>
                      </>
                    ) : (
                      <>
                        <p>• Channel names and metadata</p>
                        <p>• Message content and timestamps</p>
                        <p>• Sender information</p>
                        <p>• Thread structure</p>
                      </>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="p-4 border border-destructive/20 rounded-xl bg-destructive/5">
                  <div className="flex items-start gap-3">
                    <Trash2 className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Delete synced data</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Remove all cached {config.type === "calendar" ? "events" : "messages"} from Flyby without disconnecting {config.name}.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setShowDeleteDataDialog(true)}
                      >
                        Delete synced data
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Troubleshooting Tab */}
          <TabsContent value="troubleshoot">
            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting</CardTitle>
                <CardDescription>
                  Diagnose and fix connection issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-success/10 border border-success/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success" />
                    <div>
                      <p className="font-medium text-success">Connection healthy</p>
                      <p className="text-sm text-muted-foreground">Last successful sync: 2 minutes ago</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-between" onClick={handleSync}>
                    <span>Force sync now</span>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-between" onClick={handleReauthorize}>
                    <span>Reconnect</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-between">
                    <span>Report an issue</span>
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">Connection log</h4>
                  <div className="space-y-2 text-sm font-mono bg-muted/50 p-4 rounded-xl">
                    <p className="text-success">✓ 10:45 AM — Sync complete (12 events)</p>
                    <p className="text-success">✓ 10:43 AM — Auth token refreshed</p>
                    <p className="text-muted-foreground">• 10:30 AM — Sync started</p>
                    <p className="text-success">✓ 9:15 AM — Sync complete (8 events)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Disconnect Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {config.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke Flyby's access to {config.name}. Synced data will be removed unless you choose to keep it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Data Dialog */}
      <AlertDialog open={showDeleteDataDialog} onOpenChange={setShowDeleteDataDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete synced data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove all {config.type === "calendar" ? "events" : "messages"} synced from {config.name}. Your {config.name} connection will remain active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingData}
            >
              {isDeletingData ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete data"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}