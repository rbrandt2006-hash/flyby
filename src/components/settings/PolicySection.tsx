import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useTravelPolicy } from "@/hooks/useTravelPolicy";
import { useUserRole } from "@/hooks/useUserRole";
import { FLIGHT_CLASS_LABEL, type TravelPolicy } from "@/services/policyEvaluator";

const FLIGHT_CLASSES: TravelPolicy["max_flight_class"][] = ["economy", "premium_economy", "business", "first"];

export function PolicySection() {
  const { policy, loading, saving, save } = useTravelPolicy();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const readonly = !roleLoading && !isAdmin;

  const [hotel, setHotel] = useState<string>("");
  const [flightPrice, setFlightPrice] = useState<string>("");
  const [flightClass, setFlightClass] = useState<string>("none");
  const [approval, setApproval] = useState<string>("");

  useEffect(() => {
    setHotel(policy.max_nightly_hotel_rate?.toString() ?? "");
    setFlightPrice(policy.max_flight_price?.toString() ?? "");
    setFlightClass(policy.max_flight_class ?? "none");
    setApproval(policy.approval_required_above?.toString() ?? "");
  }, [policy]);

  const handleSave = async () => {
    const parseNum = (v: string) => (v.trim() === "" ? null : Number(v));
    const { error } = await save({
      max_nightly_hotel_rate: parseNum(hotel),
      max_flight_price: parseNum(flightPrice),
      max_flight_class: flightClass === "none" ? null : (flightClass as TravelPolicy["max_flight_class"]),
      approval_required_above: parseNum(approval),
    });
    if (error) toast.error(error.message || "Failed to save policy");
    else toast.success("Travel policy saved");
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <Shield className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              Travel Policy
              {readonly && <Badge variant="outline" className="text-xs">View only</Badge>}
            </CardTitle>
            <CardDescription className="mt-0.5">
              Rules used to evaluate every trip's compliance badge.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading policy…
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="policy-hotel">Max nightly hotel rate (USD)</Label>
                <Input
                  id="policy-hotel"
                  type="number"
                  min={0}
                  placeholder="e.g. 350"
                  value={hotel}
                  onChange={(e) => setHotel(e.target.value)}
                  disabled={readonly}
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">Trips with hotels above this rate are flagged Over budget.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="policy-flight">Max flight price (USD)</Label>
                <Input
                  id="policy-flight"
                  type="number"
                  min={0}
                  placeholder="e.g. 800"
                  value={flightPrice}
                  onChange={(e) => setFlightPrice(e.target.value)}
                  disabled={readonly}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Max flight cabin class</Label>
                <Select value={flightClass} onValueChange={setFlightClass} disabled={readonly}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Any class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No restriction</SelectItem>
                    {FLIGHT_CLASSES.map((c) => (
                      <SelectItem key={c!} value={c!}>{FLIGHT_CLASS_LABEL[c!]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="policy-approval">Require pre-trip approval above (USD)</Label>
                <Input
                  id="policy-approval"
                  type="number"
                  min={0}
                  placeholder="e.g. 2500"
                  value={approval}
                  onChange={(e) => setApproval(e.target.value)}
                  disabled={readonly}
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">Trips above this estimated total are flagged Needs approval.</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4" />
                Leave a field blank to disable that rule.
              </div>
              {!readonly && (
                <Button onClick={handleSave} disabled={saving} className="rounded-xl">
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save policy"}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
