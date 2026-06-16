"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { motion } from "framer-motion";
import Link from "next/link";
import { Hotel, Download, FileText } from "lucide-react";

export default function ReceiptPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["receipt", bookingId],
    queryFn: () => api.get(`/api/receipts/${bookingId}`).then((res) => res.data.data),
    enabled: !!bookingId,
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-void pt-24 pb-32">
        <div className="container-custom max-w-2xl">
          <div className="space-y-4">
            <div className="h-8 w-1/3 skeleton-shimmer mx-auto" />
            <div className="h-96 skeleton-shimmer" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-void pt-24 pb-32">
        <div className="container-custom max-w-2xl">
          <ErrorState title="Receipt Not Found" message="We couldn't find this receipt." />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-void pt-24 pb-32">
      <header className="fixed top-0 left-0 right-0 z-50 bg-void/80 backdrop-blur-sm border-b border-ghost">
        <div className="container-custom h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Hotel className="h-6 w-6 text-gold" strokeWidth={1.5} />
            <span className="text-sm font-bold tracking-[0.2em] uppercase text-white">
              Diamond Residence
            </span>
          </Link>
        </div>
      </header>

      <div className="container-custom max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <div className="w-12 h-12 bg-gold/10 border border-gold flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-gold" />
          </div>
          <h1 className="text-h1 text-white mb-2">Booking Receipt</h1>
          <p className="text-body">Thank you for choosing Diamond Residence.</p>
        </motion.div>

        <div className="bg-surface border border-ghost p-8 mb-8">
          <div className="border-b border-ghost pb-6 mb-6">
            <p className="text-label mb-1">Receipt Number</p>
            <p className="text-xl font-mono font-bold text-white">{data.receipt_number}</p>
          </div>

          <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
            <div>
              <p className="text-label mb-1">Booking Reference</p>
              <p className="text-white font-medium">{data.bookings?.booking_ref}</p>
            </div>
            <div>
              <p className="text-label mb-1">Guest</p>
              <p className="text-white font-medium">{data.bookings?.guests?.name}</p>
            </div>
            <div>
              <p className="text-label mb-1">Room</p>
              <p className="text-white font-medium">
                {data.bookings?.rooms?.room_number} ({data.bookings?.categories?.name})
              </p>
            </div>
            <div>
              <p className="text-label mb-1">Total Paid</p>
              <p className="text-gold font-bold text-lg">₦{parseInt(data.bookings?.total_amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-label mb-1">Check In</p>
              <p className="text-white font-medium">
                {new Date(data.bookings?.check_in_at).toLocaleString("en-NG", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <div>
              <p className="text-label mb-1">Check Out</p>
              <p className="text-white font-medium">
                {new Date(data.bookings?.check_out_at).toLocaleString("en-NG", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        </div>

        {data.pdf_url && (
          <div className="text-center">
            <a href={data.pdf_url} target="_blank" rel="noopener noreferrer">
              <Button className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF Receipt
              </Button>
            </a>
          </div>
        )}
      </div>
    </main>
  );
      }
