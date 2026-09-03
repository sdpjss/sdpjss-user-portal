import { useState, useMemo, useContext, useRef, useEffect } from "react";
import {
  Calendar,
  Filter,
  Banknote,
  Package,
  Clock,
  CreditCard,
  Truck,
  Heart,
  User,
  Users,
  Download, // <-- ADDED
} from "lucide-react";
import html2pdf from "html2pdf.js"; // <-- ADDED
import { AppContext } from "../../context/AppContext";
import DonationReceiptTemplate from "../DonationReceiptTemplate";
import PrasadTokenTemplate from "../PrasadTokenTemplate";

// ==============================================================================
// DONATION SECTION COMPONENT
// ==============================================================================

const DonationSection = () => {
  const { donations, donationsLoading, userData, childUsers, childUsersLoading } = useContext(AppContext);
  const receiptRef = useRef(null); // <-- ADDED for PDF generation
  const [receiptData, setReceiptData] = useState(null); // <-- ADDED state to hold data for donation receipt PDF
  const [tokenData, setTokenData] = useState(null); // <-- ADDED state to hold data for prasad token PDF

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDonatedAs, setSelectedDonatedAs] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("completed");

  // <-- NEW: useEffect to trigger PDF download when receiptData is set -->
  useEffect(() => {
    if (receiptData && receiptRef.current) {
      const opt = {
        margin: 0.5,
        filename: `Receipt-${receiptData.donation.receiptId}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };
      html2pdf()
        .from(receiptRef.current)
        .set(opt)
        .save()
        .then(() => {
          setReceiptData(null); // Reset after saving
        });
    }
  }, [receiptData]);

  // <-- NEW: useEffect to trigger PDF download when tokenData is set -->
  useEffect(() => {
    if (tokenData && receiptRef.current) {
      const opt = {
        margin: 0.5,
        filename: `Token-${tokenData.donation.receiptId}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };
      html2pdf()
        .from(receiptRef.current)
        .set(opt)
        .save()
        .then(() => {
          setTokenData(null); // Reset after saving
        });
    }
  }, [tokenData]);

  const validDonations = useMemo(() => {
    if (!donations || donations.length === 0) return [];
    return donations.filter(
      (donation) =>
        donation.paymentStatus === "completed" ||
        donation.paymentStatus === "failed" ||
        donation.paymentStatus === "pending"
    );
  }, [donations]);

  const availableYears = useMemo(() => {
    if (!validDonations || validDonations.length === 0) return [currentYear];
    const years = [
      ...new Set(
        validDonations.map((donation) => new Date(donation.date).getFullYear())
      ),
    ];
    return years.sort((a, b) => b - a);
  }, [validDonations]);

  const availableCategories = useMemo(() => {
    if (!validDonations || validDonations.length === 0) return ["All"];
    const categories = new Set(["All"]);
    validDonations.forEach((donation) => {
      donation.list.forEach((item) => categories.add(item.category));
    });
    return Array.from(categories);
  }, [validDonations]);

  const availableDonatedAs = useMemo(() => {
    if (!validDonations || validDonations.length === 0) return ["All"];
    const donatedAs = new Set(["All"]);
    validDonations.forEach((donation) => {
      if (donation.donatedAs) {
        donatedAs.add(donation.donatedAs);
      }
    });
    return Array.from(donatedAs);
  }, [validDonations]);

  const filteredDonations = useMemo(() => {
    if (!validDonations || validDonations.length === 0) return [];
    return validDonations.filter((donation) => {
      const donationYear = new Date(donation.date).getFullYear();
      const yearMatch = donationYear === selectedYear;
      const statusMatch = donation.paymentStatus === selectedStatus;
      const categoryMatch =
        selectedCategory === "All" ||
        donation.list.some((item) => item.category === selectedCategory);
      const donatedAsMatch =
        selectedDonatedAs === "All" || donation.donatedAs === selectedDonatedAs;
      return yearMatch && statusMatch && categoryMatch && donatedAsMatch;
    });
  }, [
    validDonations,
    selectedYear,
    selectedCategory,
    selectedDonatedAs,
    selectedStatus,
  ]);

  const yearlyTotals = useMemo(() => {
    if (!validDonations || validDonations.length === 0) return 0;
    const completedYearDonations = validDonations.filter(
      (donation) =>
        new Date(donation.date).getFullYear() === selectedYear &&
        donation.paymentStatus === "completed"
    );
    return completedYearDonations.reduce(
      (total, donation) =>
        total + donation.amount + (donation.courierCharge || 0),
      0
    );
  }, [validDonations, selectedYear]);

  const filteredTotals = useMemo(() => {
    if (!filteredDonations || filteredDonations.length === 0)
      return { totalAmount: 0, totalCourierCharges: 0, totalCount: 0 };
    return {
      totalAmount: filteredDonations.reduce(
        (total, donation) => total + donation.amount,
        0
      ),
      totalCourierCharges: filteredDonations.reduce(
        (total, donation) => total + (donation.courierCharge || 0),
        0
      ),
      totalCount: filteredDonations.length,
    };
  }, [filteredDonations]);

  const formatDate = (dateString) => {
    return (
      new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // <-- NEW: Handler to prepare data and trigger download -->
  const handleDownloadClick = (donation) => {
    const dataForReceipt = {
      donation: donation,
      user: userData,
      childUser: donation.donatedAs === "child" ? (childUsers.find(child => child._id === donation.donatedFor)) : null,
      weightAdjustmentMessage: 0, // Set default or get from donation if available
    };
  //
    setReceiptData(dataForReceipt);
  };

  // <-- NEW: Handler to prepare data and trigger prasad token download -->
  const handlePrasadTokenDownloadClick = (donation) => {
    const dataForToken = {
      donation: donation,
      user: userData,
      childUser: donation.donatedAs === "child" ? (childUsers.find(child => child._id === donation.donatedFor)) : null,
      weightAdjustmentMessage: 0, // Set default or get from donation if available
    };
    setTokenData(dataForToken);
  };

  // Function to determine if prasad collection mode is local pickup
  // Adjust the logic based on actual address formats used

  const prasadCollectionModeAsLocalPickup = (donation) => {
    const address = donation.postalAddress.toLowerCase();
    if (address === "will collect from durga sthan") {
      return true;
    }
    if (!address
        || (address.includes("manpur") && address.includes("gaya") && address.includes("bihar"))
        || (address.includes("gaya") && address.includes("bihar"))) {
      return true;
    }
    return false;
  };

  const shouldShowPrasadTokenButton = (donation) => {
    return prasadCollectionModeAsLocalPickup(donation)
      && import.meta.env.VITE_SHOW_PRASAD_TOKEN_DOWNLOAD_BUTTON === "true";
  };

  const totalPacketCount = (donation) => {
    if (!donation || !donation.list || donation.list.length === 0) return 0;
    return donation.list.reduce((total, item) => total + (item.isPacket ? item.quantity : 0), 0);
  };

  const totalWeightInGrams = (donation) => {
    if (!donation || !donation.list || donation.list.length === 0) return 0;
    return donation.list.reduce((total, item) => total + (item.isPacket ? 0 : item.quantity), 0);
  };

  const formattedWeight = (grams) => {
    const kg = Math.floor(grams / 1000);
    const gm = grams % 1000;
    let result = "";
    if (kg > 0) result += `${kg} kg `;
    if (gm > 0) result += `${gm} gm`;
    return result.trim() || "0 gm";
  };

  const quantityToDisplay = (donation) => {
    const totalWeightInGm = totalWeightInGrams(donation);
    const totalPackets = totalPacketCount(donation);
    let result = "";
    const totalWeight = formattedWeight(totalWeightInGm);
    if (totalWeightInGm > 0) {
      result += totalWeight.toLocaleString("en-IN");
    }
    if (totalWeightInGm > 0 && totalPackets > 0) {
      result += " and ";
    }
    if (totalPackets > 0) {
      result += `${totalPackets.toLocaleString("en-IN")} ${totalPackets === 1 ? "packet" : "packets"}`;
    }
    if (totalWeightInGm == 0 && totalPackets == 0) {
      result += "Not applicable";
    }
    return result;
  };

  if (donationsLoading || childUsersLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Donation History
        </h1>
        <p className="text-gray-600">
          Track your contributions and make a difference in the world
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-2 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium opacity-90">
                Total Donations for {selectedYear}
              </h2>
              <p className="text-3xl font-bold mt-2">
                ₹{yearlyTotals.toLocaleString()}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Banknote className="w-8 h-8" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-3 bg-white rounded-xl p-6 shadow-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Filtered Results Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {filteredTotals.totalCount}
              </p>
              <p className="text-sm text-gray-600">Donations</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-rose-600">
                ₹{filteredTotals.totalAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Amount</p>
            </div>
            <div className="text-center hidden sm:block">
              <p className="text-2xl font-bold text-red-700">
                ₹{filteredTotals.totalCourierCharges.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Courier</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Donated As
            </label>
            <select
              value={selectedDonatedAs}
              onChange={(e) => setSelectedDonatedAs(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {availableDonatedAs.map((donatedAs) => (
                <option key={donatedAs} value={donatedAs}>
                  {donatedAs === "All"
                    ? "All"
                    : donatedAs === "self"
                    ? "Self Donation"
                    : donatedAs === "child"
                    ? "Child Donation"
                    : donatedAs}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 inline mr-1" />
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Donations List */}
      <div className="space-y-4">
        {filteredDonations.length === 0 ? (
          <div className="text-center py-12 bg-red-50 rounded-lg border-2 border-dashed border-red-200">
            <Heart className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No donations found
            </h3>
            <p className="text-gray-500">
              {validDonations.length === 0
                ? "You haven't made any donations yet. Start your journey of giving today!"
                : "No donations match your current filters. Try adjusting your search criteria."}
            </p>
          </div>
        ) : (
          filteredDonations.map((donation) => (
            <div
              key={donation._id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-lg hover:border-red-200 transition-all duration-200"
            >
              <div className="p-4 sm:p-6 relative">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <Banknote className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        ₹{donation.amount.toLocaleString()}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDate(donation.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <span
                      className={`font-mono px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        donation.paymentStatus
                      )}`}
                    >
                      {donation.razorpayOrderId}{donation.receiptId}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium flex items-center">
                      <CreditCard className="w-4 h-4 mr-1" />
                      {donation.method}
                    </span>
                    {donation.donatedAs && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center">
                        {donation.donatedAs === "self" ? (
                          <User className="w-4 h-4 mr-1" />
                        ) : (
                          <Users className="w-4 h-4 mr-1" />
                        )}
                        {donation.donatedAs === "self"
                          ? "Self"
                          : donation.donatedAs === "child"
                          ? ((childUsers.find(child => child._id === donation.donatedFor)).fullname).split(" ")[0]
                          : donation.donatedAs}
                      </span>
                    )}
                  </div>
                </div>

                {/* Donation Items */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Donation Items:
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {donation.list.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.category}
                            </p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.number}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            ₹{item.amount}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer and Download Button */}
                <div className="border-t pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="flex-grow">
                    {donation.paymentStatus === "completed" && (
                      <>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Package className="w-4 h-4 mr-1" /> Mahaprasad: {" "}
                          <span className="bg-green-100 px-2 py-1 rounded ml-1">
                            {quantityToDisplay(donation)}
                          </span>
                        </div>

                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Truck className="w-4 h-4 mr-1" /> Delivery Mode: {" "}
                          <span className="bg-blue-100 px-2 py-1 rounded ml-1">
                            {prasadCollectionModeAsLocalPickup(donation)
                              ? 'Local Pickup'
                              : 'Courier'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {donation.paymentStatus === "completed" && (
                    <>
                      {shouldShowPrasadTokenButton(donation) && (
                        <button
                          onClick={() => handlePrasadTokenDownloadClick(donation)}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                        >
                        <Download size={16} />
                          Prasad Token
                        </button>
                      )}

                      <button
                        onClick={() => handleDownloadClick(donation)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
                      >
                        <Download size={16} />
                        Donation Receipt
                      </button>
                    </>
                  )}
                </div>

                {donation.remarks && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <p className="text-sm text-red-900">
                      <strong>Remarks:</strong> {donation.remarks}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* <-- ADDED: Hidden container for generating the prasad token PDF --> */}
      {tokenData && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={receiptRef}>
            <PrasadTokenTemplate receiptData={tokenData} />
          </div>
        </div>
      )}

      {/* <-- ADDED: Hidden container for generating the receipt PDF --> */}
      {receiptData && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={receiptRef}>
            <DonationReceiptTemplate receiptData={receiptData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationSection;
