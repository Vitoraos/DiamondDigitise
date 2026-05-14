"use client";

import { RoleGate } from "@/components/shared/RoleGate";

export default function AdminNotificationsPage() {
  return (
    <RoleGate allowed={["owner"]}>
      <div>
        <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6">
          Notifications
        </h1>
        <p className="text-navy-600">Notification controls will appear here.</p>
      </div>
    </RoleGate>
  );
}