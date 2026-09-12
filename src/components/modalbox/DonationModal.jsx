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

const emptyDeliveryAddress = {
  currlocation: "",
  country: "",
  state: "",
  district: "",
  city: "",
  postoffice: "",
  pin: "",
  landmark: "",
  street: "",
  apartment: "",
  floor: "",
  room: "",
};

const deliveryLocationOptions = [
  { value: "in_manpur", label: "In Manpur", courierAvailable: false },
  {
    value: "in_gaya_outside_manpur",
    label: "In Gaya outside Manpur",
    courierAvailable: false,
  },
  { value: "in_bihar_outside_gaya", label: "In Bihar outside Gaya" },
  { value: "in_india_outside_bihar", label: "In India outside Bihar" },
  { value: "outside_india", label: "Outside India" },
];

const courierUnavailableLocations = new Set(
  deliveryLocationOptions
    .filter(({ courierAvailable }) => courierAvailable === false)
    .map(({ value }) => value)
);

const deliveryAddressFields = [
  { name: "country", label: "Country", required: true },
  { name: "state", label: "State", required: true },
  { name: "district", label: "District" },
  { name: "city", label: "City", required: true },
  { name: "postoffice", label: "Post Office" },
  { name: "pin", label: "PIN Code", required: true },
  { name: "street", label: "Street Address", required: true },
];

