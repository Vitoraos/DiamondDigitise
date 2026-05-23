"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function PaymentPage() {
  const params = useParams();
  const ref = params.ref as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["payment", ref],
    queryFn: () =>
      api.get(`/api/payments/poll/${ref}`).then((res) => res.data.data),
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {status === "pending" && (
        <>
          <h1 className="text-2xl font-serif font-bold text-navy-800 mb-4">
            Awaiting Payment
          </h1>

          {/* ✅ Displays the bank account details gracefully fetched from the pending status */}
          {data.paymentDetails && (
            <div className="bg-white p-6 rounded-lg shadow-md border border-beige-200 mb-6 text-left">
              <h2 className="font-semibold text-lg text-navy-800 mb-4 border-b pb-2">Bank Transfer Details</h2>
              <div className="space-y-3 text-navy-700 text-sm">
                <p className="flex justify-between">
                  <span className="font-medium text-navy-600">Amount to Pay:</span> 
                  <span className="font-bold">₦{data.paymentDetails.amount.toLocaleString()}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium text-navy-600">Bank Name:</span> 
                  <span>{data.paymentDetails.bankName}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium text-navy-600">Account Number:</span> 
                  <span className="font-mono font-bold text-lg tracking-wider bg-beige-50 px-2 py-0.5 rounded">{data.paymentDetails.accountNumber}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium text-navy-600">Account Name:</span> 
                  <span>{data.paymentDetails.accountName}</span>
                </p>
              </div>
              <div className="mt-4 p-3 bg-gold-50 text-gold-900 text-xs rounded-md border border-gold-200">
                Please include your booking reference <strong className="font-mono">{ref}</strong> in the transfer narrative to help us verify.
              </div>
            </div>
          )}

          <p className="text-navy-600 mb-6">
            Please make a transfer to the bank details provided.
            This page will update automatically once your payment is received.
          </p>
          <p className="text-sm text-beige-600 animate-pulse">
            Checking every 5 seconds...
          </p>
        </>
      )}
