export async function shareReceipt(pdfUrl: string): Promise<void> {
  try {
    const res = await fetch(pdfUrl, { credentials: "include" });
    const blob = await res.blob();
    const file = new File([blob], "receipt.pdf", { type: "application/pdf" });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "Diamond Residence Receipt" });
      return;
    }
  } catch {
    // fall through to opening the PDF directly
  }
  window.open(pdfUrl, "_blank");
}
