"use client";
import { useState } from "react";
import { RoleGate } from "@/components/role/RoleGate";
import { useStaff } from "@/hooks/queries/useStaff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus, UserX, Users, ShieldCheck, Monitor, Crown,
  Mail, Calendar, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdminStaffPage() {
  return (
    <RoleGate allowed={["owner"]}>
      <StaffManagementUI />
    </RoleGate>
  );
}

const ROLE_META: Record<string, { label: string; description: string; icon: React.ElementType; color: string }> = {
  owner:      { label: "Owner",      description: "Full access to all features", icon: Crown,       color: "text-gold bg-gold/10 border-gold/30" },
  manager:    { label: "Manager",    description: "Manage rooms, bookings & reports", icon: ShieldCheck, color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  front_desk: { label: "Front Desk", description: "Check-ins, bookings & receipts",  icon: Monitor,     color: "text-dim bg-white/5 border-ghost" },
};

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role] ?? { label: role, icon: Users, color: "text-dim bg-white/5 border-ghost" };
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border", meta.color)}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

function StaffManagementUI() {
  const { staff, isLoading, createMut, deactivateMut } = useStaff();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deactivateConfirmId, setDeactivateConfirmId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [role, setRole]         = useState("front_desk");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMut.mutateAsync({ fullName, email, role });
      setFullName(""); setEmail(""); setRole("front_desk");
      setIsDialogOpen(false);
    } catch {
      // error shown via toast
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateMut.mutateAsync(id);
      setDeactivateConfirmId(null);
    } catch {
      // error shown via toast
    }
  };

  const total      = staff?.length ?? 0;
  const active     = staff?.filter((s) => s.is_active).length ?? 0;
  const managers   = staff?.filter((s) => s.role === "manager" && s.is_active).length ?? 0;
  const frontDesks = staff?.filter((s) => s.role === "front_desk" && s.is_active).length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h2 text-white mb-1">Staff Management</h1>
          <p className="text-body text-sm">Invite and manage your hotel team</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Invite Staff
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-white">Invite New Staff Member</DialogTitle>
              <DialogDescription className="text-dim text-sm">
                They will receive an email with login instructions.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-5 mt-3">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Chidi Okeke"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@diamondresidence.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="front_desk">Front Desk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role && ROLE_META[role] && (
                <div className={cn("flex items-start gap-3 p-3.5 border text-sm", ROLE_META[role].color)}>
                  {(() => { const Icon = ROLE_META[role].icon; return <Icon className="w-4 h-4 mt-0.5 shrink-0" />; })()}
                  <div>
                    <p className="font-semibold">{ROLE_META[role].label}</p>
                    <p className="text-xs mt-0.5 opacity-80">{ROLE_META[role].description}</p>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMut.isPending}>
                  {createMut.isPending ? "Sending..." : "Send Invite"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Staff",  value: total,      icon: Users,       color: "text-white bg-white/5" },
          { label: "Active",       value: active,     icon: ShieldCheck, color: "text-success bg-success/10" },
          { label: "Managers",     value: managers,   icon: ShieldCheck, color: "text-blue-400 bg-blue-400/10" },
          { label: "Front Desk",   value: frontDesks, icon: Monitor,     color: "text-dim bg-white/5" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface border border-ghost p-4">
            <div className={cn("w-8 h-8 flex items-center justify-center mb-2", color)}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-dim mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-ghost overflow-hidden">
        {isLoading && (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 skeleton-shimmer" />
            ))}
          </div>
        )}

        {!isLoading && (!staff || staff.length === 0) && (
          <div className="p-12 text-center">
            <EmptyState title="No staff members yet" description='Click "Invite Staff" to add your first team member.' />
          </div>
        )}

        {staff && staff.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left text-xs text-dim uppercase tracking-wider border-b border-ghost">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ghost">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/5 flex items-center justify-center shrink-0 text-white font-bold text-xs uppercase">
                          {s.full_name?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium text-white">{s.full_name}</p>
                          <p className="text-xs text-dim flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {(s as any).email ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <RoleBadge role={s.role} />
                    </td>

                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border",
                        s.is_active
                          ? "text-success border-success bg-success/10"
                          : "text-error border-error bg-error/10"
                      )}>
                        <span className={cn("w-1.5 h-1.5", s.is_active ? "bg-success" : "bg-error")} />
                        {s.is_active ? "Active" : "Deactivated"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-dim">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(s.created_at).toLocaleDateString("en-NG", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {s.is_active && s.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeactivateConfirmId(s.id)}
                          disabled={deactivateMut.isPending && deactivateConfirmId === s.id}
                          className="text-error hover:text-error hover:bg-error/10 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Deactivate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!deactivateConfirmId} onOpenChange={(v) => !v && setDeactivateConfirmId(null)}>
        <DialogContent className="max-w-sm text-center">
          <div className="w-12 h-12 bg-error/10 border border-error flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-6 h-6 text-error" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-white">Deactivate Staff Member?</DialogTitle>
            <DialogDescription className="text-dim text-sm mt-1">
              They will immediately lose access to the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeactivateConfirmId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => deactivateConfirmId && handleDeactivate(deactivateConfirmId)}
              disabled={deactivateMut.isPending}
              variant="destructive"
            >
              {deactivateMut.isPending ? "Deactivating..." : "Yes, Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
                }
