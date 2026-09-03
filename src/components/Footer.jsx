import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { assets } from "../assets/assets";
import TermsAndConditionsModal from "./modalbox/TermsAndConditionsModal";
import PrivacyPolicyModal from "./modalbox/TermsOfUseModal";
import CancellationModal from "./modalbox/CancellationModal";

const Footer = () => {
  const [isTermsAndConditionsOpen, setIsTermsAndConditionsOpen] =
    useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isCancellationOpen, setIsCancellationOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (section) => {
    // Handle navigation to different sections
    // You can implement your routing logic here
    navigate(`/${section}`);

    // Example for scrolling to sections or using React Router

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="md:mx-10">
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
        {/* Left Section */}
        <div>
          <img className="mb-5 w-40" src={assets.logo} alt="" />
          <p className="w-full md:w-2/3 text-gray-600 leading-6">
            Our objective is to inspire giving by transforming religious
            donations into impactful initiatives that support education,
            healthcare, and community development, uplifting underprivileged
            communities and fostering lasting change.
          </p>
        </div>

        {/* Center Section */}
        <div>
          <p className="text-xl font-medium mb-5">COMPANY</p>
          <ul className="flex flex-col gap-2 text-gray-600">
            <li>
              <button
                onClick={() => handleNavigation("about")}
                className="hover:text-gray-800 transition-colors duration-200 text-left"
              >
                About us
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation("contact")}
                className="hover:text-gray-800 transition-colors duration-200 text-left"
              >
                Contact us
              </button>
            </li>
            <li>
              <button
                onClick={() => setIsTermsAndConditionsOpen(true)}
                className="hover:text-gray-800 transition-colors duration-200 text-left"
              >
                Terms of Use
              </button>
            </li>
            <li>
              <button
                onClick={() => setIsPrivacyPolicyOpen(true)}
                className="hover:text-gray-800 transition-colors duration-200 text-left"
              >
                Privacy Policy
              </button>
            </li>
            <li>
              <button
                onClick={() => setIsCancellationOpen(true)}
                className="hover:text-gray-800 transition-colors duration-200 text-left"
              >
                Cancellation Policy
              </button>
            </li>
          </ul>
        </div>

        {/* Right Section */}
        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-2 text-gray-600">
            <li>
              <a
                href="tel:+919031859588"
                className="hover:text-gray-800 transition-colors duration-200"
              >
                +91 6312952160
              </a>
            </li>
            <li>
              <a
                href="tel:+919472030916"
                className="hover:text-gray-800 transition-colors duration-200"
              >
                +91 9472030916
              </a>
            </li>
            <li>
              <a
                href="mailto:sdpjssmanpur@gmail.com"
                className="hover:text-gray-800 transition-colors duration-200"
              >
                sdpjssmanpur@gmail.com
              </a>
            </li>
          </ul>

          {/* Social Media Icons */}
          <div className="flex gap-4 mt-6">
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              <Facebook className="w-6 h-6" />
            </a>

            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-pink-600 transition-colors duration-200"
            >
              <Instagram className="w-6 h-6" />
            </a>

            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-red-600 transition-colors duration-200"
            >
              <Youtube className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>

      <hr />

      <div className="flex flex-col sm:grid grid-cols-[1fr_3fr_1fr] gap-14 my-10">
        <p className="text-sm text-center">Estd. 1939</p>
        <p className="text-sm text-center">
          © 2025 | SDPJSS. All rights reserved.
        </p>
        <p className="text-sm text-center">Reg.No. 272/2020</p>
      </div>

      {/* Modal Components */}
      <TermsAndConditionsModal
        isOpen={isTermsAndConditionsOpen}
        onClose={() => setIsTermsAndConditionsOpen(false)}
      />
      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyOpen}
        onClose={() => setIsPrivacyPolicyOpen(false)}
      />
      <CancellationModal
        isOpen={isCancellationOpen}
        onClose={() => setIsCancellationOpen(false)}
      />
    </div>
  );
};

export default Footer;