const AnchoredSelect = ({
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
  className = "",
  buttonClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!selectRef.current?.contains(event.target)) setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  return (
    <div ref={selectRef} className={"relative " + className}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={
          "flex w-full items-center justify-between gap-2 bg-white text-left " +
          buttonClassName
        }
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className={
            "truncate " + (selectedOption ? "text-gray-800" : "text-gray-500")
          }
        >
          {selectedOption?.label || placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              onClick={() => {
                if (option.disabled) return;
                onChange(option.value);
                setIsOpen(false);
              }}
              disabled={option.disabled}
              className={
                "block w-full px-3 py-2 text-left text-sm " +
                (option.disabled
                  ? "cursor-not-allowed bg-gray-50 text-gray-400"
                  : value === option.value
                    ? "bg-red-50 font-medium text-red-700"
                    : "text-gray-700 hover:bg-red-50")
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const [minimumCourierDonationAmount, setMinimumCourierDonationAmount] =
    useState(1210);
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
  const [isDeliveryAddressConfirmed, setIsDeliveryAddressConfirmed] =
    useState(false);
  const streetAddressRef = useRef(null);

  // --- States for new features
  const [minTotalWeight, setMinTotalWeight] = useState(0);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0); // For keyboard navigation
  const categoryDropdownRef = useRef(null); // Ref for scrolling

  const { loadUserDonations } = useContext(AppContext);

  const initialFormData = {
    willCome: "",
    prasadType: "",
    deliveryAddress: { ...emptyDeliveryAddress },
    donationItems: [
      {
        categoryId: "",
        categoryCode: "",
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
        minimumAmountPerUnit: false,
        prasadType: "grams",
        packetsPerUnit: 0,
        allowGramAlternativeForInPerson: false,
        configurationVersion: "legacy-v1",
        error: "", // For real-time validation
      },
    ],
    remarks: "",
  };
  const [formData, setFormData] = useState(initialFormData);
  const effectiveDonationMode = donationMode;
  const [totals, setTotals] = useState({
    totalAmount: 0,
    courierCharge: 0,
    netPayable: 0,
  });
  const donationTotal = formData.donationItems.reduce(
    (sum, item) => sum + (parseFloat(item.rate) || 0),
    0
  );
  const mahaprasadEligibleTotal = formData.donationItems.reduce(
    (sum, item) =>
      item.categoryCode === "maa_durga_pratima" || item.prasadType === "none"
        ? sum
        : sum + (parseFloat(item.rate) || 0),
    0
  );
  const hasPacketEligibleCategory = formData.donationItems.some(
    (item) =>
      item.prasadType === "packet" ||
      item.isPacketBased ||
      item.category.toLowerCase().includes("professional")
  );
  const selectedConfiguredItems = formData.donationItems.filter(
    (item) =>
      item.categoryId &&
      (item.categoryCode !== "maa_durga_pratima" || Number(item.rate) > 0)
  );
  const usesOnlyCategoryV2 =
    selectedConfiguredItems.length > 0 &&
    selectedConfiguredItems.every(
      (item) => item.configurationVersion === "category-v2"
    );
  const hasV2GramOption =
    usesOnlyCategoryV2 &&
    selectedConfiguredItems.some(
      (item) =>
        item.prasadType === "grams" ||
        (item.prasadType === "packet" &&
          item.allowGramAlternativeForInPerson)
    );
  const hasV2PacketOption =
    usesOnlyCategoryV2 &&
    selectedConfiguredItems.some((item) => item.prasadType === "packet");
  const isCourierEligible =
    mahaprasadEligibleTotal >= minimumCourierDonationAmount;

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
            fetchPrasadRate(),
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
    calculateTotals();
  }, [
    effectiveDonationMode,
    formData.donationItems,
    formData.willCome,
    formData.deliveryAddress,
    courierCharges,
  ]);

  useEffect(() => {
    if (formData.willCome === "NO") {
      setIsCourierAddressInvalid(
        getMissingDeliveryAddressFields(formData.deliveryAddress).length > 0
      );
    } else {
      setIsCourierAddressInvalid(false);
    }
  }, [formData.deliveryAddress, formData.willCome]);

  useEffect(() => {
    if (effectiveDonationMode === "child") return;

    if (formData.willCome === "NO" && !isCourierEligible) {
      setIsDeliveryAddressConfirmed(false);
      setFormData((prev) => ({
        ...prev,
        willCome: "",
        prasadType: "",
        deliveryAddress: { ...emptyDeliveryAddress },
      }));
    }
  }, [
    effectiveDonationMode,
    formData.willCome,
    isCourierEligible,
  ]);

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
          (cat) =>
            cat.dynamic?.isDynamic &&
            cat.applicableToChildDonation === true
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

        const pratimaCategory = data.categories.find(
          (category) => category.categoryCode === "maa_durga_pratima"
        );
        if (pratimaCategory) {
          setFormData((prev) => ({
            ...prev,
            donationItems: prev.donationItems.some(
              (item) => item.categoryCode === "maa_durga_pratima"
            )
              ? prev.donationItems.map((item) =>
                  item.categoryCode === "maa_durga_pratima"
                    ? createDonationItemForCategory(pratimaCategory)
                    : item
                )
              : [
                  ...prev.donationItems,
                  createDonationItemForCategory(pratimaCategory),
                ],
          }));
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

  const fetchPrasadRate = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/user/prasad-rate`, {
        headers: { utoken: userToken },
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.success && data.rate) {
        setMinimumCourierDonationAmount(
          Number(data.rate.minimumCourierDonationAmount) || 0
        );
      }
    } catch (error) {
      console.error("Error fetching Prasad configuration:", error);
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
  const createDonationItemForCategory = (category) => {
    const item = {
      ...initialFormData.donationItems[0],
      categoryId: category._id,
      categoryCode: category.categoryCode || "",
      category: category.categoryName,
      unitAmount: category.rate || 0,
      unitWeight: category.weight || 0,
      unitPacket: category.packet ? 1 : 0,
      isDynamic:
        category.configurationVersion === "category-v2"
          ? category.amountType === "minimum"
          : category.dynamic?.isDynamic || false,
      minvalue:
        category.configurationVersion === "category-v2"
          ? category.rate || 0
          : category.dynamic?.minvalue || 0,
      minimumAmountPerUnit:
        category.configurationVersion === "category-v2" &&
        category.amountType === "minimum" &&
        Boolean(category.minimumAmountPerUnit),
      prasadType:
        category.configurationVersion === "category-v2"
          ? category.prasadType
          : category.categoryCode === "maa_durga_pratima"
            ? "none"
            : category.packet
              ? "packet"
              : "grams",
      packetsPerUnit: category.packetsPerUnit || 0,
      allowGramAlternativeForInPerson:
        category.configurationVersion === "category-v2" &&
        category.prasadType === "packet" &&
        (category.allowGramAlternativeForInPerson ||
          category.categoryName.toLowerCase().includes("professional")),
      configurationVersion: category.configurationVersion || "legacy-v1",
      isPacket: category.packet || false,
      isPacketBased: category.packet || false,
      error: "",
    };
    const isService = item.category.toLowerCase().includes("service");

    if (isService || item.isDynamic) {
      item.quantity = 1;
      item.rate = "";
    } else {
      item.quantity = "";
      item.rate = 0;
      item.weight = 0;
      item.packet = 0;
    }

    return item;
  };

  const getCategoriesForMode = (mode = effectiveDonationMode) => {
    const regularCategories = categories.filter(
      (category) => category.showInRegularDonation !== false
    );
    return regularCategories.filter((category) => {
      if (mode === "child") {
        return category.applicableToChildDonation === true;
      }
      if (category.availableFor?.length > 0) {
        return category.availableFor.includes("self");
      }
      return true;
    });
  };

  const handleDonationModeChange = (mode) => {
    if (submitting) return;
    const modeCategories = getCategoriesForMode(mode);
    const donationItem =
      modeCategories.length === 1
        ? createDonationItemForCategory(modeCategories[0])
        : { ...initialFormData.donationItems[0] };
    const pratimaCategory = categories.find(
      (category) => category.categoryCode === "maa_durga_pratima"
    );
    const donationItems =
      mode === "self" && pratimaCategory
        ? [donationItem, createDonationItemForCategory(pratimaCategory)]
        : [donationItem];

    setDonationMode(mode);
    setFormData((prev) => ({
      ...prev,
      willCome: "",
      prasadType: "",
      deliveryAddress: { ...emptyDeliveryAddress },
      donationItems,
    }));
    if (mode === "self") {
      setSelectedChildId("");
      setShowChildForm(false);
      setIsEditingChild(false);
      setChildFormData({ _id: null, fullname: "", gender: "", dob: "" });
    }
  };

  const formatDeliveryAddress = (address) =>
    [
      address.room,
      address.floor,
      address.apartment,
      address.street,
      address.landmark,
      address.postoffice,
      address.city,
      address.district,
      address.state,
      address.country,
      address.pin,
    ]
      .filter(Boolean)
      .join(", ");

  const getMissingDeliveryAddressFields = (address) => {
    const requiredFields = [
      "currlocation",
      "country",
      "city",
      "pin",
      "street",
    ];
    const isOutsideIndia = address.currlocation === "outside_india";
    if (!isOutsideIndia) requiredFields.push("state");

    return requiredFields.filter((field) => !address[field]?.trim());
  };

  const getDeliveryPinError = (address) => {
    if (
      address.currlocation !== "outside_india" &&
      address.pin &&
      !/^\d{6}$/.test(address.pin)
    ) {
      return "PIN Code must be exactly 6 digits.";
    }
    return "";
  };

  const isCourierUnavailable = (location) =>
    courierUnavailableLocations.has(location);

  const handleDeliveryAddressChange = (field, value) => {
    const formattedValue =
      field === "pin" ? value : capitalizeEachWord(value);
    setFormData((prev) => ({
      ...prev,
      deliveryAddress: {
        ...prev.deliveryAddress,
        [field]: formattedValue,
      },
    }));
    setIsDeliveryAddressConfirmed(false);
  };

  const handleDeliveryLocationChange = (location) => {
    const locationDefaults = {
      in_manpur: {
        country: "India",
        state: "Bihar",
        district: "Gaya",
        city: "Gaya",
        postoffice: "Buniyadganj",
        pin: "823003",
        street: "Manpur",
      },
      in_gaya_outside_manpur: {
        country: "India",
        state: "Bihar",
        district: "Gaya",
        city: "Gaya",
        postoffice: "",
        pin: "",
        street: "",
      },
      in_bihar_outside_gaya: {
        country: "India",
        state: "Bihar",
        district: "",
        city: "",
        postoffice: "",
        pin: "",
        street: "",
      },
      in_india_outside_bihar: {
        country: "India",
        state: "",
        district: "",
        city: "",
        postoffice: "",
        pin: "",
        street: "",
      },
      outside_india: {
        country: "",
        state: "",
        district: "",
        city: "",
        postoffice: "",
        pin: "",
        street: "",
      },
    };

    setFormData((prev) => ({
      ...prev,
      deliveryAddress: {
        ...emptyDeliveryAddress,
        currlocation: location,
        ...(locationDefaults[location] || {}),
      },
    }));
    setIsDeliveryAddressConfirmed(false);
  };

  const getCourierChargeForUser = () => {
    if (
      effectiveDonationMode === "child" ||
      formData.willCome === "YES" ||
      !formData.deliveryAddress.currlocation ||
      isCourierUnavailable(formData.deliveryAddress.currlocation) ||
      courierCharges.length === 0
    )
      return 0;
    const regionByLocation = {
      in_gaya_outside_manpur: "in_gaya_outside_manpur",
      in_bihar_outside_gaya: "in_bihar_outside_gaya",
      in_india_outside_bihar: "in_india_outside_bihar",
      outside_india: "outside_india",
    };
    const region = regionByLocation[formData.deliveryAddress.currlocation];

    if (!region) return 0;
    return courierCharges.find((charge) => charge.region === region)?.amount || 0;
  };

  const calculateTotals = () => {
    const totalAmount = donationTotal;
    const courierCharge = getCourierChargeForUser();
    const netPayable = totalAmount + courierCharge;
    setTotals({ totalAmount, courierCharge, netPayable });
  };

  const isProfessionalCategory = (category) =>
    category.categoryName.toLowerCase().includes("professional");

  const getAvailableCategories = (currentIndex) => {
    const selectedCategoryIds = formData.donationItems
      .map((item, index) => (index !== currentIndex ? item.categoryId : null))
      .filter(Boolean);
    const available = getCategoriesForMode().filter(
      (cat) => !selectedCategoryIds.includes(cat._id)
    );

    return available.sort((first, second) => {
      const firstIsProfessional = isProfessionalCategory(first);
      const secondIsProfessional = isProfessionalCategory(second);

      if (firstIsProfessional !== secondIsProfessional) {
        return firstIsProfessional ? -1 : 1;
      }

      return first.categoryName.localeCompare(second.categoryName, "en", {
        sensitivity: "base",
      });
    });
  };

  const handleInputChange = (field, value) => {
    if (field === "willCome") setIsDeliveryAddressConfirmed(false);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "willCome" ? { prasadType: "" } : {}),
    }));
  };

  const handleDonationItemChange = (index, field, value) => {
    const updatedItems = [...formData.donationItems];
    let item = { ...updatedItems[index] };

    if (field === "categoryId") {
      const selectedCategory = categories.find((cat) => cat._id === value);
      if (!selectedCategory) return;
      item = createDonationItemForCategory(selectedCategory);
    } else if (field === "quantity") {
      const numericValue = value === "" ? "" : parseInt(value) || 1;

      if (item.minimumAmountPerUnit) {
        item.quantity = numericValue;
        const minAmount =
          item.unitAmount * (parseInt(numericValue, 10) || 1);
        const rateValue = parseFloat(item.rate) || 0;
        item.error =
          rateValue > 0 && rateValue < minAmount
            ? `Amount must be at least ₹${minAmount}.`
            : "";
      } else if (!item.isDynamic) {
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
          minAmount =
            item.minvalue *
            (item.minimumAmountPerUnit
              ? parseInt(item.quantity, 10) || 1
              : 1);
        }

        if (newAmount > 0 && newAmount < minAmount) {
          item.error = `Amount must be at least ₹${minAmount}.`;
        } else {
          item.error = "";
        }
      }
    }

    updatedItems[index] = item;
    setFormData((prev) => ({
      ...prev,
      donationItems: updatedItems,
      ...(field === "categoryId" ? { prasadType: "" } : {}),
    }));
  };

  const addDonationItem = () => {
    setFormData((prev) => ({
      ...prev,
      donationItems: prev.donationItems.some(
        (item) => item.categoryCode === "maa_durga_pratima"
      )
        ? [
            ...prev.donationItems.slice(0, -1),
            { ...initialFormData.donationItems[0] },
            prev.donationItems[prev.donationItems.length - 1],
          ]
        : [
            ...prev.donationItems,
            { ...initialFormData.donationItems[0] },
          ],
      prasadType: "",
    }));
  };

  const removeDonationItem = (index) => {
    if (formData.donationItems.length > 1) {
      setFormData((prev) => ({
        ...prev,
        donationItems: prev.donationItems.filter((_, i) => i !== index),
        prasadType: "",
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
    setIsDeliveryAddressConfirmed(false);
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
              childUser: effectiveDonationMode === "child" ? child : null,
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
    const submittedDonationItems = formData.donationItems.filter(
      (item) =>
        item.categoryId &&
        (item.categoryCode !== "maa_durga_pratima" || Number(item.rate) > 0)
    );
    const isPratimaOnlySubmission =
      submittedDonationItems.length === 1 &&
      submittedDonationItems[0].categoryCode === "maa_durga_pratima";
    if (isDonatingAsWife && !husbandName.trim()) {
      setHusbandNameError("Husband's name is required.");
      return alert("Please enter the husband's name.");
    }
    if (husbandNameError) {
      return alert(husbandNameError);
    }
    if (effectiveDonationMode === "child" && !selectedChildId)
      return alert("Please select a child to donate for.");
    if (showChildForm)
      return alert(
        "Please save or cancel the child details form before submitting the donation."
      );
    if (submittedDonationItems.length === 0)
      return alert(
        "Please select a donation category or enter a Pratima contribution."
      );
    const invalidQuantityItem = submittedDonationItems.find(
      (item) =>
        item.minimumAmountPerUnit &&
        (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)
    );
    if (invalidQuantityItem) {
      return alert(`Please enter a valid quantity for ${invalidQuantityItem.category}.`);
    }
    const requiresFulfillmentMode =
      effectiveDonationMode === "self" &&
      !isPratimaOnlySubmission &&
      mahaprasadEligibleTotal > 0;
    if (
      requiresFulfillmentMode &&
      !["YES", "NO"].includes(formData.willCome)
    ) {
      return alert(
        "Please select in-person collection or courier for Mahaprasad fulfilment."
      );
    }
    if (effectiveDonationMode === "self" && formData.willCome === "NO") {
      if (!isCourierEligible) {
        return alert(
          `Courier delivery is available when the Prasad-eligible donation amount is at least ₹${minimumCourierDonationAmount.toLocaleString("en-IN")}. No-Prasad contributions are excluded.`
        );
      }
      if (isCourierUnavailable(formData.deliveryAddress.currlocation)) {
        return alert(
          "Courier service is not available in Manpur or in Gaya outside Manpur. Please collect your Mahaprasad from Durga Sthan or choose another delivery region."
        );
      }
      const missingAddressFields = getMissingDeliveryAddressFields(
        formData.deliveryAddress
      );
      if (missingAddressFields.length > 0) {
        return alert(
          `Please complete the required delivery address fields: ${missingAddressFields.join(
            ", "
          )}.`
        );
      }
      const deliveryPinError = getDeliveryPinError(formData.deliveryAddress);
      if (deliveryPinError) return alert(deliveryPinError);
      if (!isDeliveryAddressConfirmed) {
        return alert(
          "Please review and confirm that your delivery address is complete and correct."
        );
      }
    }
    if (totals.netPayable <= 0)
      return alert("Donation amount must be greater than zero.");

    const availableInPersonPrasadTypes = usesOnlyCategoryV2
      ? [
          hasV2GramOption ? "HALWA" : null,
          hasV2PacketOption ? "PACKET" : null,
        ].filter(Boolean)
      : hasPacketEligibleCategory
        ? ["HALWA", "PACKET"]
        : ["HALWA"];
    const requiresPrasadSelection =
      effectiveDonationMode === "self" &&
      !isPratimaOnlySubmission &&
      mahaprasadEligibleTotal > 0 &&
      formData.willCome === "YES";
    if (
      requiresPrasadSelection &&
      !availableInPersonPrasadTypes.includes(formData.prasadType)
    ) {
      return alert("Please select a Mahaprasad option for in-person collection.");
    }

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
      const mahaprasadFulfillment =
        effectiveDonationMode === "child" ||
        isPratimaOnlySubmission
          ? { mode: "none", type: "none" }
          : formData.willCome === "NO"
            ? { mode: "courier", type: "packet" }
            : {
                mode: "collection",
                type: formData.prasadType.toLowerCase(),
              };
      const donationData = {
        userId: userProfile._id,
        list: submittedDonationItems.map((item) => ({
          category: item.category,
          number:
            item.isDynamic && !item.minimumAmountPerUnit
              ? 1
              : parseInt(item.quantity) || 0,
          amount: parseFloat(item.rate) || 0,
          isPacket: item.packet > 0,
          quantity: item.weight,
        })),
        amount: totals.netPayable,
        method: "Online",
        courierCharge:
          mahaprasadFulfillment.mode === "courier"
            ? totals.courierCharge
            : 0,
        remarks: formData.remarks || "",
        postalAddress:
          effectiveDonationMode === "child"
            ? formatDeliveryAddress(userProfile.address || {}) ||
              "Address not provided"
            : mahaprasadFulfillment.mode === "courier"
              ? formatDeliveryAddress(formData.deliveryAddress)
              : mahaprasadFulfillment.mode === "collection"
                ? "Will collect from Durga Sthan"
                : isPratimaOnlySubmission
                  ? formatDeliveryAddress(userProfile.address || {}) ||
                    "Address not provided"
                  : "Address not provided",
        deliveryAddress:
          mahaprasadFulfillment.mode === "courier"
            ? formData.deliveryAddress
            : undefined,
        mahaprasadFulfillment,
        totalPrasadWeight: finalTotalWeight,
        donatedAs: effectiveDonationMode,
        donatedFor:
          effectiveDonationMode === "child"
            ? selectedChildId
            : userProfile._id,
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
  const modeCategoryCount = getCategoriesForMode().length;
  const regularDonationItemCount = formData.donationItems.filter(
    (item) => item.categoryCode !== "maa_durga_pratima"
  ).length;
  const pratimaItemIndex = formData.donationItems.findIndex(
    (item) => item.categoryCode === "maa_durga_pratima"
  );
  const pratimaItem = formData.donationItems[pratimaItemIndex];
  const pratimaMinimumAmount = pratimaItem
    ? Number(pratimaItem.minvalue || 0) *
      (pratimaItem.minimumAmountPerUnit
        ? Number.parseInt(pratimaItem.quantity, 10) || 1
        : 1)
    : 0;
  const canReviewDeliveryAddress =
    formData.willCome === "NO" &&
    Boolean(formData.deliveryAddress.currlocation) &&
    !isCourierUnavailable(formData.deliveryAddress.currlocation) &&
    getMissingDeliveryAddressFields(formData.deliveryAddress).length === 0 &&
    !getDeliveryPinError(formData.deliveryAddress);
  const deliveryAddressPreview = formatDeliveryAddress(
    formData.deliveryAddress
  );
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
                  <h2 className="text-2xl font-bold">
                    Make a Donation
                  </h2>
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
                  {effectiveDonationMode === "self" &&
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

                {effectiveDonationMode === "self" ? (
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
                      <AnchoredSelect
                        value={selectedChildId}
                        onChange={handleChildSelect}
                        options={childUsers.map((child) => ({
                          value: child._id,
                          label: child.fullname,
                        }))}
                        placeholder="Select a Child"
                        className="min-w-0 flex-1"
                        buttonClassName="rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-red-500"
                        disabled={submitting || showChildForm}
                      />
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
                          <AnchoredSelect
                            value={childFormData.gender}
                            onChange={(value) =>
                              handleChildFormChange("gender", value)
                            }
                            options={[
                              { value: "male", label: "Male" },
                              { value: "female", label: "Female" },
                            ]}
                            placeholder="Select Gender"
                            className="w-full"
                            buttonClassName="rounded border border-gray-300 p-2"
                            disabled={savingChild}
                          />
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
                    if (item.categoryCode === "maa_durga_pratima") {
                      return null;
                    }
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
                      const minimumAmount =
                        (item.minvalue || 0) *
                        (item.minimumAmountPerUnit
                          ? parseInt(item.quantity, 10) || 1
                          : 1);
                      placeholder = `Minimum ₹${minimumAmount}`;
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
                            {modeCategoryCount === 1 ? (
                              <div
                                className="w-full rounded border border-gray-300 bg-gray-100 p-2 text-sm text-gray-700"
                                aria-readonly="true"
                              >
                                {item.category ||
                                  getCategoriesForMode()[0]?.categoryName}
                              </div>
                            ) : (
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
                            )}
                            {modeCategoryCount > 1 &&
                              openDropdownIndex === index && (
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
                                        <span className="flex items-center justify-between gap-2">
                                          <span>{category.categoryName}</span>
                                          {isProfessionalCategory(
                                            category
                                          ) && (
                                            <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                                              Popular
                                            </span>
                                          )}
                                        </span>
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
                              value={
                                item.isDynamic && !item.minimumAmountPerUnit
                                  ? ""
                                  : item.quantity
                              }
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
                                  (!item.isDynamic ||
                                    item.minimumAmountPerUnit) &&
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
                                item.isDynamic && !item.minimumAmountPerUnit
                                  ? "Not Applicable"
                                  : "Enter Qty"
                              }
                              required
                              disabled={
                                (item.isDynamic &&
                                  !item.minimumAmountPerUnit) ||
                                submitting
                              }
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
                  {effectiveDonationMode === "self" &&
                    pratimaItem && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="font-semibold text-amber-900">
                              Maa Durga Pratima contribution (Optional)
                            </p>
                          </div>
                          <div
                            className={`grid w-full gap-3 ${
                              pratimaItem.minimumAmountPerUnit
                                ? "sm:w-auto sm:grid-cols-[7rem_14rem]"
                                : "sm:w-56"
                            }`}
                          >
                            {pratimaItem.minimumAmountPerUnit && (
                              <div>
                                <label className="mb-1 block text-xs font-medium text-amber-900">
                                  Quantity
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={pratimaItem.quantity}
                                  onChange={(event) =>
                                    handleDonationItemChange(
                                      pratimaItemIndex,
                                      "quantity",
                                      event.target.value
                                    )
                                  }
                                  className="w-full rounded border border-amber-300 bg-white p-2 text-sm"
                                  disabled={submitting}
                                />
                              </div>
                            )}
                            <div>
                              <label className="mb-1 block text-xs font-medium text-amber-900">
                                Contribution amount (₹)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={pratimaItem.rate}
                                onChange={(event) =>
                                  handleDonationItemChange(
                                    pratimaItemIndex,
                                    "rate",
                                    event.target.value
                                  )
                                }
                                placeholder={`Optional · Minimum ₹${pratimaMinimumAmount}`}
                                className={`w-full rounded border bg-white p-2 text-sm ${
                                  pratimaItem.error
                                    ? "border-red-500"
                                    : "border-amber-300"
                                }`}
                                disabled={submitting}
                              />
                            </div>
                          </div>
                        </div>
                        {pratimaItem.error && (
                          <p className="mt-2 text-xs text-red-600">
                            {pratimaItem.error}
                          </p>
                        )}
                      </div>
                    )}
                  {modeCategoryCount > 1 &&
                    regularDonationItemCount < modeCategoryCount && (
                      <button
                        type="button"
                        onClick={addDonationItem}
                        className="w-full p-3 border-2 border-dashed border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"
                        disabled={submitting}
                      >
                        <Plus size={20} /> Add More Items
                      </button>
                    )}
                </div>
              </div>

              {/* Mahaprasad fulfilment depends on the selected donation items. */}
              {effectiveDonationMode === "child" && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-semibold text-amber-900">
                      No Mahaprasad is provided for this donation.
                    </p>
                  </div>
                </div>
              )}

              {effectiveDonationMode === "self" &&
                mahaprasadEligibleTotal > 0 && (
                <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Mahaprasad Fulfilment
                    </h3>
                    <p className="mt-1 text-xs text-gray-600">
                      Choose how you would like to receive Mahaprasad for this
                      donation.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="willCome"
                        value="YES"
                        checked={formData.willCome === "YES"}
                        onChange={(event) =>
                          handleInputChange("willCome", event.target.value)
                        }
                        className="mt-1 text-red-500 focus:ring-red-500"
                        disabled={submitting}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        I will collect it from Durga Sthan
                      </span>
                    </label>
                    <label
                      className={
                        "flex items-start gap-2 " +
                        (isCourierEligible
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-60")
                      }
                    >
                      <input
                        type="radio"
                        name="willCome"
                        value="NO"
                        checked={formData.willCome === "NO"}
                        onChange={(event) =>
                          handleInputChange("willCome", event.target.value)
                        }
                        className="mt-1 text-red-500 focus:ring-red-500"
                        disabled={submitting || !isCourierEligible}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Please send it by courier
                        {!isCourierEligible && (
                          <span className="block text-xs font-normal text-gray-600">
                            Available when the Mahaprasad-eligible donation is
                            at least ₹
                            {minimumCourierDonationAmount.toLocaleString(
                              "en-IN"
                            )}
                            . No-Prasad contributions are excluded.
                          </span>
                        )}
                      </span>
                    </label>
                  </div>

                  {formData.willCome === "YES" &&
                    (usesOnlyCategoryV2 ? (
                      <div className="rounded-md border border-red-100 bg-white p-3">
                        <p className="mb-2 text-sm font-semibold text-gray-700">
                          What would you like to collect?
                        </p>
                        <div className="flex flex-wrap gap-5">
                          {hasV2GramOption && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="prasadType"
                                value="HALWA"
                                checked={formData.prasadType === "HALWA"}
                                onChange={(event) =>
                                  handleInputChange(
                                    "prasadType",
                                    event.target.value
                                  )
                                }
                                disabled={submitting}
                              />
                              <span className="text-sm">
                                Mahaprasad (Halwa)
                              </span>
                            </label>
                          )}
                          {hasV2PacketOption && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="prasadType"
                                value="PACKET"
                                checked={formData.prasadType === "PACKET"}
                                onChange={(event) =>
                                  handleInputChange(
                                    "prasadType",
                                    event.target.value
                                  )
                                }
                                disabled={submitting}
                              />
                              <span className="text-sm">Packet</span>
                            </label>
                          )}
                        </div>
                      </div>
                    ) : hasPacketEligibleCategory ? (
                      <div className="rounded-md border border-red-100 bg-white p-3">
                        <p className="mb-2 text-sm font-semibold text-gray-700">
                          What would you like to collect?
                        </p>
                        <div className="flex flex-wrap gap-5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="prasadType"
                              value="HALWA"
                              checked={formData.prasadType === "HALWA"}
                              onChange={(event) =>
                                handleInputChange(
                                  "prasadType",
                                  event.target.value
                                )
                              }
                              disabled={submitting}
                            />
                            <span className="text-sm">Mahaprasad (Halwa)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="prasadType"
                              value="PACKET"
                              checked={formData.prasadType === "PACKET"}
                              onChange={(event) =>
                                handleInputChange(
                                  "prasadType",
                                  event.target.value
                                )
                              }
                              disabled={submitting}
                            />
                            <span className="text-sm">Packet</span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-md border border-red-100 bg-white p-3">
                        <p className="mb-2 text-sm font-semibold text-gray-700">
                          What would you like to collect?
                        </p>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="prasadType"
                            value="HALWA"
                            checked={formData.prasadType === "HALWA"}
                            onChange={(event) =>
                              handleInputChange(
                                "prasadType",
                                event.target.value
                              )
                            }
                            disabled={submitting}
                          />
                          <span className="text-sm">Mahaprasad (Halwa)</span>
                        </label>
                      </div>
                    ))}

                  {formData.willCome === "NO" && (
                    <>
                      <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                        Courier Prasad is provided as one packet.
                      </p>
                      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Mahaprasad Delivery Address
                        </h4>
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-gray-700">
                            Delivery Region{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <AnchoredSelect
                            value={formData.deliveryAddress.currlocation}
                            onChange={handleDeliveryLocationChange}
                            options={deliveryLocationOptions.map((option) => ({
                              value: option.value,
                              label:
                                option.label +
                                (option.courierAvailable === false
                                  ? " — Courier unavailable"
                                  : ""),
                              disabled: option.courierAvailable === false,
                            }))}
                            placeholder="Select Delivery Region"
                            className="w-full"
                            buttonClassName="rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-red-500"
                            disabled={submitting}
                          />
                        </div>

                        <p className="rounded-md bg-orange-100 p-3 text-sm text-orange-800">
                          Courier service is not available in Manpur or in Gaya
                          outside Manpur. Please collect your Mahaprasad from
                          Durga Sthan if your address is in either region.
                        </p>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {deliveryAddressFields.map(
                            ({ name, label, placeholder, required }) => {
                              const isOutsideIndia =
                                formData.deliveryAddress.currlocation ===
                                "outside_india";
                              const isRequired =
                                required &&
                                !(name === "state" && isOutsideIndia);
                              const fieldLabel =
                                name === "pin" && isOutsideIndia
                                  ? "Zip Code"
                                  : label;

                              return (
                                <div key={name}>
                                  <label className="mb-1 block text-xs font-medium text-gray-600">
                                    {fieldLabel}
                                    {isRequired && (
                                      <span className="text-red-500"> *</span>
                                    )}
                                  </label>
                                  <input
                                    ref={name === "street" ? streetAddressRef : null}
                                    type="text"
                                    value={formData.deliveryAddress[name]}
                                    onChange={(event) => {
                                      const value =
                                        name === "pin" && !isOutsideIndia
                                          ? event.target.value.replace(
                                              /\D/g,
                                              ""
                                            )
                                          : event.target.value;
                                      handleDeliveryAddressChange(name, value);
                                    }}
                                    placeholder={
                                      name === "pin" && !isOutsideIndia
                                        ? "6-digit PIN Code"
                                        : placeholder ||
                                          "Enter " + fieldLabel.toLowerCase()
                                    }
                                    maxLength={
                                      name === "pin"
                                        ? isOutsideIndia
                                          ? 20
                                          : 6
                                        : undefined
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:ring-2 focus:ring-red-500"
                                    required={isRequired}
                                    disabled={submitting}
                                  />
                                  {name === "pin" &&
                                    getDeliveryPinError(
                                      formData.deliveryAddress
                                    ) && (
                                      <p className="mt-1 text-xs text-red-500">
                                        {getDeliveryPinError(
                                          formData.deliveryAddress
                                        )}
                                      </p>
                                    )}
                                </div>
                              );
                            }
                          )}
                        </div>

                        {isCourierAddressInvalid && (
                          <p className="mt-2 rounded-md bg-orange-100 p-3 text-sm font-medium text-orange-800">
                            Please complete all required delivery address
                            fields.
                          </p>
                        )}
                        {canReviewDeliveryAddress && (
                          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <h5 className="flex items-center gap-2 text-sm font-semibold text-green-900">
                                  <MapPin className="h-4 w-4" />
                                  Please review your delivery address
                                </h5>
                                <p className="mt-2 text-sm leading-6 text-gray-800">
                                  {deliveryAddressPreview}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  streetAddressRef.current?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                  });
                                  streetAddressRef.current?.focus();
                                }}
                                className="shrink-0 text-sm font-semibold text-green-800 underline hover:text-green-950"
                                disabled={submitting}
                              >
                                Edit address
                              </button>
                            </div>
                            <label className="mt-3 flex cursor-pointer items-start gap-2 border-t border-green-200 pt-3 text-sm text-green-950">
                              <input
                                type="checkbox"
                                checked={isDeliveryAddressConfirmed}
                                onChange={(event) =>
                                  setIsDeliveryAddressConfirmed(
                                    event.target.checked
                                  )
                                }
                                className="mt-1 h-4 w-4"
                                disabled={submitting}
                              />
                              <span>
                                I confirm that the delivery address above is
                                complete and correct.
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {effectiveDonationMode === "self" &&
                donationTotal > 0 &&
                mahaprasadEligibleTotal === 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">
                      No Mahaprasad is provided for a Pratima-only donation.
                    </p>
                    <p className="mt-1 text-xs text-amber-800">
                      Add a yearly donation category if you would also like to
                      select Mahaprasad fulfilment.
                    </p>
                  </div>
                )}

              {/* Donation Summary */}
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
                  {effectiveDonationMode === "self" && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Courier Charge:</span>
                      <span className="font-medium">
                        ₹{totals.courierCharge.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-red-200 pt-2 font-semibold">
                    <span className="text-gray-800">Net Payable:</span>
                    <span className="text-red-600 text-lg">
                      ₹{totals.netPayable.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CreditCard size={16} className="text-red-500" /> Payment
                  Method
                </label>
                <div className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-700">
                  Online Payment
                </div>
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
