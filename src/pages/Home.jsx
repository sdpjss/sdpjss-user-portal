import { useContext } from "react";
import Header from "../components/Header";
import StepsMenu from "../components/StepsMenu";
import Notice from "../components/Notice";
import AccountStatusModal from "../components/modalbox/ApprovalStatusModal";
import ServicesGallery from "../components/ServiceGallery";
import { AppContext } from "../context/AppContext";

const Home = () => {
  const { utoken } = useContext(AppContext);
  return (
    <div>
      {/* Account Status Modal - will only show if user is pending/disabled */}
      <AccountStatusModal />

      <Header />
      <Notice />
      {utoken && <StepsMenu />}
      <ServicesGallery />
    </div>
  );
};

export default Home;
