"use client";

import { RoleGate } from "@/components/role/RoleGate";

export default function AdminStaffPage() {
  return (
    <RoleGate allowed={["owner"]}>
      <div>
        <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6">
          Staff Management
        </h1>
        <p className="text-navy-600">Staff list will appear here.</p>
      </div>
    </RoleGate>
  );
}