import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import AppContextProvider from "./context/AppContext.jsx";
import EnvironmentBanner from "./components/EnvironmentBanner.jsx";
import { DonationFlowProvider } from "./context/DonationFlowContext.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppContextProvider>
      <DonationFlowProvider>
        <EnvironmentBanner />
        <App />
      </DonationFlowProvider>
    </AppContextProvider>
  </BrowserRouter>
);
