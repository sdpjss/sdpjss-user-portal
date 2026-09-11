import { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DonationModal from "../components/modalbox/DonationModal";
import TransactionStatusModal from "../components/modalbox/TransactionStatusModal";
import { AppContext } from "./AppContext";

const DonationFlowContext = createContext(null);
const PENDING_DONATION_KEY = "sdpjss_pending_donation";

const DonationFlowProvider = ({ children }) => {
  const { backendUrl, utoken, setState } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [transaction, setTransaction] = useState({
    isOpen: false,
    status: "",
    message: "",
    receiptData: null,
  });

  const requestDonation = () => {
    if (utoken) {
      setIsDonationOpen(true);
      return;
    }

    sessionStorage.setItem(PENDING_DONATION_KEY, "true");
    setState("Login");
    navigate("/login");
  };
  const openDonation = () => requestDonation();

  useEffect(() => {
    if (
      utoken &&
      location.pathname !== "/login" &&
      sessionStorage.getItem(PENDING_DONATION_KEY)
    ) {
      sessionStorage.removeItem(PENDING_DONATION_KEY);
      setIsDonationOpen(true);
    }
  }, [location.pathname, utoken]);

  return (
    <DonationFlowContext.Provider value={{ openDonation }}>
      {children}
      <DonationModal
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
        backendUrl={backendUrl}
        userToken={utoken}
        onTransactionComplete={(result) =>
          setTransaction({
            isOpen: true,
            status: result.status,
            message: result.message,
            receiptData: result.receiptData,
          })
        }
      />
      <TransactionStatusModal
        isOpen={transaction.isOpen}
        onClose={() =>
          setTransaction((current) => ({ ...current, isOpen: false }))
        }
        status={transaction.status}
        message={transaction.message}
        receiptData={transaction.receiptData}
      />
    </DonationFlowContext.Provider>
  );
};

const useDonationFlow = () => {
  const context = useContext(DonationFlowContext);
  if (!context) {
    throw new Error(
      "useDonationFlow must be used within a DonationFlowProvider"
    );
  }
  return context;
};

export { DonationFlowProvider, useDonationFlow };
