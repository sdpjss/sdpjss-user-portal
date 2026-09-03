const TermsAndConditionsModal = ({ isOpen, onClose }) => {
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
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Terms and Conditions
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
        <div className="p-6 overflow-y-auto text-gray-700 space-y-4 text-sm">
          <div className="space-y-4 font-medium">
            <p><strong>Effective Date:</strong> August 27, 2025</p>

            <p>Welcome to SDPJSS’s website (“we”, “our”, “us”). By registering on our website, donating, or otherwise using our services, you (“you”, “user”, “donor”) agree to the following Terms and Conditions. Please read them carefully before proceeding.</p>

            <h3 className="font-semibold text-lg text-gray-800 mt-6">1. Eligibility</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>You must be at least 12 years old to register or donate.</li>
              <li>If you are below 12, donations must be done under the supervision and consent of a parent/guardian.</li>
            </ul>

            <h3 className="font-semibold text-lg text-gray-800 mt-6">2. Purpose of Registration</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Registration is required for participating in donation activities, receiving updates, and accessing certain services of our NGO.</li>
              <li>You agree to provide accurate, complete, and updated information during registration.</li>
            </ul>

            <h3 className="font-semibold text-lg text-gray-800 mt-6">3. Information Collection and Use</h3>
            <p>During registration, we may collect your personal details including your name, father’s name, date of birth, email address, and postal address.</p>
            <p>This information will be used strictly for:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Registering for online services</li>
              <li>Processing and acknowledging donations</li>
              <li>Issuing donation receipts</li>
              <li>Communicating updates regarding our activities</li>
              <li>Maintaining records as per applicable laws</li>
            </ul>

            <h3 className="font-semibold text-lg text-gray-800 mt-6">4. Privacy and Data Security</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>We are committed to safeguarding your personal information.</li>
              <li>Your information will not be sold, rented, or shared with third parties except as required by law or for statutory compliance.</li>
              <li>Please refer to our Privacy Policy for detailed information.</li>
            </ul>

            <h3 className="font-semibold text-lg text-gray-800 mt-6">5. Donations and Payments</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>All donations made through our website are voluntary and non-refundable subject to refund policy.</li>
              <li>Donation receipts will be available for download or printing immediately after the donation is accepted.</li>
              <li>We are not liable for errors in the information you provide during payment.</li>
            </ul>

            <h3 className="font-semibold text-lg text-gray-800 mt-6">6. Intellectual Property</h3>
            <p>All content on this website, including text, images, and logos, is the property of SDPJSS and cannot be copied, reproduced, or used without prior written consent.</p>

            <h3 className="font-semibold text-lg text-gray-800 mt-6">7. Limitation of Liability</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>While we strive to ensure the website operates smoothly, we do not guarantee uninterrupted access or error-free service.</li>
              <li>We shall not be liable for any direct or indirect loss, damage, or inconvenience caused due to the use of this website or reliance on the information provided.</li>
            </ul>

            <h3 className="font-semibold text-lg text-gray-800 mt-6">8. Amendments</h3>
            <p>We reserve the right to modify these Terms and Conditions at any time. Updated terms will be posted on this page with the “Effective Date.”</p>

            <h3 className="font-semibold text-lg text-gray-800 mt-6">9. Governing Law</h3>
            <p>These Terms and Conditions shall be governed by and construed under the laws of India. Any disputes shall be subject to the jurisdiction of courts in Gaya, Bihar.</p>

            <h3 className="font-semibold text-lg text-gray-800 mt-6">10. Contact Us</h3>
            <p>For any queries regarding these Terms and Conditions, you may contact us at:</p>
            <p><strong>Email:</strong> sdpjssmanpur@gmail.com<br/>
            <strong>Address:</strong></p>
            <div className="flex items-start gap-4">
              <div>
                <p className="text-lg font-semibold text-gray-800">Shree Durgaji Patway Jati Sudhar Samiti</p>
                <div className="text-gray-600">
                  <p>Shree Durga Sthan, Manpur, Patwatoli</p>
                  <p>P.O. Buniyadganj, Gaya - 823003, Bihar, India</p>
                  <p className="text-sm text-gray-500 mt-1">
                    <strong>Landmark:</strong> Near UCO Bank, Manpur, Durga Sthan
                  </p>
                </div>
              </div>
            </div>
          <div className="footer">
            <p>© 2025 | SDPJSS. All rights reserved.</p>
          </div>
          </div>
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

export default TermsAndConditionsModal;
