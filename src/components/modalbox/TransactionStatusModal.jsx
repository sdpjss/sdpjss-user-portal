import { useRef } from "react"; // *** UPDATED: Added useRef ***
import {
  CheckCircle,
  XCircle,
  Download,
  Printer, // *** NEW: Added Printer Icon ***
} from "lucide-react";
import html2pdf from "html2pdf.js"; // *** NEW: Added html2pdf for PDF generation ***
import DonationReceiptTemplate from "../DonationReceiptTemplate";
import { printElement } from "../../utils/printElement";

const TransactionStatusModal = ({
  isOpen,
  onClose,
  status,
  message,
  receiptData,
}) => {
  const receiptRef = useRef(null); // *** NEW: Ref for the receipt container ***

  if (!isOpen) return null;

  const isSuccess = status === "success";

  // *** NEW: Function to handle PDF download using html2pdf ***
  const handleDownloadPdf = () => {
    if (receiptRef.current) {
      const opt = {
        margin: 0.5,
        filename: `Receipt-${receiptData.donation.receiptId}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };
      html2pdf().from(receiptRef.current).set(opt).save();
    }
  };

  // *** UPDATED: Renamed function to handle printing via browser dialog ***
  const handlePrintReceipt = () => {
    if (receiptRef.current) {
      printElement({
        element: receiptRef.current,
        title: `Print Receipt - ${receiptData.donation.receiptId}`,
        printStyles: `
          body { margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white; }
          @media print {
            body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
            .bill-container { box-shadow: none !important; border: none !important; }
          }
        `,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md text-center p-8 transform transition-all scale-100">
        {isSuccess ? (
          <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
        ) : (
          <XCircle className="mx-auto h-20 w-20 text-red-500" />
        )}

        <h2
          className={`text-2xl font-bold mt-6 ${
            isSuccess ? "text-gray-800" : "text-red-600"
          }`}
        >
          {isSuccess ? "Donation Successful!" : "Payment Failed"}
        </h2>

        <p className="text-gray-600 mt-2">{message}</p>

        {isSuccess && receiptData && (
          <div className="bg-gray-50 border rounded-lg p-4 mt-6 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction ID:</span>
              <span className="font-mono text-gray-700">
                {receiptData.donation.transactionId}
              </span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-gray-500">Amount Paid:</span>
              <span className="font-bold text-gray-800">
                ₹{receiptData.donation.amount.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              A detailed receipt can be printed or downloaded below.
            </p>
          </div>
        )}

        {/* *** UPDATED: Button container with two new buttons *** */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isSuccess && receiptData ? (
            <>
              <button
                onClick={handlePrintReceipt}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold"
              >
                <Printer size={18} />
                Print Receipt
              </button>
              <button
                onClick={handleDownloadPdf}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                <Download size={18} />
                Download PDF
              </button>
              <button
                onClick={onClose}
                className="sm:col-span-2 w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
              >
                Close
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="sm:col-span-2 w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* *** UPDATED: Hidden receipt template for printing and downloading *** */}
      {isSuccess && receiptData && (
        <div style={{ position: "absolute", left: "-9999px" }}>
          <div ref={receiptRef}>
            <DonationReceiptTemplate receiptData={receiptData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionStatusModal;
