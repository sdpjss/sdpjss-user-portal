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
  const [donationFlow, setDonationFlow] = useState("regular");
  const [transaction, setTransaction] = useState({
    isOpen: false,
    status: "",
    message: "",
    receiptData: null,
    donationFlow: "regular",
  });

  const requestDonation = (flow) => {
    if (utoken) {
      setDonationFlow(flow);
      setIsDonationOpen(true);
      return;
    }

    sessionStorage.setItem(PENDING_DONATION_KEY, flow);
    setState("Login");
    navigate("/login");
  };
  const openDonation = () => requestDonation("regular");
  const openMaaDurgaPratimaDonation = () =>
    requestDonation("maa_durga_pratima");

  useEffect(() => {
    if (
      utoken &&
      location.pathname !== "/login" &&
      sessionStorage.getItem(PENDING_DONATION_KEY)
    ) {
      const pendingFlow = sessionStorage.getItem(PENDING_DONATION_KEY);
      sessionStorage.removeItem(PENDING_DONATION_KEY);
      setDonationFlow(pendingFlow);
      setIsDonationOpen(true);
    }
  }, [location.pathname, utoken]);

  return (
    <DonationFlowContext.Provider
      value={{ openDonation, openMaaDurgaPratimaDonation }}
    >
      {children}
      <DonationModal
        key={donationFlow}
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
        backendUrl={backendUrl}
        userToken={utoken}
        specialCategoryCode={
          donationFlow === "maa_durga_pratima"
            ? "maa_durga_pratima"
            : undefined
        }
        onSwitchDonationFlow={setDonationFlow}
        onTransactionComplete={(result) =>
          setTransaction({
            isOpen: true,
            status: result.status,
            message: result.message,
            receiptData: result.receiptData,
            donationFlow,
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
        followUpAction={
          transaction.donationFlow === "maa_durga_pratima"
            ? {
                title: "Remember your yearly donation",
                message:
                  "Your Maa Durga Pratima contribution is separate from your usual yearly self donation.",
                label: "Make Yearly Self Donation",
              }
            : {
                title: "Optional Maa Durga Pratima contribution",
                message:
                  "You can also make a separate contribution towards Maa Durga Pratima.",
                label: "Contribute to Maa Durga Pratima",
              }
        }
        onFollowUp={() => {
          const nextFlow =
            transaction.donationFlow === "maa_durga_pratima"
              ? "regular"
              : "maa_durga_pratima";
          setTransaction((current) => ({ ...current, isOpen: false }));
          requestDonation(nextFlow);
        }}
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
