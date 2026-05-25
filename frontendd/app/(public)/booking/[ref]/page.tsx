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
    queryFn: () => api.get(`/api/payments/poll/${ref}`).then((res) => res.data.data),
    refetchInterval: 5000,
  });

  if (isLoading) return <div className="max-w-lg mx-auto px-4 py-16 text-center"><p className="text-navy-700 animate-pulse">Checking payment status...</p></div>;
  if (error || !data) return <div className="max-w-lg mx-auto px-4 py-16 text-center"><p className="text-red-600">Failed to load payment information.</p></div>;

  const status = data.status;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {status === "pending" && (
        <>
          <h1 className="text-2xl font-serif font-bold text-navy-800 mb-4">Awaiting Payment</h1>
          
          {/* ✅ FIX: Render Bank Details */}
          {data.paymentDetails && (
            <div className="bg-white border-2 border-gold-300 p-6 rounded-xl my-6 text-left shadow-soft">
              <p className="text-sm font-semibold text-navy-600 uppercase mb-1">Transfer to</p>
              <p className="text-3xl font-mono font-bold text-navy-900">{data.paymentDetails.accountNumber}</p>
              <p className="text-navy-700">{data.paymentDetails.bankName}</p>
              <p className="text-navy-700">{data.paymentDetails.accountName}</p>
              <p className="mt-2 font-semibold">₦{Number(data.paymentDetails.amount).toLocaleString()}</p>
            </div>
          )}

          <p className="text-navy-600 mb-6">
            Please make a transfer to the bank details provided above. This page will update automatically once your payment is received.
          </p>
          <p className="text-sm text-beige-600 animate-pulse">Checking every 5 seconds...</p>
        </>
      )}

      {status === "confirmed" && (
        <>
          <h1 className="text-2xl font-serif font-bold text-green-800 mb-4">Payment Confirmed!</h1>
          <p className="text-navy-600 mb-6">Your booking is now active. You can view your receipt below.</p>
          <Link href={`/receipt/${data.bookingId}`}><Button className="bg-gold-500 hover:bg-gold-600 text-navy-900">View Receipt</Button></Link>
        </>
      )}

      {status === "incomplete_payment" && (
        <>
          <h1 className="text-2xl font-serif font-bold text-red-800 mb-4">Incomplete Payment</h1>
          <p className="text-navy-600 mb-6">The amount you paid was less than the total required. A refund has been initiated.</p>
        </>
      )}

      {status === "cancelled" && (
        <>
          <h1 className="text-2xl font-serif font-bold text-gray-800 mb-4">Booking Cancelled</h1>
          <p className="text-navy-600 mb-6">This booking has been cancelled.</p>
        </>
      )}
    </div>
  );
}
