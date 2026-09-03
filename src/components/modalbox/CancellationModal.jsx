
const CancellationModal = ({ isOpen, onClose }) => {
  // If the modal is not open, don't render anything
  if (!isOpen) {
    return null;
  }

  return (
    // Main modal container with a semi-transparent background
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Close modal when clicking on the background
    >
      {/* Modal content box */}
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Cancellation & Refund Policy
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Modal Body with scrollable content */}
        <div className="p-6 overflow-y-auto text-gray-700 space-y-4">
          <p>
            Shree Durgaji Patway Jati Sudhar Samiti has instituted this donation
            refund policy to ensure fair, and transparent processing of refund
            requests due to errors, duplicate donations, or any technical
            reasons regarding the transfer. Donors are encouraged to verify
            their donation details before proceeding and exercise due care and
            diligence while making donations. Refunds will be considered on a
            case-by-case basis and processed within 15 business days upon
            approval.
          </p>

          <p>
            Shree Durgaji Patway Jati Sudhar Samiti will review all refund
            requests and may request additional information or documents from
            the donor and donor must co-operate in this regard.
          </p>

          <h3 className="font-semibold text-lg">
            Refunds will not be provided if:
          </h3>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>The donation has been allocated to a specific campaign</li>
            <li>A tax exemption certificate has been issued and utilized</li>
          </ul>
          <p>
            In case a tax exemption certificate has been issued but not used,
            donors must return the certificate or submit a declaration of loss
            before a refund can be processed.
          </p>

          <h3 className="font-semibold text-lg">
            Refund Request Process and Time Limit
          </h3>
          <p>
            Refund requests must be made in writing or via email within 15 days
            from the date of donation. The date of donation refers to the date
            when donation was made online electronically or through other means.
            You can inform us by writing to sdpjssmanpur@gmail.com.
          </p>

          <h3 className="font-semibold text-lg">Conditions for refund:</h3>
          <p>Donors must share following while request refund:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Date of Donation</li>
            <li>Donation Amount</li>
            <li>Payment Method</li>
            <li>
              If by online - Receipt Number and payment gateway reference number
              (if available)
            </li>
          </ul>
          <p>
            We reserve the right to refuse refund that does not meet the above
            return conditions at our sole discretion.
          </p>

          <h3 className="font-semibold text-lg">Contact Us</h3>
          <p>
            If you have any questions about our Cancellation and Refunds Policy,
            please contact us by e-mail sdpjssmanpur@gmail.com
          </p>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-6 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancellationModal;
