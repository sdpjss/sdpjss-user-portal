
const TermsOfUseModal = ({ isOpen, onClose }) => {
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
            Privacy Policy
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
            <section>
              <p>
                SDPJSS (“we”, “our”, “us”) respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, store, and safeguard your information when you register or donate through our website.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg text-gray-800 mt-6">1. Information We Collect</h3>
              <p>When you register or donate, we may collect the following personal details:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Full Name</li>
                <li>Father’s Name</li>
                <li>Date of Birth</li>
                <li>Email Address</li>
                <li>Postal Address</li>
                <li>Payment/Donation details (if applicable)</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg text-gray-800 mt-6">2. How We Use Your Information</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>Processing and acknowledging donations</li>
                <li>Issuing official donation receipts</li>
                <li>Communicating with you about our activities, events, and updates</li>
                <li>Maintaining records as per legal and statutory requirements</li>
                <li>Improving our services and website functionality</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg text-gray-800 mt-6">3. Sharing of Information</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>We do <strong>not</strong> sell, trade, or rent your personal information to third parties</li>
                <li>Information may be shared only:
                  <ul className="list-disc ml-6 space-y-1">
                    <li>With authorized payment service providers to process donations</li>
                    <li>If required by law, regulation, or government authorities</li>
                  </ul>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg text-gray-800 mt-6">4. Data Security</h3>
              <p>
                We implement reasonable security measures to protect your data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure. You agree that we cannot guarantee absolute security of your data.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg text-gray-800 mt-6">5. Cookies and Website Usage</h3>
              <p>
                Our website may use cookies to improve user experience, analyze traffic, and provide relevant updates.
                You may choose to disable cookies in your browser settings, but some features of the site may not function properly.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg text-gray-800 mt-6">6. Your Rights</h3>
              <ul>
                <li>Access the personal information we hold about you</li>
                <li>Request corrections or updates to your personal information</li>
                <li>Request deletion of your information, subject to legal and accounting requirements</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg text-gray-800 mt-6">7. Data Retention</h3>
              <p>
                We will retain your personal information only for as long as necessary to fulfill the purposes outlined in this policy, or as required by law.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg text-gray-800 mt-6">8. Updates to This Policy</h3>
              <p>
                We may update this Privacy Policy from time to time. The latest version will always be posted on our website with the effective date.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg text-gray-800 mt-6">9. Contact Us</h3>
              <p>
                If you have any questions or concerns about this Privacy Policy or your data, please contact us at:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li><strong>Email:</strong> sdpjssmanpur@gmail.com</li>
                <li><strong>Address:</strong>
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
                </li>
              </ul>
            </section>

            <footer>
              <p>© 2025 | SDPJSS. All rights reserved.</p>
            </footer>
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

export default TermsOfUseModal;
