import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { backend } from "@/integrations/backend/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Building2, Check, Plus, Loader2 } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  domain: string;
  memberCount?: number;
  isActive: boolean;
}

interface SwitchWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SwitchWorkspaceModal({ open, onOpenChange }: SwitchWorkspaceModalProps) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorkspaces() {
      if (!user?.id || !open) return;
      
      setIsLoading(true);
      
      try {
        // Fetch user's profile to get current company
        const { data: profile } = await backend
          .from("profiles")
          .select("company_id")
          .eq("user_id", user.id)
          .single();

        if (profile?.company_id) {
          setCurrentWorkspaceId(profile.company_id);
        }

        // Fetch the user's company
        const { data: companies } = await backend
          .from("companies")
          .select("id, name, domain");

        if (companies && companies.length > 0) {
          const formattedWorkspaces: Workspace[] = companies.map((company) => ({
            id: company.id,
            name: company.name,
            domain: company.domain,
            memberCount: Math.floor(Math.random() * 50) + 5, // Simulated
            isActive: company.id === profile?.company_id,
          }));
          setWorkspaces(formattedWorkspaces);
        } else {
          // Fallback to simulated workspaces for demo
          const emailDomain = user.email?.split("@")[1] || "company.com";
          const companyName = emailDomain.split(".")[0];
          
          setWorkspaces([
            {
              id: "current",
              name: companyName.charAt(0).toUpperCase() + companyName.slice(1),
              domain: emailDomain,
              memberCount: 24,
              isActive: true,
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching workspaces:", error);
        // Show fallback workspace
        const emailDomain = user.email?.split("@")[1] || "company.com";
        const companyName = emailDomain.split(".")[0];
        
        setWorkspaces([
          {
            id: "current",
            name: companyName.charAt(0).toUpperCase() + companyName.slice(1),
            domain: emailDomain,
            memberCount: 24,
            isActive: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkspaces();
  }, [user, open]);

  const handleSwitchWorkspace = async (workspace: Workspace) => {
    if (workspace.isActive) {
      toast.info("You're already in this workspace");
      return;
    }

    setIsSwitching(workspace.id);

    try {
      // Simulate workspace switch - in production this would update the user's active workspace
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update local state
      setWorkspaces((prev) =>
        prev.map((ws) => ({
          ...ws,
          isActive: ws.id === workspace.id,
        }))
      );

      toast.success(`Switched to ${workspace.name}`, {
        description: "Your data will refresh momentarily.",
      });

      onOpenChange(false);

      // Reload the page to refresh context-specific data
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error("Failed to switch workspace", {
        description: "Please try again.",
      });
    } finally {
      setIsSwitching(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Switch Workspace
          </DialogTitle>
          <DialogDescription>
            Select a workspace to switch to. Your data will refresh after switching.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </>
          ) : (
            <AnimatePresence mode="popLayout">
              {workspaces.map((workspace, index) => (
                <motion.button
                  key={workspace.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSwitchWorkspace(workspace)}
                  disabled={isSwitching !== null}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                    workspace.isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  } ${isSwitching !== null ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{workspace.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {workspace.domain} • {workspace.memberCount} members
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSwitching === workspace.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : workspace.isActive ? (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                        <Check className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : null}
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <Button variant="outline" className="w-full rounded-xl" disabled>
            <Plus className="w-4 h-4 mr-2" />
            Create New Workspace
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Contact your administrator to create new workspaces
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
