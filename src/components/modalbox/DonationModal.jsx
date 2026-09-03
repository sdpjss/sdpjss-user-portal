import { useState, useEffect, useContext, useRef } from "react";
import {
  X,
  Heart,
  MapPin,
  Package,
  CreditCard,
  Plus,
  Minus,
  User,
  Baby,
  Edit,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import { AppContext } from "../../context/AppContext";

const DonationModal = ({
  isOpen,
  onClose,
  backendUrl,
  userToken,
  onTransactionComplete,
}) => {
  // --- STATE MANAGEMENT ---
  const [userProfile, setUserProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [courierCharges, setCourierCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [childNameError, setChildNameError] = useState("");
  const [donationMode, setDonationMode] = useState("self");
  const [childUsers, setChildUsers] = useState([]);

  const [isDonatingAsWife, setIsDonatingAsWife] = useState(false);
  const [husbandName, setHusbandName] = useState("");
  const [husbandNameError, setHusbandNameError] = useState("");

  const [selectedChildId, setSelectedChildId] = useState("");
  const [showChildForm, setShowChildForm] = useState(false);
  const [isEditingChild, setIsEditingChild] = useState(false);
  const [savingChild, setSavingChild] = useState(false);
  const [childFormData, setChildFormData] = useState({
    _id: null,
    fullname: "",
    gender: "",
    dob: "",
  });
  const [dobError, setDobError] = useState("");
  const [isCourierAddressInvalid, setIsCourierAddressInvalid] = useState(false);

  // --- States for new features
  const [minTotalWeight, setMinTotalWeight] = useState(0);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0); // For keyboard navigation
  const categoryDropdownRef = useRef(null); // Ref for scrolling

  const { loadUserDonations } = useContext(AppContext);

  const initialFormData = {
    willCome: "YES",
    courierAddress: "",
    donationItems: [
      {
        categoryId: "",
        category: "",
        quantity: 1,
        rate: 0,
        weight: 0,
        packet: 0,
        unitAmount: 0,
        unitWeight: 0,
        unitPacket: 0,
        isPacketBased: false,
        isDynamic: false,
        minvalue: 0,
        error: "", // For real-time validation
      },
    ],
    paymentMethod: "Online",
    remarks: "",
  };
  const [formData, setFormData] = useState(initialFormData);
  const [totals, setTotals] = useState({
    totalAmount: 0,
    courierCharge: 0,
    netPayable: 0,
  });

  // --- HELPER FUNCTIONS ---
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const capitalizeEachWord = (str) =>
    !str
      ? ""
      : str
          .split(" ")
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(" ");

  // --- DATA FETCHING & LIFECYCLE ---
  useEffect(() => {
    if (isOpen && userToken) {
      setLoading(true);
      fetchUserProfile().then((profile) => {
        if (profile) {
          Promise.all([
            fetchCategories(),
            fetchCourierCharges(),
            fetchChildUsers(profile._id),
          ]).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });
    } else if (!isOpen) {
      resetForm();
    }
  }, [isOpen, userToken]);

  useEffect(() => {
    if (userProfile) {
      setFormData((prev) => ({ ...prev, courierAddress: getPrefillAddress() }));
    }
  }, [userProfile]);

  useEffect(() => {
    calculateTotals();
  }, [
    formData.donationItems,
    formData.willCome,
    formData.courierAddress,
    courierCharges,
  ]);

  useEffect(() => {
    if (formData.willCome === "NO") {
      const location = formData.courierAddress.toLowerCase();
      const isInvalid =
        (location.includes("manpur") &&
          location.includes("gaya") &&
          location.includes("bihar")) ||
        (location.includes("gaya") && location.includes("bihar")) ||
        !location;
      setIsCourierAddressInvalid(isInvalid);
    } else {
      setIsCourierAddressInvalid(false);
    }
  }, [formData.courierAddress, formData.willCome]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".category-dropdown-container")) {
        setOpenDropdownIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (
      openDropdownIndex !== null &&
      categoryDropdownRef.current &&
      activeCategoryIndex >= 0
    ) {
      const list = categoryDropdownRef.current;
      const activeItem = list.querySelector(".active-category-item");
      if (activeItem) {
        activeItem.scrollIntoView({
          block: "nearest",
        });
      }
    }
  }, [activeCategoryIndex, openDropdownIndex, categorySearch]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/user/get-profile`, {
        headers: { utoken: userToken },
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.userData);
        return data.userData;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
    return null;
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/user/categories`, {
        headers: { utoken: userToken },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);

        const dynamicCategories = data.categories.filter(
          (cat) => cat.dynamic?.isDynamic
        );
        if (dynamicCategories.length > 0) {
          const weights = dynamicCategories
            .map((cat) => cat.dynamic.minvalue || 0)
            .filter((w) => w > 0);
          if (weights.length > 0) {
            const minWeight = Math.min(...weights);
            setMinTotalWeight(minWeight);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchCourierCharges = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/user/courier-charges`, {
        headers: { utoken: userToken },
      });
      if (response.ok) {
        const data = await response.json();
        setCourierCharges(data.courierCharges);
      }
    } catch (error) {
      console.error("Error fetching courier charges:", error);
    }
  };

  const fetchChildUsers = async (parentId) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/user/child/my-children/${parentId}`,
        { headers: { utoken: userToken } }
      );
      if (response.ok) {
        const data = await response.json();
        setChildUsers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching child users:", error);
    }
  };

  // --- CHILD MANAGEMENT HANDLERS ---
  const handleChildSelect = (childId) => {
    setSelectedChildId(childId);
    setShowChildForm(false);
    setIsEditingChild(false);
  };

  const handleAddNewChildClick = () => {
    setIsEditingChild(false);
    setChildFormData({ _id: null, fullname: "", gender: "", dob: "" });
    setShowChildForm(true);
    setSelectedChildId("");
  };

  const handleEditChildClick = (child) => {
    setSelectedChildId(child._id);
    setIsEditingChild(true);
    const formattedDob = child.dob ? child.dob.split("T")[0] : "";
    setChildFormData({
      _id: child._id,
      fullname: child.fullname,
      gender: child.gender,
      dob: formattedDob,
    });
    setShowChildForm(true);
  };

  const handleDeleteChildClick = async (childId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this child's profile? This cannot be undone."
      )
    ) {
      try {
        const response = await fetch(`${backendUrl}/api/user/child/delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", utoken: userToken },
          body: JSON.stringify({ childId, parentId: userProfile._id }),
        });
        const result = await response.json();
        if (result.success) {
          alert("Child profile deleted successfully.");
          fetchChildUsers(userProfile._id);
          setSelectedChildId("");
        } else {
          alert(`Error: ${result.message}`);
        }
      } catch (error) {
        alert("An error occurred while deleting the child profile.");
      }
    }
  };

  const handleChildFormChange = (field, value) => {
    if (field === "fullname") {
      value = capitalizeEachWord(value);
      const hasMultipleSpaces = /\s{2,}/.test(value);
      setChildNameError(
        hasMultipleSpaces ? "Multiple spaces between words are not allowed" : ""
      );
    }

    if (field === "dob") {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge =
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ? age - 1
          : age;
      setDobError(
        birthDate > today
          ? "Date of Birth cannot be in the future."
          : actualAge >= 12
            ? "Age must be less than 12 years. For others, please register them separately."
            : ""
      );
    }
    setChildFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveChild = async () => {
    if (
      !childFormData.fullname ||
      !childFormData.gender ||
      !childFormData.dob
    ) {
      return alert("Please fill all child details before saving.");
    }
    if (dobError || childNameError) {
      return alert(dobError || childNameError);
    }

    setSavingChild(true);

    const isUpdating = isEditingChild && childFormData._id;
    const url = isUpdating
      ? `${backendUrl}/api/user/child/edit`
      : `${backendUrl}/api/user/child/add`;
    const method = isUpdating ? "PUT" : "POST";

    const payload = {
      ...childFormData,
      parentId: userProfile._id,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", utoken: userToken },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.success) {
        alert(
          `Child profile ${isUpdating ? "updated" : "added"} successfully!`
        );
        await fetchChildUsers(userProfile._id);
        setShowChildForm(false);
        setIsEditingChild(false);
        const newChildId = isUpdating ? childFormData._id : result.data._id;
        setSelectedChildId(newChildId);
      } else {
        throw new Error(result.message || "Failed to save child profile.");
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSavingChild(false);
    }
  };

  // --- FORM LOGIC ---
  const handleDonationModeChange = (mode) => {
    if (submitting) return;
    setDonationMode(mode);
    setFormData((prev) => ({
      ...prev,
      donationItems: [{ ...initialFormData.donationItems[0] }],
    }));
    if (mode === "self") {
      setSelectedChildId("");
      setShowChildForm(false);
      setIsEditingChild(false);
      setChildFormData({ _id: null, fullname: "", gender: "", dob: "" });
    }
  };

  const getPrefillAddress = () => {
    if (!userProfile?.address) return "";
    const {
      room,
      floor,
      apartment,
      street,
      landmark,
      postoffice,
      city,
      district,
      state,
      country,
      pin,
    } = userProfile.address;
    return [
      room,
      floor,
      apartment,
      street,
      landmark,
      postoffice,
      city,
      district,
      state,
      country,
      pin,
    ]
      .filter(Boolean)
      .join(", ");
  };

  const getCourierChargeForUser = () => {
    if (
      formData.willCome === "YES" ||
      !formData.courierAddress ||
      courierCharges.length === 0
    )
      return 0;
    const location = formData.courierAddress.toLowerCase();
    const hasManpur = location.includes("manpur");
    const hasGaya = location.includes("gaya");
    const hasBihar = location.includes("bihar");
    const hasIndia = location.includes("india");

    if (hasManpur && hasGaya && hasBihar && hasIndia) {
      return 0;
    } else if (hasGaya && hasBihar && hasIndia && !hasManpur) {
      return (
        courierCharges.find((c) => c.region === "in_gaya_outside_manpur")
          ?.amount || 0
      );
    } else if (hasBihar && hasIndia && !hasGaya && !hasManpur) {
      return (
        courierCharges.find((c) => c.region === "in_bihar_outside_gaya")
          ?.amount || 0
      );
    } else if (hasIndia && !hasBihar && !hasGaya && !hasManpur) {
      return (
        courierCharges.find((c) => c.region === "in_india_outside_bihar")
          ?.amount || 0
      );
    } else {
      return (
        courierCharges.find((c) => c.region === "outside_india")?.amount || 0
      );
    }
  };

  const calculateTotals = () => {
    const totalAmount = formData.donationItems.reduce(
      (sum, item) => sum + (parseFloat(item.rate) || 0),
      0
    );
    const courierCharge = getCourierChargeForUser();
    const netPayable = totalAmount + courierCharge;
    setTotals({ totalAmount, courierCharge, netPayable });
  };

  const getAvailableCategories = (currentIndex) => {
    const selectedCategoryIds = formData.donationItems
      .map((item, index) => (index !== currentIndex ? item.categoryId : null))
      .filter(Boolean);
    const available = categories.filter(
      (cat) => !selectedCategoryIds.includes(cat._id)
    );
    return donationMode === "child"
      ? available.filter((cat) => cat.dynamic?.isDynamic)
      : available;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDonationItemChange = (index, field, value) => {
    const updatedItems = [...formData.donationItems];
    let item = { ...updatedItems[index] };

    if (field === "categoryId") {
      const selectedCategory = categories.find((cat) => cat._id === value);
      if (!selectedCategory) return;

      item = {
        // Reset item to avoid carrying over old properties
        ...initialFormData.donationItems[0],
        categoryId: value,
        category: selectedCategory.categoryName,
        unitAmount: selectedCategory.rate || 0,
        unitWeight: selectedCategory.weight || 0,
        unitPacket: selectedCategory.packet ? 1 : 0,
        isDynamic: selectedCategory.dynamic?.isDynamic || false,
        minvalue: selectedCategory.dynamic?.minvalue || 0,
        isPacket: selectedCategory.packet || false,
        isPacketBased: selectedCategory.packet || false,
        error: "",
      };

      const isService = item.category.toLowerCase().includes("service");

      if (isService || item.isDynamic) {
        item.quantity = 1;
        item.rate = ""; // Set rate to empty
      } else {
        item.quantity = ""; // Standard items start with empty quantity
        item.rate = 0;
        item.weight = 0;
        item.packet = 0;
      }
    } else if (field === "quantity") {
      const numericValue = value === "" ? "" : parseInt(value) || 1;

      if (!item.isDynamic) {
        item.quantity = numericValue;
        const calcQty = parseInt(numericValue) || 0;
        const isService = item.category.toLowerCase().includes("service");

        if (!isService) {
          item.rate = item.unitAmount * calcQty;
        }

        item.weight = item.unitWeight * calcQty;
        item.packet = item.unitPacket * calcQty;

        // Real-time validation for service category if rate is already filled
        if (isService) {
          const rateValue = parseFloat(item.rate) || 0;
          const minAmount = item.unitAmount * calcQty;
          if (rateValue > 0 && rateValue < minAmount) {
            item.error = `Amount must be at least ₹${minAmount}.`;
          } else {
            item.error = "";
          }
        }
      }
    } else if (field === "rate") {
      const isService = item.category.toLowerCase().includes("service");
      if (item.isDynamic || isService) {
        item.rate = value;
        const newAmount = parseFloat(value) || 0;
        let minAmount = 0;

        if (isService) {
          minAmount = item.unitAmount * (parseInt(item.quantity) || 1);
        } else if (item.isDynamic) {
          minAmount = item.minvalue;
        }

        if (newAmount > 0 && newAmount < minAmount) {
          item.error = `Amount must be at least ₹${minAmount}.`;
        } else {
          item.error = "";
        }
      }
    }

    updatedItems[index] = item;
    setFormData((prev) => ({ ...prev, donationItems: updatedItems }));
  };

  const addDonationItem = () => {
    setFormData((prev) => ({
      ...prev,
      donationItems: [
        ...prev.donationItems,
        { ...initialFormData.donationItems[0] },
      ],
    }));
  };

  const removeDonationItem = (index) => {
    if (formData.donationItems.length > 1) {
      setFormData((prev) => ({
        ...prev,
        donationItems: prev.donationItems.filter((_, i) => i !== index),
      }));
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setTotals({ totalAmount: 0, courierCharge: 0, netPayable: 0 });
    setDonationMode("self");
    setSelectedChildId("");
    setShowChildForm(false);
    setIsEditingChild(false);
    setChildFormData({ _id: null, fullname: "", gender: "", dob: "" });
    setDobError("");
    setChildNameError("");
    setSubmitting(false);
    setIsDonatingAsWife(false);
    setHusbandName("");
    setHusbandNameError("");
  };

  const handleCategoryKeyDown = (event, itemIndex) => {
    const available = getAvailableCategories(itemIndex);
    const filtered = available.filter((cat) =>
      cat.categoryName.toLowerCase().includes(categorySearch.toLowerCase())
    );

    if (filtered.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveCategoryIndex((prev) => (prev + 1) % filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveCategoryIndex(
        (prev) => (prev - 1 + filtered.length) % filtered.length
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeCategoryIndex >= 0 && activeCategoryIndex < filtered.length) {
        const selectedCategory = filtered[activeCategoryIndex];
        handleDonationItemChange(itemIndex, "categoryId", selectedCategory._id);
        setOpenDropdownIndex(null);
      }
    }
  };

  // --- Final weight calculation ---
  const calculatedTotalWeight = formData.donationItems.reduce(
    (sum, item) => sum + (item.weight || 0),
    0
  );
  const finalTotalWeight =
    calculatedTotalWeight > 0 && calculatedTotalWeight < minTotalWeight
      ? minTotalWeight
      : calculatedTotalWeight;

  // --- SUBMISSION & PAYMENT ---
  const handleRazorpayPayment = async (order, donationId) => {
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      alert("Razorpay SDK failed to load. Please check your connection.");
      setSubmitting(false);
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "SDPJSS Donation",
      description: "Contribution to Shree Durga Sthan",
      order_id: order.id,
      handler: async (response) => {
        try {
          setSubmitting(true);
          const verifyResponse = await fetch(
            `${backendUrl}/api/user/verify-donation-payment`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                utoken: userToken,
              },
              body: JSON.stringify({ ...response, donationId }),
            }
          );
          const verifyResult = await verifyResponse.json();

          if (verifyResult.success) {
            let weightAdjustmentMessage = null;
            if (
              finalTotalWeight > calculatedTotalWeight &&
              calculatedTotalWeight > 0
            ) {
              const difference = finalTotalWeight - calculatedTotalWeight;
              weightAdjustmentMessage = Math.round(difference);
            }

            const child = childUsers.find((c) => c._id === selectedChildId);
            const receiptData = {
              donation: verifyResult.donation,
              user: userProfile,
              childUser: donationMode === "child" ? child : null,
              weightAdjustmentMessage,
            };

            resetForm();
            onClose();
            onTransactionComplete({
              status: "success",
              message: "Your donation has been received. Thank you!",
              receiptData,
            });
          } else {
            throw new Error(
              verifyResult.message || "Payment verification failed."
            );
          }
        } catch (error) {
          onClose();
          onTransactionComplete({
            status: "failure",
            message: error.message,
            receiptData: null,
          });
        } finally {
          await loadUserDonations();
          setSubmitting(false);
        }
      },
      prefill: {
        name: userProfile?.fullname || "",
        email: userProfile?.contact?.email || "",
        contact: userProfile?.contact?.mobileno?.number || "",
      },
      theme: { color: "#EF4444" },
      modal: { ondismiss: () => setSubmitting(false) },
    };
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const handleSubmit = async () => {
    if (isDonatingAsWife && !husbandName.trim()) {
      setHusbandNameError("Husband's name is required.");
      return alert("Please enter the husband's name.");
    }
    if (husbandNameError) {
      return alert(husbandNameError);
    }
    if (donationMode === "child" && !selectedChildId)
      return alert("Please select a child to donate for.");
    if (showChildForm)
      return alert(
        "Please save or cancel the child details form before submitting the donation."
      );
    if (formData.donationItems.some((item) => !item.categoryId))
      return alert("Please select a category for all donation items.");
    if (formData.willCome === "NO" && !formData.courierAddress.trim())
      return alert("Please provide a valid courier address.");
    if (totals.netPayable <= 0)
      return alert("Donation amount must be greater than zero.");

    // Check for real-time validation errors
    const errors = formData.donationItems
      .map((item, index) =>
        item.error ? `Item ${index + 1}: ${item.error}` : null
      )
      .filter(Boolean);

    if (errors.length > 0) {
      return alert(
        `Please fix the following issues before submitting:\n\n${errors.join(
          "\n"
        )}`
      );
    }

    setSubmitting(true);
    try {
      const donationData = {
        userId: userProfile._id,
        list: formData.donationItems.map((item) => ({
          category: item.category,
          number: item.isDynamic ? 1 : parseInt(item.quantity) || 0,
          amount: parseFloat(item.rate) || 0,
          isPacket: item.packet > 0,
          quantity: item.weight,
        })),
        amount: totals.netPayable,
        method: "Online",
        courierCharge: totals.courierCharge,
        remarks: formData.remarks || "",
        postalAddress:
          formData.willCome === "NO"
            ? formData.courierAddress
            : "Will collect from Durga Sthan",
        totalPrasadWeight: finalTotalWeight,
        donatedAs: donationMode,
        donatedFor:
          donationMode === "child" ? selectedChildId : userProfile._id,
        relationName: isDonatingAsWife ? husbandName.trim() : "",
      };

      const response = await fetch(
        `${backendUrl}/api/user/create-donation-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", utoken: userToken },
          body: JSON.stringify(donationData),
        }
      );

      const result = await response.json();
      if (result.success && result.paymentRequired) {
        await handleRazorpayPayment(result.order, result.donationId);
      } else {
        throw new Error(result.message || "Failed to create donation order.");
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;
  const selectedChild = childUsers.find((c) => c._id === selectedChildId);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Your Details...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-2xl sticky top-0 z-10">
              <button
                onClick={onClose}
                disabled={submitting}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full"
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-3">
                <Heart className="animate-pulse" size={32} />
                <div>
                  <h2 className="text-2xl font-bold">Make a Donation</h2>
                  <p className="text-red-100 mt-1">
                    Your contribution makes a difference
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-100 p-1 rounded-full flex">
                <button
                  onClick={() => handleDonationModeChange("self")}
                  className={`w-1/2 py-2 rounded-full font-semibold transition-colors flex items-center justify-center gap-2 ${
                    donationMode === "self"
                      ? "bg-red-500 text-white shadow"
                      : "text-gray-600"
                  }`}
                >
                  <User size={16} /> Donate as Self
                </button>
                <button
                  onClick={() => handleDonationModeChange("child")}
                  className={`w-1/2 py-2 rounded-full font-semibold transition-colors flex items-center justify-center gap-2 ${
                    donationMode === "child"
                      ? "bg-red-500 text-white shadow"
                      : "text-gray-600"
                  }`}
                >
                  <Baby size={16} /> Donate for Child
                </button>
              </div>

              {/* Donor Information */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin size={16} className="text-red-500" /> Donor
                    Information
                  </label>
                  {donationMode === "self" &&
                    userProfile?.gender === "female" && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">
                          Include your husband name
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextState = !isDonatingAsWife;
                            setIsDonatingAsWife(nextState);
                            if (!nextState) {
                              setHusbandName("");
                              setHusbandNameError("");
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                            isDonatingAsWife ? "bg-red-500" : "bg-gray-300"
                          }`}
                          disabled={submitting}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isDonatingAsWife
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    )}
                </div>

                {donationMode === "self" ? (
                  <>
                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50">
                      {userProfile ? (
                        <div className="text-gray-700 text-sm">
                          <span className="font-medium">
                            {userProfile.fullname}
                          </span>
                          {isDonatingAsWife ? (
                            <span className="text-gray-500">
                              {" "}
                              • W/o {husbandName || "..."}
                            </span>
                          ) : (
                            <span className="text-gray-500">
                              {" "}
                              • {userProfile.gender === "female" ? "D/O" : "S/O"} {userProfile.fatherName}
                            </span>
                          )}
                          <span className="text-gray-500">
                            {" "}
                            • {userProfile.contact?.mobileno?.number}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Loading...</span>
                      )}
                    </div>
                    {isDonatingAsWife && (
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="Enter Husband's Full Name"
                          value={husbandName}
                          onChange={(e) => {
                            const name = capitalizeEachWord(e.target.value);
                            setHusbandName(name);
                            if (!name.trim()) {
                              setHusbandNameError(
                                "Husband's name is required."
                              );
                            } else {
                              setHusbandNameError("");
                            }
                          }}
                          className={`w-full p-2 border rounded-lg text-sm ${
                            husbandNameError
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          disabled={submitting}
                        />
                        {husbandNameError && (
                          <p className="text-xs text-red-500 mt-1">
                            {husbandNameError}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedChildId}
                        onChange={(e) => handleChildSelect(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        disabled={submitting || showChildForm}
                      >
                        <option value="">-- Select a Child --</option>
                        {childUsers.map((child) => (
                          <option key={child._id} value={child._id}>
                            {child.fullname}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddNewChildClick}
                        className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 shrink-0"
                        disabled={submitting || showChildForm}
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    {selectedChild && !showChildForm && (
                      <div className="w-full p-3 border rounded-lg bg-gray-50 flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium">
                            {selectedChild.fullname}
                          </span>
                          <span className="text-gray-500">
                            {" "}
                            • {selectedChild.gender === "female" ? "D/O" : "S/O"} {userProfile.fullname}
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEditChildClick(selectedChild)}
                            disabled={submitting}
                          >
                            <Edit
                              size={16}
                              className="text-blue-500 hover:text-blue-700"
                            />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteChildClick(selectedChild._id)
                            }
                            disabled={submitting}
                          >
                            <Trash2
                              size={16}
                              className="text-red-500 hover:text-red-700"
                            />
                          </button>
                        </div>
                      </div>
                    )}
                    {showChildForm && (
                      <div className="border p-4 rounded-lg mt-2 space-y-3 bg-gray-50">
                        <h4 className="font-semibold text-gray-700">
                          {isEditingChild
                            ? "Edit Child Details"
                            : "Add New Child"
                          }
                         <span> (Age must be less than 12 years)</span>
                        </h4>

                        <div className="flex flex-col mb-4 lg:flex-row lg:items-center">
                          <label className="w-full text-gray-700 lg:w-1/5">Name</label>
                          <input
                            type="text"
                            placeholder="Child's Full Name"
                            className={`w-full px-4 py-2 border rounded ${
                              childNameError
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                            value={childFormData.fullname}
                            onChange={(e) =>
                              handleChildFormChange("fullname", e.target.value)
                            }
                            disabled={savingChild}
                          />
                          {childNameError && (
                            <p className="text-xs text-red-500 mt-1">
                              {childNameError}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col mb-4 lg:flex-row lg:items-center">
                          <label className="w-full text-gray-700 lg:w-1/5">Gender</label>
                          <select
                            className="w-full p-2 border border-gray-300 rounded"
                            value={childFormData.gender}
                            onChange={(e) =>
                              handleChildFormChange("gender", e.target.value)
                            }
                            disabled={savingChild}
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                        <div className="flex flex-col mb-4 lg:flex-row lg:items-center">
                          <label className="w-full text-gray-700 lg:w-1/5">Date of Birth</label>
                          <input
                            className="w-full p-2 border border-gray-300 rounded"
                            type="date"
                            value={childFormData.dob}
                            onChange={(e) =>
                              handleChildFormChange("dob", e.target.value)
                            }
                            disabled={savingChild}
                          />
                          {dobError && (
                            <p className="text-xs text-red-500 mt-1">
                              {dobError}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowChildForm(false);
                              setIsEditingChild(false);
                              if (!isEditingChild) {
                                setSelectedChildId("");
                              }
                            }}
                            disabled={savingChild}
                            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveChild}
                            disabled={savingChild || submitting}
                            className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 disabled:bg-red-300"
                          >
                            {savingChild ? (
                              <Loader2 className="animate-spin" size={20} />
                            ) : (
                              <Save size={16} />
                            )}
                            <span>
                              {isEditingChild ? "Update Child" : "Save Child"}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Will Come & Address Section */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  Will you come to Durga Sthan to get your Mahaprasad?
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="willCome"
                      value="YES"
                      checked={formData.willCome === "YES"}
                      onChange={(e) =>
                        handleInputChange("willCome", e.target.value)
                      }
                      className="text-red-500 focus:ring-red-500"
                      disabled={submitting}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      YES
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="willCome"
                      value="NO"
                      checked={formData.willCome === "NO"}
                      onChange={(e) =>
                        handleInputChange("willCome", e.target.value)
                      }
                      className="text-red-500 focus:ring-red-500"
                      disabled={submitting}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      NO, Send via courier
                    </span>
                  </label>
                </div>
              </div>

              {formData.willCome === "NO" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Courier/Postal Address
                  </label>
                  <textarea
                    value={formData.courierAddress}
                    onChange={(e) =>
                      handleInputChange("courierAddress", e.target.value)
                    }
                    placeholder="Please write your complete courier/postal address..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                    rows="3"
                    required
                    disabled={submitting}
                  />
                  <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md">
                    Please confirm your address. The courier charge will be
                    calculated based on this address.
                  </p>
                  {isCourierAddressInvalid && (
                    <p className="text-sm font-medium text-orange-800 bg-orange-100 p-3 rounded-md mt-2">
                      The address you mentioned is not eligible for courier
                      service. You will need to collect the Mahaprasad from
                      Shree Durga Sthan.
                    </p>
                  )}
                </div>
              )}

              {/* Donation Items */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="text-red-500" size={20} />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Donation Details
                  </h3>
                </div>
                <div className="space-y-4">
                  {formData.donationItems.map((item, index) => {
                    const availableCategories = getAvailableCategories(index);
                    const filteredCategories = availableCategories.filter(
                      (category) =>
                        category.categoryName
                          .toLowerCase()
                          .includes(categorySearch.toLowerCase())
                    );
                    const isService = item.category
                      .toLowerCase()
                      .includes("service");
                    let placeholder = "Amount";
                    if (item.isDynamic) {
                      placeholder = `Minimum ₹${item.minvalue || 0}`;
                    } else if (isService) {
                      const minAmount =
                        item.unitAmount * (parseInt(item.quantity) || 1);
                      placeholder = `Minimum ₹${minAmount}`;
                    }

                    return (
                      <div
                        key={index}
                        className="bg-gray-50 p-4 rounded-lg border"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium text-gray-700">
                            Item {index + 1}
                          </span>
                          {formData.donationItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDonationItem(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                              disabled={submitting}
                            >
                              <Minus size={16} />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="relative category-dropdown-container">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Category
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownIndex(
                                  openDropdownIndex === index ? null : index
                                );
                                setCategorySearch("");
                                setActiveCategoryIndex(0);
                              }}
                              className="w-full p-2 text-sm border border-gray-300 rounded text-left bg-white flex justify-between items-center"
                              disabled={submitting}
                            >
                              <span className="truncate">
                                {item.category || "Select Category..."}
                              </span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </button>
                            {openDropdownIndex === index && (
                              <div className="absolute z-20 w-full bg-white border rounded-lg shadow-lg mt-1">
                                <div className="p-2 border-b">
                                  <input
                                    type="text"
                                    placeholder="Search categories..."
                                    value={categorySearch}
                                    onChange={(e) => {
                                      setCategorySearch(e.target.value);
                                      setActiveCategoryIndex(0);
                                    }}
                                    onKeyDown={(e) =>
                                      handleCategoryKeyDown(e, index)
                                    }
                                    className="w-full p-1 text-sm border border-gray-300 rounded"
                                    autoFocus
                                  />
                                </div>
                                <ul
                                  ref={categoryDropdownRef}
                                  className="max-h-48 overflow-y-auto"
                                >
                                  {filteredCategories.map(
                                    (category, catIndex) => (
                                      <li
                                        key={category._id}
                                        onClick={() => {
                                          handleDonationItemChange(
                                            index,
                                            "categoryId",
                                            category._id
                                          );
                                          setOpenDropdownIndex(null);
                                        }}
                                        className={`p-2 text-sm hover:bg-red-50 cursor-pointer ${
                                          catIndex === activeCategoryIndex
                                            ? "bg-red-100 active-category-item"
                                            : ""
                                        }`}
                                      >
                                        {category.categoryName}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Quantity
                            </label>
                            <input
                              type="text"
                              value={item.isDynamic ? "" : item.quantity}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (
                                  value === "" ||
                                  (/^\d+$/.test(value) &&
                                    !value.startsWith("0"))
                                ) {
                                  handleDonationItemChange(
                                    index,
                                    "quantity",
                                    value
                                  );
                                }
                              }}
                              onBlur={(e) => {
                                if (
                                  !item.isDynamic &&
                                  (e.target.value === "" ||
                                    parseInt(e.target.value) === 0)
                                ) {
                                  handleDonationItemChange(
                                    index,
                                    "quantity",
                                    1
                                  );
                                }
                              }}
                              className="w-full p-2 text-sm border border-gray-300 rounded"
                              placeholder={
                                item.isDynamic ? "Not Applicable" : "Enter Qty"
                              }
                              required
                              disabled={item.isDynamic || submitting}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Amount (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={item.rate}
                              onChange={(e) =>
                                handleDonationItemChange(
                                  index,
                                  "rate",
                                  e.target.value
                                )
                              }
                              className={`w-full p-2 text-sm border rounded ${
                                item.error
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } ${
                                !item.isDynamic && !isService
                                  ? "bg-gray-100 cursor-not-allowed"
                                  : ""
                              }`}
                              placeholder={placeholder}
                              readOnly={!item.isDynamic && !isService}
                              disabled={
                                submitting || (!item.isDynamic && !isService)
                              }
                            />
                            {item.error && (
                              <p className="text-xs text-red-500 mt-1">
                                {item.error}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={addDonationItem}
                    className="w-full p-3 border-2 border-dashed border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"
                    disabled={submitting}
                  >
                    <Plus size={20} /> Add More Items
                  </button>
                </div>
              </div>

              {/* Summaries */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Mahaprasad Details
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    <li>Your donation is a great help to our community.</li>
                    <li>
                      As a token of gratitude,
                      {formData.willCome === "YES" ||
                      (formData.willCome === "NO" &&
                        isCourierAddressInvalid) ? (
                        <span> you can collect Mahaprasad in-person.</span>
                      ) : (
                        <span> we will send you a packet of Mahaprasad.</span>
                      )}
                    </li>
                  </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    Donation Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Donation:</span>
                      <span className="font-medium">
                        ₹{totals.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Courier Charge:</span>
                      <span className="font-medium">
                        ₹{totals.courierCharge.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-red-200 pt-2 font-semibold">
                      <span className="text-gray-800">Net Payable:</span>
                      <span className="text-red-600 text-lg">
                        ₹{totals.netPayable.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CreditCard size={16} className="text-red-500" /> Payment
                  Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    handleInputChange("paymentMethod", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required
                  disabled={submitting}
                >
                  <option value="Online">Online Payment</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:bg-red-300 disabled:cursor-not-allowed"
                  disabled={submitting || showChildForm}
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>{" "}
                      Processing...
                    </div>
                  ) : (
                    `Submit Donation (₹${totals.netPayable.toFixed(2)})`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DonationModal;
