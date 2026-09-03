import {
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import Select from "react-select";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import TermsAndConditionsModal from "../components/modalbox/TermsAndConditionsModal";

// --- Custom Hook for Persisting State in Session Storage ---
const useSessionStorageState = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      const storedValue = sessionStorage.getItem(key);
      return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error("Error reading from sessionStorage", error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error writing to sessionStorage", error);
    }
  }, [key, value]);

  return [value, setValue];
};

const LoginPage = () => {
  const {
    state,
    setState,
    backendUrl,
    utoken,
    setUToken,
    khandanList,
    loadKhandans,
  } = useContext(AppContext);

  const navigate = useNavigate();
  const recaptchaRef = useRef();

  // --- Common State ---
  const [loading, setLoading] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState(null);

  // --- Login fields ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // --- Registration fields ---
  const [fullname, setFullname] = useSessionStorageState(
    "registrationFullname",
    ""
  );
  const [selectedKhandanId, setSelectedKhandanId] = useState("");
  const [fatherName, setFatherName] = useSessionStorageState(
    "registrationFatherName",
    ""
  );
  const [gender, setGender] = useState("");
  const [dob, setDob] = useSessionStorageState("registrationDob", "");
  const [mobile, setMobile] = useState({ code: "+91", number: "" });
  const [address, setAddress] = useState({
    currlocation: "",
    country: "",
    state: "",
    district: "",
    city: "",
    postoffice: "",
    pin: "",
    street: "",
  });

  // --- Registration flow state (Persisted in Session Storage) ---
  const [registrationStep, setRegistrationStep] = useSessionStorageState(
    "registrationStep",
    1
  );
  const [email, setEmail] = useSessionStorageState("registrationEmail", ""); // Persisted for OTP step
  const [regOtp, setRegOtp] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false); // <-- ADD THIS
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regOtpTimer, setRegOtpTimer] = useState(0);
  const [isResendingRegOtp, setIsResendingRegOtp] = useState(false);

  // --- Forgot Password fields (Persisted in Session Storage) ---
  const [forgotPasswordStep, setForgotPasswordStep] = useSessionStorageState(
    "forgotPasswordStep",
    1
  );
  const [forgotPasswordUsername, setForgotPasswordUsername] =
    useSessionStorageState("forgotPasswordUsername", "");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false); // <-- ADD THIS
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  // --- Forgot Username fields ---
  const [forgotUsernameFullname, setForgotUsernameFullname] = useState("");
  const [forgotUsernameKhandanId, setForgotUsernameKhandanId] = useState("");
  const [forgotUsernameFatherName, setForgotUsernameFatherName] = useState("");
  const [forgotUsernameDob, setForgotUsernameDob] = useState("");

  // --- Real-time Validation Error States ---
  const [nameError, setNameError] = useState("");
  const [fatherNameError, setFatherNameError] = useState("");
  const [dobError, setDobError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [pinError, setPinError] = useState("");
  const [forgotUsernameNameError, setForgotUsernameNameError] = useState("");
  const [forgotUsernameFatherError, setForgotUsernameFatherError] =
    useState("");
  const [forgotUsernameDobError, setForgotUsernameDobError] = useState("");
  const [regPasswordError, setRegPasswordError] = useState("");
  const [, setNewPasswordError] = useState("");

  // --- New State for Terms and Conditions ---
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // --- Effects ---
  useEffect(() => {
    loadKhandans();
  }, []);

  useEffect(() => {
    if (utoken) navigate("/");
  }, [utoken, navigate]);

  // OTP Timers
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  useEffect(() => {
    let interval;
    if (regOtpTimer > 0) {
      interval = setInterval(() => setRegOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [regOtpTimer]);

  // --- Helper & Validation Functions ---
  const capitalizeEachWord = (str) =>
    !str
      ? ""
      : str
          .split(" ")
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(" ");

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatKhandanOption = (khandan) => {
    let displayText = khandan.name;
    if (khandan.address.landmark)
      displayText += `, ${khandan.address.landmark}`;
    if (khandan.address.street) displayText += `, ${khandan.address.street}`;
    displayText += ` (${khandan.khandanid})`;
    return displayText;
  };

  const validateOtp = useCallback((otp) => {
    if (!otp) return "OTP is required";
    if (!/^\d{6}$/.test(otp)) return "OTP must be exactly 6 digits";
    return "";
  }, []);

  const validateName = useCallback((name, fieldName) => {
    if (/\s{2,}/.test(name))
      return `${fieldName} cannot contain multiple spaces.`;
    return "";
  }, []);

  const validateDob = useCallback((dobString) => {
    if (!dobString) return "";
    const dob = new Date(dobString);
    const twelveYearsAgo = new Date();
    twelveYearsAgo.setFullYear(twelveYearsAgo.getFullYear() - 12);
    return dob > twelveYearsAgo
      ? "You must be at least 12 years old to register."
      : "";
  }, []);

  const validateEmail = useCallback((email) => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address.";
    }
    return "";
  }, []);

  const validateMobile = useCallback((number, code) => {
    if (!number) return "";
    if (code === "+91") {
        if (!/^\d{10}$/.test(number)) return "Mobile number must be exactly 10 digits.";
        if (number.startsWith("0")) return "Mobile number should not start with 0.";
    } else {
        if (!/^\d{9,11}$/.test(number)) return "Mobile number must be 9 to 11 digits for international numbers.";
    }
    return "";
  }, []);

  const validatePin = useCallback((pin, location) => {
    if (location === "outside_india") return "";
    if (pin && !/^\d{6}$/.test(pin))
      return "PIN Code must be exactly 6 digits.";
    return "";
  }, []);

  const khandanOptions = useMemo(
    () =>
      khandanList.map((khandan) => ({
        value: khandan._id,
        label: formatKhandanOption(khandan),
      })),
    [khandanList]
  );

  const handleRecaptchaChange = (value) => setRecaptchaValue(value);

  const resetRecaptcha = () => {
    setRecaptchaValue(null);
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  // --- Event Handlers for Input Changes ---
  const handleFullnameChange = (e) => {
    const value = capitalizeEachWord(e.target.value);
    setFullname(value);
    setNameError(validateName(value, "Full Name"));
  };

  const handleFatherNameChange = (e) => {
    const value = capitalizeEachWord(e.target.value);
    setFatherName(value);
    setFatherNameError(validateName(value, "Father's Name"));
  };

  const handleDobChange = (e) => {
    const value = e.target.value;
    setDob(value);
    setDobError(validateDob(value));
  };

  const handleForgotUsernameNameChange = (e) => {
    const value = capitalizeEachWord(e.target.value);
    setForgotUsernameFullname(value);
    setForgotUsernameNameError(validateName(value, "Full Name"));
  };

  const handleForgotUsernameFatherChange = (e) => {
    const value = capitalizeEachWord(e.target.value);
    setForgotUsernameFatherName(value);
    setForgotUsernameFatherError(validateName(value, "Father's Name"));
  };

  const handleForgotUsernameDobChange = (e) => {
    const value = e.target.value;
    setForgotUsernameDob(value);
    setForgotUsernameDobError(validateDob(value));
  };

  const handleLocationChange = (location) => {
    const resetAddress = {
      country: "",
      state: "",
      district: "",
      city: "",
      postoffice: "",
      pin: "",
      street: "",
    };
    setAddress((prev) => ({ ...prev, currlocation: location }));
    setPinError(validatePin(address.pin, location));

    switch (location) {
      case "in_manpur":
        setAddress((prev) => ({
          ...prev,
          ...resetAddress,
          country: "India",
          state: "Bihar",
          district: "Gaya",
          city: "Gaya",
          pin: "823003",
          street: "Manpur",
          postoffice: "Buniyadganj",
        }));
        break;
      case "in_gaya_outside_manpur":
        setAddress((prev) => ({
          ...prev,
          ...resetAddress,
          country: "India",
          state: "Bihar",
          district: "Gaya",
          city: "Gaya",
        }));
        break;
      case "in_bihar_outside_gaya":
        setAddress((prev) => ({
          ...prev,
          ...resetAddress,
          country: "India",
          state: "Bihar",
        }));
        break;
      case "in_india_outside_bihar":
        setAddress((prev) => ({ ...prev, ...resetAddress, country: "India" }));
        break;
      case "outside_india":
        setAddress((prev) => ({ ...prev, ...resetAddress }));
        break;
      default:
        break;
    }
  };

  // --- Flow Reset Functions ---
  const resetRegistrationFlow = () => {
    setState("Login");
    setRegistrationStep(1);
    setFullname("");
    setSelectedKhandanId("");
    setFatherName("");
    setGender("");
    setDob("");
    setEmail("");
    setMobile({ code: "+91", number: "" });
    setAddress({
      currlocation: "",
      country: "",
      state: "",
      district: "",
      city: "",
      postoffice: "",
      pin: "",
      street: "",
    });
    setRegOtp("");
    setRegPassword("");
    setRegConfirmPassword("");
    setRegOtpTimer(0);
    setNameError("");
    setFatherNameError("");
    setDobError("");
    setEmailError("");
    setMobileError("");
    setPinError("");
    resetRecaptcha();
    sessionStorage.removeItem("registrationStep");
    sessionStorage.removeItem("registrationEmail");
    sessionStorage.removeItem("registrationFullname");
    sessionStorage.removeItem("registrationFatherName");
    sessionStorage.removeItem("registrationDob");
  };

  const resetForgotPasswordFlow = () => {
    setForgotPasswordUsername("");
    setOtpCode("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotPasswordStep(1);
    setOtpTimer(0);
    setState("Login");
    resetRecaptcha();
    sessionStorage.removeItem("forgotPasswordStep");
    sessionStorage.removeItem("forgotPasswordUsername");
  };

  const resetForgotUsernameFlow = () => {
    setForgotUsernameFullname("");
    setForgotUsernameKhandanId("");
    setForgotUsernameFatherName("");
    setForgotUsernameDob("");
    setState("Login");
    resetRecaptcha();
  };

  // --- Main Registration/Login Handler ---
  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (
        (state === "Login" ||
          (state === "Register" && registrationStep === 1)) &&
        !recaptchaValue
      ) {
        toast.error("Please complete the reCAPTCHA verification");
        setLoading(false);
        return;
      }

      const recaptchaToken = recaptchaValue;

      if (state === "Register") {
        // --- REGISTRATION STEP 1: Submit Details ---
        if (registrationStep === 1) {
          if (
            nameError ||
            fatherNameError ||
            dobError ||
            emailError ||
            mobileError ||
            pinError
          ) {
            toast.error("Please fix the validation errors before submitting.");
            setLoading(false);
            return;
          }
          if (!email) {
            toast.error("Email is required for OTP verification.");
            setLoading(false);
            return;
          }
          if (!termsAccepted) {
            toast.error("You must agree to the Terms and Conditions.");
            setLoading(false);
            return;
          }

          const { data } = await axios.post(`${backendUrl}/api/user/register`, {
            fullname,
            khandanid: selectedKhandanId,
            fatherName,
            gender,
            dob,
            email,
            mobile,
            address,
            recaptchaToken,
          });

          if (data.success) {
            toast.success(data.message);
            // State updates are batched, so this is safe and will work
            setEmail(data.email || email); // Use email from backend if provided
            setRegistrationStep(2);
            setRegOtpTimer(600);
          } else {
            toast.error(
              data.message || "Registration failed. Please try again."
            );
          }
        }
        // --- REGISTRATION STEP 2: Verify OTP ---
        else if (registrationStep === 2) {
          const otpError = validateOtp(regOtp);
          if (otpError) {
            toast.error(otpError);
            setLoading(false);
            return;
          }
          if (regOtpTimer <= 0) {
            toast.error("OTP has expired. Please request a new one.");
            setLoading(false);
            return;
          }

          const { data } = await axios.post(
            `${backendUrl}/api/user/verify-registration-otp`,
            {
              fullname: fullname.trim(),
              fatherName: fatherName.trim(),
              dob: dob,
              email: email.trim(),
              otp: regOtp.trim(),
            }
          );

          if (data.success) {
            toast.success(data.message);
            setRegistrationStep(3);
            setRegOtp("");
          } else {
            toast.error(data.message || "Invalid OTP. Please try again.");
          }
        }
        // --- REGISTRATION STEP 3: Set Password ---
        else if (registrationStep === 3) {
          if (regPassword !== regConfirmPassword) {
            toast.error("Passwords do not match.");
            setLoading(false);
            return;
          }
          if (regPassword.length < 8) {
            toast.error("Password must be at least 8 characters long.");
            setLoading(false);
            return;
          }

          const { data } = await axios.post(
            `${backendUrl}/api/user/set-initial-password`,
            {
              fullname: fullname.trim(),
              fatherName: fatherName.trim(),
              dob: dob,
              email: email.trim(),
              password: regPassword,
            }
          );

          if (data.success) {
            setUToken(data.token);
            localStorage.setItem("utoken", data.token);
            toast.success(data.message);
            resetRegistrationFlow();
            navigate("/");
          } else {
            toast.error(
              data.message || "Failed to set password. Please try again."
            );
          }
        }
      } else {
        // --- LOGIN ---
        const { data } = await axios.post(`${backendUrl}/api/user/login`, {
          username,
          password,
          recaptchaToken,
        });

        if (data.success) {
          localStorage.setItem("utoken", data.utoken);
          setUToken(data.utoken);
          toast.success("Login successful!");
          navigate("/");
        } else {
          toast.error(
            data.message || "Login failed. Please check your credentials."
          );
        }
      }
      resetRecaptcha();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An unexpected error occurred."
      );
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleResendRegistrationOtp = async () => {
    if (regOtpTimer > 0 || isResendingRegOtp) return;
    setIsResendingRegOtp(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/resend-registration-otp`,
        {
          fullname: fullname.trim(),
          fatherName: fatherName.trim(),
          dob: dob,
          email: email.trim(),
        }
      );

      if (data.success) {
        toast.success("OTP resent successfully");
        setRegOtpTimer(600);
        setRegOtp("");
      } else {
        toast.error(data.message || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Resend OTP Error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to resend OTP. Please try again."
      );
    } finally {
      setIsResendingRegOtp(false);
    }
  };

  // --- Forgot Password Flow Handlers ---
  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    if (!recaptchaValue) {
      return toast.error("Please complete the reCAPTCHA verification");
    }
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/forgot-password`,
        {
          username: forgotPasswordUsername,
          recaptchaToken: recaptchaValue,
        }
      );
      if (data.success) {
        toast.success(data.message);
        setForgotPasswordStep(2);
        setOtpTimer(600);
      } else {
        toast.error(data.message || "Failed to send OTP.");
      }
      resetRecaptcha();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP.");
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const otpError = validateOtp(otpCode);
    if (otpError) {
      toast.error(otpError);
      setLoading(false);
      return;
    }
    if (otpTimer <= 0) {
      toast.error("OTP has expired. Please request a new one.");
      setLoading(false);
      return;
    }
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/verify-otp`, {
        username: forgotPasswordUsername,
        otp: otpCode,
      });
      if (data.success) {
        toast.success(data.message);
        setForgotPasswordStep(3);
      } else {
        toast.error(data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (newPassword.length < 8) {
      return toast.error("Password must be at least 8 characters long");
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/reset-password`,
        {
          username: forgotPasswordUsername,
          newPassword,
        }
      );
      if (data.success) {
        toast.success(data.message);
        resetForgotPasswordFlow();
      } else {
        toast.error(data.message || "Failed to reset password.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0 || isResendingOtp) return;
    setIsResendingOtp(true);
    try {
      // PROPOSED: New dedicated API endpoint for resending OTP
      const { data } = await axios.post(
        `${backendUrl}/api/user/resend-forgot-password-otp`,
        {
          username: forgotPasswordUsername,
        }
      );
      if (data.success) {
        toast.success("OTP resent successfully");
        setOtpTimer(600);
        setOtpCode(""); // Clear previous OTP input
      } else {
        toast.error(data.message || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setIsResendingOtp(false);
    }
  };

  // --- Forgot Username Flow Handler ---
  const handleForgotUsernameRequest = async (e) => {
    e.preventDefault();
    if (
      forgotUsernameNameError ||
      forgotUsernameFatherError ||
      forgotUsernameDobError
    ) {
      return toast.error("Please fix the errors before submitting.");
    }
    if (!recaptchaValue) {
      return toast.error("Please complete the reCAPTCHA verification");
    }
    setLoading(true);
    try {
      const payload = {
        fullname: forgotUsernameFullname,
        khandanid: forgotUsernameKhandanId,
        fatherName: forgotUsernameFatherName,
        dob: forgotUsernameDob,
        recaptchaToken: recaptchaValue,
      };
      const { data } = await axios.post(
        `${backendUrl}/api/user/forgot-username`,
        payload
      );
      if (data.success) {
        toast.success(data.message);
        resetForgotUsernameFlow();
      } else {
        toast.error(data.message || "Failed to recover username.");
      }
      resetRecaptcha();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to recover username."
      );
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  const isSingleKhandan = khandanList.length === 1;

  useEffect(() => {
    if (isSingleKhandan) {
      const singleKhandanId = khandanList[0]._id;
      setSelectedKhandanId(singleKhandanId);
      setForgotUsernameKhandanId(singleKhandanId);
    }
  }, [isSingleKhandan, khandanList]);

  // --- RENDER: Forgot Password Form ---
  if (state === "ForgotPassword") {
    // Determine if the submit button should be disabled for each step
    const isStep1ButtonDisabled =
      loading || !forgotPasswordUsername || !recaptchaValue;
    const isStep2ButtonDisabled = loading || !otpCode || otpCode.length !== 6;
    const isStep3ButtonDisabled =
      loading ||
      !newPassword ||
      newPassword.length < 8 ||
      newPassword !== confirmPassword;

    return (
      <div className="min-h-screen flex items-center justify-center px-2 py-4 sm:px-4 sm:py-8">
        <div className="w-full max-w-md">
          <div className="w-full border border-zinc-500 rounded-md">
            <div className="flex flex-col gap-4 p-4 sm:p-6 rounded-xl text-zinc-600 text-sm">
              <div className="text-center mb-2">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-2">
                  Reset Password
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  {forgotPasswordStep === 1 &&
                    "Enter your username to receive an OTP on your registered email"}
                  {forgotPasswordStep === 2 &&
                    "Enter the OTP sent to your email"}
                  {forgotPasswordStep === 3 && "Enter your new password"}
                </p>
              </div>

              {forgotPasswordStep === 1 && (
                <form
                  onSubmit={handleForgotPasswordRequest}
                  className="flex flex-col gap-4"
                >
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="border border-zinc-300 rounded-lg w-full p-3"
                      type="text"
                      onChange={(e) =>
                        setForgotPasswordUsername(e.target.value)
                      }
                      value={forgotPasswordUsername}
                      required
                      placeholder="Enter your username"
                    />
                  </div>
                  <div className="w-full">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                      onChange={handleRecaptchaChange}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isStep1ButtonDisabled}
                    className="bg-primary hover:bg-primary/90 text-white w-full py-3 px-4 rounded-lg text-base font-medium transition-colors duration-200 shadow-sm disabled:bg-primary/50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Processing..." : "Send OTP"}
                  </button>
                </form>
              )}

              {forgotPasswordStep === 2 && (
                <form
                  onSubmit={handleVerifyOtp}
                  className="flex flex-col gap-4"
                >
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      OTP <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="border border-zinc-300 rounded-lg w-full p-3"
                      type="text"
                      onChange={(e) => setOtpCode(e.target.value)}
                      value={otpCode}
                      required
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">
                        {otpTimer > 0
                          ? `Resend OTP in ${formatTime(otpTimer)}`
                          : "OTP expired"}
                      </span>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={otpTimer > 0 || isResendingOtp}
                        className="text-primary hover:text-primary/80 underline text-sm font-medium disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                      >
                        {isResendingOtp ? "Sending..." : "Resend OTP"}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isStep2ButtonDisabled}
                    className="bg-primary hover:bg-primary/90 text-white w-full py-3 px-4 rounded-lg text-base font-medium transition-colors duration-200 shadow-sm disabled:bg-primary/50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Processing..." : "Verify OTP"}
                  </button>
                </form>
              )}

              {forgotPasswordStep === 3 && (
                <form
                  onSubmit={handleResetPassword}
                  className="flex flex-col gap-4"
                >
                  <div className="w-full relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="border border-zinc-300 rounded-lg w-full p-3 pr-10"
                      type={showNewPassword ? "text" : "password"}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewPassword(value);
                        if (value.length > 0 && value.length < 8) {
                          setNewPasswordError(
                            "Password must be at least 8 characters long."
                          );
                        } else {
                          setNewPasswordError("");
                        }
                      }}
                      value={newPassword}
                      required
                      placeholder="Enter new password (min 8 characters)"
                      minLength="8"
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer top-7"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="w-full relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="border border-zinc-300 rounded-lg w-full p-3 pr-10"
                      type={showConfirmPassword ? "text" : "password"}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      value={confirmPassword}
                      required
                      placeholder="Confirm your new password"
                      minLength="8"
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer top-7"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    {newPassword &&
                      confirmPassword &&
                      newPassword !== confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">
                          Passwords do not match
                        </p>
                      )}
                  </div>
                  <button
                    type="submit"
                    disabled={isStep3ButtonDisabled}
                    className="bg-primary hover:bg-primary/90 text-white w-full py-3 px-4 rounded-lg text-base font-medium transition-colors duration-200 shadow-sm disabled:bg-primary/50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Processing..." : "Reset Password"}
                  </button>
                </form>
              )}

              <div className="text-center text-sm mt-4">
                <span
                  onClick={resetForgotPasswordFlow}
                  className="text-primary hover:text-primary/80 underline cursor-pointer font-medium"
                >
                  Back to Login
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: Forgot Username Form ---
  if (state === "ForgotUsername") {
    const isButtonDisabled =
      loading ||
      forgotUsernameNameError ||
      forgotUsernameFatherError ||
      forgotUsernameDobError ||
      !forgotUsernameFullname ||
      !forgotUsernameKhandanId ||
      !forgotUsernameFatherName ||
      !forgotUsernameDob ||
      !recaptchaValue;
    return (
      <div className="min-h-screen flex items-center justify-center px-2 py-4 sm:px-4 sm:py-8">
        <div className="w-full max-w-lg">
          <form
            onSubmit={handleForgotUsernameRequest}
            className="w-full border border-zinc-500 rounded-md"
          >
            <div className="flex flex-col gap-4 p-4 sm:p-6 rounded-xl text-zinc-600 text-sm">
              <div className="text-center mb-2">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-2">
                  Recover Username
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Enter your details to find your account.
                </p>
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="border border-zinc-300 rounded-lg w-full p-3"
                  type="text"
                  onChange={handleForgotUsernameNameChange}
                  value={forgotUsernameFullname}
                  required
                  placeholder="Enter your full name"
                />
                {forgotUsernameNameError && (
                  <p className="text-red-500 text-xs mt-1">
                    {forgotUsernameNameError}
                  </p>
                )}
              </div>
              {!isSingleKhandan && (
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Khandan <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={khandanOptions}
                    onChange={(option) =>
                      setForgotUsernameKhandanId(option ? option.value : "")
                    }
                    value={khandanOptions.find(
                      (opt) => opt.value === forgotUsernameKhandanId
                    )}
                    isClearable
                    placeholder="Search and Select Khandan"
                    required
                  />
                </div>
              )}
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Father's Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="border border-zinc-300 rounded-lg w-full p-3"
                  type="text"
                  onChange={handleForgotUsernameFatherChange}
                  value={forgotUsernameFatherName}
                  required
                  placeholder="Enter your father's full name"
                />
                {forgotUsernameFatherError && (
                  <p className="text-red-500 text-xs mt-1">
                    {forgotUsernameFatherError}
                  </p>
                )}
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  className="border border-zinc-300 rounded-lg w-full p-3"
                  type="date"
                  onChange={handleForgotUsernameDobChange}
                  value={forgotUsernameDob}
                  required
                />
                {forgotUsernameDobError && (
                  <p className="text-red-500 text-xs mt-1">
                    {forgotUsernameDobError}
                  </p>
                )}
              </div>
              <div className="w-full">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={handleRecaptchaChange}
                />
              </div>
              <button
                type="submit"
                disabled={isButtonDisabled}
                className="bg-primary hover:bg-primary/90 text-white w-full py-3 px-4 rounded-lg text-base font-medium transition-colors duration-200 shadow-sm disabled:bg-primary/50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Recover Username"}
              </button>
              <div className="text-center text-sm mt-2">
                <span
                  onClick={resetForgotUsernameFlow}
                  className="text-primary hover:text-primary/80 underline cursor-pointer font-medium"
                >
                  Back to Login
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: Main Login/Register Form ---
  // Determine button disabled state for each form/step
  const isLoginDisabled = loading || !username || !password || !recaptchaValue;
  const isRegStep1Disabled =
    loading ||
    nameError ||
    fatherNameError ||
    dobError ||
    emailError ||
    mobileError ||
    pinError ||
    !fullname ||
    !selectedKhandanId ||
    !fatherName ||
    !gender ||
    !dob ||
    !recaptchaValue ||
    !termsAccepted;
  const isRegStep2Disabled = loading || !regOtp || regOtp.length !== 6;
  const isRegStep3Disabled =
    loading ||
    !regPassword ||
    regPassword.length < 8 ||
    regPassword !== regConfirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center px-2 py-4 sm:px-4 sm:py-8">
      <div className="w-full max-w-lg">
        <form
          onSubmit={onSubmitHandler}
          className="w-full border border-zinc-500 rounded-md"
        >
          <div className="flex flex-col gap-4 p-4 sm:p-6 rounded-xl text-zinc-600 text-sm">
            <div className="text-center mb-2">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-2">
                {state === "Register" ? "User Registration" : "User Login"}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {state === "Login" && "Please login to continue."}
                {state === "Register" &&
                  registrationStep === 1 &&
                  "Fill in your details to begin."}
                {state === "Register" &&
                  registrationStep === 2 &&
                  `Enter the OTP sent to ${email}.`}
                {state === "Register" &&
                  registrationStep === 3 &&
                  "Create a secure password for your account."}
              </p>
            </div>
            {state === "Register" ? (
              <>
                {registrationStep === 1 && (
                  <>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="border border-zinc-300 rounded-lg w-full p-3"
                        type="text"
                        onChange={handleFullnameChange}
                        value={fullname}
                        required
                        placeholder="Enter your full name"
                      />
                      {nameError && (
                        <p className="text-red-500 text-xs mt-1">{nameError}</p>
                      )}
                    </div>
                    {!isSingleKhandan && (
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Khandan <span className="text-red-500">*</span>
                        </label>
                        <Select
                          options={khandanOptions}
                          onChange={(option) =>
                            setSelectedKhandanId(option ? option.value : "")
                          }
                          value={khandanOptions.find(
                            (opt) => opt.value === selectedKhandanId
                          )}
                          isClearable
                          placeholder="Search and Select Khandan"
                          required
                        />
                      </div>
                    )}
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Father's Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="border border-zinc-300 rounded-lg w-full p-3"
                        type="text"
                        onChange={handleFatherNameChange}
                        value={fatherName}
                        required
                        placeholder="Enter your father's full name"
                      />
                      {fatherNameError && (
                        <p className="text-red-500 text-xs mt-1">
                          {fatherNameError}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="border border-zinc-300 rounded-lg w-full p-3"
                          onChange={(e) => setGender(e.target.value)}
                          value={gender}
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <input
                          className="border border-zinc-300 rounded-lg w-full p-3"
                          type="date"
                          onChange={handleDobChange}
                          value={dob}
                          required
                        />
                        {dobError && (
                          <p className="text-red-500 text-xs mt-1">
                            {dobError}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="w-full">
                      <h3 className="text-lg font-medium text-gray-800 my-2">
                        Contact Information
                      </h3>
                      <div className="w-full mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                          <span className="text-sm text-gray-500 ml-2">
                            (Verification Code will be sent here.)
                          </span>
                        </label>
                        <input
                          className="border border-zinc-300 rounded-lg w-full p-3"
                          type="email"
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setEmailError(validateEmail(e.target.value));
                          }}
                          value={email}
                          placeholder="Enter your email address"
                        />
                        {emailError && (
                          <p className="text-red-500 text-xs mt-1">
                            {emailError}
                          </p>
                        )}
                      </div>
                      <div className="w-full mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            className="border border-zinc-300 rounded-lg p-3 w-20"
                            type="text"
                            value={mobile.code}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (!val.startsWith("+"))
                                val = "+" + val.replace(/\+/g, "");
                              if (val.length > 4) val = val.substring(0, 4);
                              setMobile((prev) => ({
                                ...prev,
                                code: val.replace(/[^0-9+]/g, ""),
                              }));
                              setMobileError(validateMobile(mobile.number, val));
                            }}
                          />
                          <input
                            className="border border-zinc-300 rounded-lg flex-1 p-3"
                            type="tel"
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              setMobile((prev) => ({ ...prev, number: value }));
                              setMobileError(validateMobile(value, mobile.code));
                            }}
                            value={mobile.number}
                            placeholder={mobile.code === "+91" ? "10-digit number" : "Maximum 11-digit number"}
                            pattern={mobile.code === "+91" ? "[0-9]{10}" : "[0-9]{9,11}"}
                            maxLength={mobile.code === "+91" ? "10" : "11"}
                          />
                        </div>
                        {mobileError && (
                          <p className="text-red-500 text-xs mt-1">
                            {mobileError}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="w-full">
                      <h3 className="text-lg font-medium text-gray-800 my-2">
                        Address Information
                      </h3>
                      <div className="w-full mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Location{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="border border-zinc-300 rounded-lg w-full p-3"
                          onChange={(e) => handleLocationChange(e.target.value)}
                          value={address.currlocation}
                          required
                        >
                          <option value="">Select Current Location</option>
                          <option value="in_manpur">In Manpur</option>
                          <option value="in_gaya_outside_manpur">
                            In Gaya outside Manpur
                          </option>
                          <option value="in_bihar_outside_gaya">
                            In Bihar outside Gaya
                          </option>
                          <option value="in_india_outside_bihar">
                            In India outside Bihar
                          </option>
                          <option value="outside_india">Outside India</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="w-full">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country <span className="text-red-500">*</span>
                          </label>
                          <input
                            className="border border-zinc-300 rounded-lg w-full p-3"
                            type="text"
                            onChange={(e) =>
                              setAddress((prev) => ({
                                ...prev,
                                country: capitalizeEachWord(e.target.value),
                              }))
                            }
                            value={address.country}
                            required
                            placeholder="Country"
                          />
                        </div>
                        <div className="w-full">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State {address.currlocation === "outside_india"
                              ? ""
                              : <span className="text-red-500">*</span>}
                          </label>
                          <input
                            className="border border-zinc-300 rounded-lg w-full p-3"
                            type="text"
                            onChange={(e) =>
                              setAddress((prev) => ({
                                ...prev,
                                state: capitalizeEachWord(e.target.value),
                              }))
                            }
                            value={address.state || ""}
                            required={address.currlocation === "outside_india" ? false : true}
                            placeholder={address.currlocation === "outside_india" ? "State/Province" : "State"}
                          />
                        </div>
                        <div className="w-full">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            District
                          </label>
                          <input
                            className="border border-zinc-300 rounded-lg w-full p-3"
                            type="text"
                            onChange={(e) =>
                              setAddress((prev) => ({
                                ...prev,
                                district: capitalizeEachWord(e.target.value),
                              }))
                            }
                            value={address.district}
                            placeholder="District"
                          />
                        </div>
                        <div className="w-full">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City <span className="text-red-500">*</span>
                          </label>
                          <input
                            className="border border-zinc-300 rounded-lg w-full p-3"
                            type="text"
                            onChange={(e) =>
                              setAddress((prev) => ({
                                ...prev,
                                city: capitalizeEachWord(e.target.value),
                              }))
                            }
                            value={address.city}
                            required
                            placeholder="City"
                          />
                        </div>
                        <div className="w-full">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Post Office
                          </label>
                          <input
                            className="border border-zinc-300 rounded-lg w-full p-3"
                            type="text"
                            onChange={(e) =>
                              setAddress((prev) => ({
                                ...prev,
                                postoffice: capitalizeEachWord(e.target.value),
                              }))
                            }
                            value={address.postoffice}
                            placeholder="Post Office"
                          />
                        </div>
                        <div className="w-full">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {address.currlocation === "outside_india"
                              ? "Zip Code"
                              : "PIN Code"}{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            className="border border-zinc-300 rounded-lg w-full p-3"
                            type="text"
                            onChange={(e) => {
                              let value = e.target.value;
                              // For Indian locations, only allow digits
                              if (address.currlocation !== "outside_india") {
                                value = value.replace(/\D/g, "");
                              }
                              setAddress((prev) => ({
                                ...prev,
                                pin: value,
                              }));
                              setPinError(
                                validatePin(value, address.currlocation)
                              );
                            }}
                            value={address.pin}
                            required
                            placeholder={
                              address.currlocation === "outside_india"
                                ? "Zip Code"
                                : "6-digit PIN Code"
                            }
                            maxLength={
                              address.currlocation === "outside_india" ? 20 : 6
                            }
                          />
                          {pinError && (
                            <p className="text-red-500 text-xs mt-1">
                              {pinError}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="w-full mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          className="border border-zinc-300 rounded-lg w-full p-3"
                          type="text"
                          onChange={(e) =>
                            setAddress((prev) => ({
                              ...prev,
                              street: capitalizeEachWord(e.target.value),
                            }))
                          }
                          value={address.street}
                          required
                          placeholder="Street Address"
                        />
                      </div>
                    </div>
                    <div className="w-full flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-600">
                        I agree to the{" "}
                        <span
                          onClick={() => setIsTermsModalOpen(true)}
                          className="text-primary hover:text-primary/80 underline cursor-pointer font-medium"
                        >
                          Terms and Conditions
                        </span>
                        <span className="text-red-500">*</span>
                      </label>
                    </div>
                  </>
                )}
                {registrationStep === 2 && (
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      OTP <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="border border-zinc-300 rounded-lg w-full p-3"
                      type="text"
                      onChange={(e) => {
                        // Only allow numbers and limit to 6 digits
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);
                        setRegOtp(value);
                      }}
                      value={regOtp}
                      required
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                      pattern="[0-9]{6}"
                    />

                    {/* Show OTP validation error */}
                    {regOtp && validateOtp(regOtp) && (
                      <p className="text-red-500 text-xs mt-1">
                        {validateOtp(regOtp)}
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">
                        {regOtpTimer > 0
                          ? `Resend OTP in ${formatTime(regOtpTimer)}`
                          : "OTP expired - Please request a new one"}
                      </span>
                      <button
                        type="button"
                        onClick={handleResendRegistrationOtp}
                        disabled={regOtpTimer > 0 || isResendingRegOtp}
                        className="text-primary hover:text-primary/80 underline text-sm font-medium disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                      >
                        {isResendingRegOtp ? "Sending..." : "Resend OTP"}
                      </button>
                    </div>
                    <div className="text-center mt-4">
                      <span
                        onClick={resetRegistrationFlow}
                        className="text-sm text-zinc-500 hover:text-primary underline cursor-pointer"
                      >
                        Start Over
                      </span>
                    </div>
                  </div>
                )}
                {registrationStep === 3 && (
                  <>
                    <div className="w-full relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="border border-zinc-300 rounded-lg w-full p-3 pr-10"
                        type={showRegPassword ? "text" : "password"}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRegPassword(value);
                          if (value.length > 0 && value.length < 8) {
                            setRegPasswordError(
                              "Password must be at least 8 characters long."
                            );
                          } else {
                            setRegPasswordError("");
                          }
                        }}
                        value={regPassword}
                        required
                        placeholder="Enter new password (min 8 characters)"
                        minLength="8"
                      />
                      <div
                        className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer top-7"
                        onClick={() => setShowRegPassword((prev) => !prev)}
                      >
                        {showRegPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    {regPasswordError && (
                      <p className="text-red-500 text-xs mt-1">
                        {regPasswordError}
                      </p>
                    )}
                    <div className="w-full relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="border border-zinc-300 rounded-lg w-full p-3 pr-10"
                        type={showRegConfirmPassword ? "text" : "password"}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        value={regConfirmPassword}
                        required
                        placeholder="Confirm your new password"
                        minLength="8"
                      />
                      <div
                        className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer top-7"
                        onClick={() =>
                          setShowRegConfirmPassword((prev) => !prev)
                        }
                      >
                        {showRegConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      {regPassword &&
                        regConfirmPassword &&
                        regPassword !== regConfirmPassword && (
                          <p className="text-red-500 text-xs mt-1">
                            Passwords do not match
                          </p>
                        )}
                    </div>
                    <div className="text-center mt-4">
                      <span
                        onClick={resetRegistrationFlow}
                        className="text-sm text-zinc-500 hover:text-primary underline cursor-pointer"
                      >
                        Start Over
                      </span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="border border-zinc-300 rounded-lg w-full p-3"
                    type="text"
                    onChange={(e) => setUsername(e.target.value)}
                    value={username}
                    required
                    placeholder="Enter your username"
                  />
                </div>
                <div className="w-full relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="border border-zinc-300 rounded-lg w-full p-3 pr-10"
                    type={showPassword ? "text" : "password"}
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    required
                    placeholder="Enter your password"
                  />
                  <div
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer top-7"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-right">
                  <span
                    onClick={() => setState("ForgotUsername")}
                    className="text-primary hover:text-primary/80 underline cursor-pointer text-sm font-medium"
                  >
                    Forgot Username?
                  </span>
                  <span
                    onClick={() => setState("ForgotPassword")}
                    className="text-primary hover:text-primary/80 underline cursor-pointer text-sm font-medium"
                  >
                    Forgot Password?
                  </span>
                </div>
              </>
            )}

            {/* reCAPTCHA for Login and Registration Step 1 */}
            {(state === "Login" ||
              (state === "Register" && registrationStep === 1)) && (
              <div className="w-full">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={handleRecaptchaChange}
                />
              </div>
            )}

            {/* Dynamic Buttons */}
            {state === "Login" && (
              <button
                type="submit"
                disabled={isLoginDisabled}
                className="bg-primary hover:bg-primary/90 text-white w-full py-3 px-4 rounded-lg text-base font-medium transition-colors duration-200 shadow-sm disabled:bg-primary/50 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            )}
            {state === "Register" && registrationStep === 1 && (
              <button
                type="submit"
                disabled={isRegStep1Disabled}
                className="bg-primary hover:bg-primary/90 text-white w-full py-3 px-4 rounded-lg text-base font-medium transition-colors duration-200 shadow-sm disabled:bg-primary/50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Continue"}
              </button>
            )}
            {state === "Register" && registrationStep === 2 && (
              <button
                type="submit"
                disabled={isRegStep2Disabled}
                className="bg-primary hover:bg-primary/90 text-white w-full py-3 px-4 rounded-lg text-base font-medium transition-colors duration-200 shadow-sm disabled:bg-primary/50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            )}
            {state === "Register" && registrationStep === 3 && (
              <button
                type="submit"
                disabled={isRegStep3Disabled}
                className="bg-primary hover:bg-primary/90 text-white w-full py-3 px-4 rounded-lg text-base font-medium transition-colors duration-200 shadow-sm disabled:bg-primary/50 disabled:cursor-not-allowed"
              >
                {loading ? "Completing..." : "Set Password & Login"}
              </button>
            )}

            {/* Toggle between Login and Register */}
            <div className="text-center text-sm">
              {state === "Register" ? (
                <>
                  Already have an account?{" "}
                  <span
                    onClick={resetRegistrationFlow}
                    className="text-primary hover:text-primary/80 underline cursor-pointer font-medium"
                  >
                    Login here
                  </span>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <span
                    onClick={() => setState("Register")}
                    className="text-primary hover:text-primary/80 underline cursor-pointer font-medium"
                  >
                    Register here
                  </span>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
      {/* --- Render the Modal Component Here --- */}
      <TermsAndConditionsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />
    </div>
  );
};

export default LoginPage;
