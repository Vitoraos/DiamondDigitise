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

export default function AdminStaffPage() {
  return (
    <RoleGate allowed={["owner"]}>
      <StaffManagementUI />
    </RoleGate>
  );
}

const ROLE_META: Record<string, { label: string; description: string; icon: React.ElementType; color: string }> = {
  owner:      { label: "Owner",      description: "Full access to all features", icon: Crown,       color: "text-gold-600 bg-gold-50 border-gold-200" },
  manager:    { label: "Manager",    description: "Manage rooms, bookings & reports", icon: ShieldCheck, color: "text-blue-700 bg-blue-50 border-blue-200" },
  front_desk: { label: "Front Desk", description: "Check-ins, bookings & receipts",  icon: Monitor,     color: "text-slate-700 bg-slate-50 border-slate-200" },
};

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role] ?? { label: role, icon: Users, color: "text-gray-600 bg-gray-50 border-gray-200" };
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", meta.color)}>
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
      // error is shown via toast in the hook
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

  // Stats
  const total      = staff?.length ?? 0;
  const active     = staff?.filter((s) => s.is_active).length ?? 0;
  const managers   = staff?.filter((s) => s.role === "manager" && s.is_active).length ?? 0;
  const frontDesks = staff?.filter((s) => s.role === "front_desk" && s.is_active).length ?? 0;

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight text-midnight-900">
            Staff Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Invite and manage your hotel team
          </p>
        </div>

        {/* Invite Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-midnight-900 hover:bg-midnight-800 text-white rounded-full px-5 py-2.5 shadow-soft hover:shadow-hover transition-all gap-2">
              <Plus className="w-4 h-4" />
              Invite Staff
            </Button>
          </DialogTrigger>

          <DialogContent className="rounded-3xl border-alabaster-200 max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-midnight-900 text-xl">
                Invite New Staff Member
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                They'll receive an email with login instructions.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-5 mt-3">
              {/* Full name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-midnight-700 uppercase tracking-wide">
                  Full Name
                </Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Chidi Okeke"
                  required
                  className="rounded-xl border-alabaster-200 bg-alabaster-50 focus:bg-white"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-midnight-700 uppercase tracking-wide">
                  Email Address
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@yourhotel.com"
                  required
                  className="rounded-xl border-alabaster-200 bg-alabaster-50 focus:bg-white"
                />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-midnight-700 uppercase tracking-wide">
                  Role
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="rounded-xl border-alabaster-200 bg-alabaster-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-alabaster-200">
                    <SelectItem value="manager">
                      <div className="flex flex-col py-0.5">
                        <span className="font-medium">Manager</span>
                        <span className="text-xs text-slate-400">Rooms, bookings & reports</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="front_desk">
                      <div className="flex flex-col py-0.5">
                        <span className="font-medium">Front Desk</span>
                        <span className="text-xs text-slate-400">Check-ins, bookings & receipts</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Role preview card */}
              {role && ROLE_META[role] && (
                <div className={cn("flex items-start gap-3 p-3.5 rounded-2xl border text-sm", ROLE_META[role].color)}>
                  {(() => { const Icon = ROLE_META[role].icon; return <Icon className="w-4 h-4 mt-0.5 shrink-0" />; })()}
                  <div>
                    <p className="font-semibold">{ROLE_META[role].label}</p>
                    <p className="text-xs mt-0.5 opacity-80">{ROLE_META[role].description}</p>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-full flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMut.isPending}
                  className="rounded-full flex-1 bg-gold-500 hover:bg-gold-600 text-midnight-900 font-semibold"
                >
                  {createMut.isPending ? "Sending..." : "Send Invite"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Stats row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Staff",  value: total,      icon: Users,       color: "text-midnight-900 bg-midnight-50" },
          { label: "Active",       value: active,     icon: ShieldCheck, color: "text-green-700 bg-green-50" },
          { label: "Managers",     value: managers,   icon: ShieldCheck, color: "text-blue-700 bg-blue-50" },
          { label: "Front Desk",   value: frontDesks, icon: Monitor,     color: "text-slate-700 bg-slate-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-alabaster-200 rounded-2xl p-4 shadow-soft">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-2", color)}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-midnight-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Staff table ─────────────────────────────────────── */}
      <div className="bg-white border border-alabaster-200 rounded-3xl shadow-soft overflow-hidden">
        {isLoading && (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-alabaster-100 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && (!staff || staff.length === 0) && (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-alabaster-100 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">No staff members yet.</p>
            <p className="text-slate-400 text-xs mt-1">Click "Invite Staff" to add your first team member.</p>
          </div>
        )}

        {staff && staff.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b border-alabaster-100">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-alabaster-100">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-alabaster-50 transition-colors group">
                    {/* Name + email icon */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-midnight-100 flex items-center justify-center shrink-0 text-midnight-700 font-bold text-xs uppercase">
                          {s.full_name?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium text-midnight-900">{s.full_name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {(s as any).email ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <RoleBadge role={s.role} />
                    </td>

                    {/* Active status */}
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                        s.is_active
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-red-100  text-red-700  border-red-200"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", s.is_active ? "bg-green-500" : "bg-red-400")} />
                        {s.is_active ? "Active" : "Deactivated"}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(s.created_at).toLocaleDateString("en-NG", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      {s.is_active && s.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeactivateConfirmId(s.id)}
                          disabled={deactivateMut.isPending && deactivateConfirmId === s.id}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
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

      {/* ── Deactivate confirmation dialog ──────────────────── */}
      <Dialog open={!!deactivateConfirmId} onOpenChange={(v) => !v && setDeactivateConfirmId(null)}>
        <DialogContent className="rounded-3xl border-alabaster-200 max-w-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <DialogHeader>
            <DialogTitle className="font-display text-midnight-900">Deactivate Staff Member?</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm mt-1">
              They will immediately lose access to the system. This action can be reversed from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeactivateConfirmId(null)}
              className="rounded-full flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deactivateConfirmId && handleDeactivate(deactivateConfirmId)}
              disabled={deactivateMut.isPending}
              className="rounded-full flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {deactivateMut.isPending ? "Deactivating..." : "Yes, Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
