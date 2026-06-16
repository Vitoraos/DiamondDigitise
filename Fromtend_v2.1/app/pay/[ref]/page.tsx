"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Hotel, Copy, Check, ArrowRight } from "lucide-react";

export default function PaymentPage() {
  const params = useParams();
  const ref = params.ref as string;
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["payment", ref],
    queryFn: () => api.get(`/api/payments/poll/${ref}`).then((res) => res.data.data),
    refetchInterval: 5000,
    retry: false,
  });

  useEffect(() => {
    if (!data) return;
    if (data.status === "pending") {
      setPollCount((c) => c + 1);
    }
  }, [data]);

  useEffect(() => {
    if (data?.status === "confirmed" && data?.bookingId) {
      const timer = setTimeout(() => {
        router.push(`/receipt/${data.bookingId}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [data, router]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (isLoading && !data) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-12 h-12 mx-auto mb-4" />
          <p className="text-sm text-dim">Loading payment details...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-void pt-24 pb-32">
        <div className="container-custom max-w-lg">
          <ErrorState 
            message="Failed to load payment information. Please check your reference number."
            onRetry={() => refetch()}
          />
        </div>
      </main>
    );
  }

  const status = data.status;

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

      <div className="container-custom max-w-lg">
        <AnimatePresence mode="wait">
          {status === "pending" && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-10">
                <div className="w-16 h-16 border border-gold/30 border-t-gold animate-spin mx-auto mb-6" />
                <h1 className="text-h2 text-white mb-2">Awaiting Payment</h1>
                <p className="text-body">
                  Please complete your bank transfer using the details below. 
                  This page updates automatically.
                </p>
              </div>

              {data.paymentDetails && (
                <div className="bg-surface border border-gold/30 p-6 mb-8">
                  <p className="text-label mb-6">Transfer Details</p>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs text-dim uppercase tracking-wider mb-2">Amount</p>
                      <p className="text-3xl font-bold text-gold">
                        ₦{Number(data.paymentDetails.amount).toLocaleString()}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-ghost">
                      <p className="text-xs text-dim uppercase tracking-wider mb-2">Account Number</p>
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-2xl font-mono font-bold text-white tracking-wider">
                          {data.paymentDetails.accountNumber}
                        </p>
                        <button
                          onClick={() => handleCopy(data.paymentDetails.accountNumber, "account")}
                          className="shrink-0 p-2 border border-ghost hover:border-gold text-dim hover:text-gold transition-colors"
                          title="Copy account number"
                        >
                          {copiedField === "account" ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-ghost">
                      <p className="text-xs text-dim uppercase tracking-wider mb-2">Bank Name</p>
                      <p className="text-white font-medium">{data.paymentDetails.bankName}</p>
                    </div>

                    <div className="pt-4 border-t border-ghost">
                      <p className="text-xs text-dim uppercase tracking-wider mb-2">Account Name</p>
                      <p className="text-white font-medium">{data.paymentDetails.accountName}</p>
                    </div>

                    <div className="pt-4 border-t border-gold/30 bg-gold-dim p-4">
                      <p className="text-xs text-gold uppercase tracking-wider mb-2">Transfer Description / Narration</p>
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-lg font-mono font-bold text-gold tracking-wide">
                          {data.paymentDetails.paymentRef}
                        </p>
                        <button
                          onClick={() => handleCopy(data.paymentDetails.paymentRef, "ref")}
                          className="shrink-0 p-2 border border-gold/30 hover:border-gold text-gold hover:text-white transition-colors"
                          title="Copy payment reference"
                        >
                          {copiedField === "ref" ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-dim mt-3">
                        Include this reference exactly in your transfer narration for instant verification.
                      </p>
                    </div>
                  </div>

                  {copiedField && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-success text-center mt-4"
                    >
                      ✓ Copied to clipboard
                    </motion.p>
                  )}
                </div>
              )}

              <div className="text-center">
                <p className="text-xs text-dim animate-pulse">
                  Checking payment status... {pollCount > 12 && "(Taking longer than usual)"}
                </p>
                {pollCount > 12 && (
                  <p className="text-xs text-dim mt-2">
                    If you have completed payment, please wait. You will receive an SMS confirmation.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {status === "confirmed" && (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-success/10 border border-success flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-h2 text-white mb-4">Payment Confirmed</h1>
              <p className="text-body mb-8">
                Your booking is now active. You will be redirected to your receipt shortly.
              </p>
              {data.bookingId && (
                <Link href={`/receipt/${data.bookingId}`}>
                  <Button className="gap-2">
                    View Receipt <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </motion.div>
          )}

          {status === "incomplete_payment" && (
            <motion.div
              key="incomplete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-error/10 border border-error flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-error font-bold">!</span>
              </div>
              <h1 className="text-h2 text-white mb-4">Incomplete Payment</h1>
              <p className="text-body mb-2">
                The amount received was less than the total required.
              </p>
              <p className="text-sm text-dim mb-8">
                A refund has been initiated minus a ₦50 processing charge. 
                Please create a new booking with the correct amount.
              </p>
              <Link href="/rooms">
                <Button variant="outline">Return to Rooms</Button>
              </Link>
            </motion.div>
          )}

          {status === "cancelled" && (
            <motion.div
              key="cancelled"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-h2 text-white mb-4">Booking Cancelled</h1>
              <p className="text-body mb-8">
                This booking has been cancelled or expired.
              </p>
              <Link href="/rooms">
                <Button variant="outline">Return to Rooms</Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
              }
