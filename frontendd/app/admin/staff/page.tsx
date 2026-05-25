"use client";
import { useState } from "react";
import { RoleGate } from "@/components/role/RoleGate";
import { useStaff } from "@/hooks/queries/useStaff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminStaffPage() {
  return (
    <RoleGate allowed={["owner"]}>
      <StaffManagementUI />
    </RoleGate>
  );
}

function StaffManagementUI() {
  const { staff, isLoading, createMut, deactivateMut } = useStaff();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("front_desk");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMut.mutateAsync({ fullName, email, role });
    setFullName(""); setEmail(""); setRole("front_desk");
    setIsDialogOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-medium tracking-tight text-midnight-900">Staff Management</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-midnight-900 hover:bg-midnight-800 text-white rounded-full px-6 py-2.5 shadow-soft hover:shadow-hover transition-all">
              <Plus className="w-4 h-4 mr-2" /> Invite Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl border-alabaster-200">
            <DialogHeader>
              <DialogTitle className="font-display text-midnight-900">Invite New Staff Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="rounded-full border-alabaster-200 bg-surface" />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-full border-alabaster-200 bg-surface" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="rounded-full border-alabaster-200 bg-surface"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-alabaster-200">
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="front_desk">Front Desk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="gap-2 sm:gap-0 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-full">Cancel</Button>
                <Button type="submit" disabled={createMut.isPending} className="rounded-full bg-gold-500 hover:bg-gold-600 text-midnight-900">
                  {createMut.isPending ? "Sending Invite..." : "Send Invite"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden bg-surface rounded-3xl border border-alabaster-200 shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-midnight-900/5 to-transparent">
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Joined</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-alabaster-200">
            {isLoading && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading staff...</td></tr>}
            {staff?.length === 0 && !isLoading && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No staff members found.</td></tr>}
            {staff?.map((s) => (
              <tr key={s.id} className="hover:bg-alabaster-50 transition-colors">
                <td className="p-4 text-midnight-900 font-medium">{s.full_name}</td>
                <td className="p-4 text-slate-600 capitalize">{s.role.replace('_', ' ')}</td>
                <td className="p-4">
                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium", s.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                    {s.is_active ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="p-4 text-xs text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td>
                <td className="p-4 text-right">
                  {s.is_active && s.role !== 'owner' && (
                    <Button variant="ghost" size="sm" onClick={() => deactivateMut.mutate(s.id)} disabled={deactivateMut.isPending} className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full">
                      <UserX className="w-4 h-4 mr-1" /> Deactivate
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
