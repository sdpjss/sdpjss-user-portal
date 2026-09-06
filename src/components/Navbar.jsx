import { useContext, useEffect, useRef, useState } from "react";
import { assets } from "../assets/assets";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { useDonationFlow } from "../context/DonationFlowContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { setState, utoken, setUToken, userData } =
    useContext(AppContext);
  const { openDonation } = useDonationFlow();

  const [showMenu, setShowMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);
  // const [token, setToken] = useState(true);

  const logout = () => {
    setUToken(false);
    localStorage.removeItem("utoken");
    navigate("/");
  };

  useEffect(() => {
    const closeAccountMenu = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener("pointerdown", closeAccountMenu);
    return () => document.removeEventListener("pointerdown", closeAccountMenu);
  }, []);

  return (
    <div className="flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400">
      <img
        onClick={() => navigate("/")}
        className="w-44 cursor-pointer"
        src={assets.logo}
        alt=""
      />

      <div className="hidden lg:inline-flex bg-[#f5f5f0] py-2 px-4 rounded-full gap-6 text-sm">
        <NavLink
          to="/"
          className="text-gray-600 hover:text-[#CC5500] transition-colors"
        >
          HOME
        </NavLink>
        <NavLink
          to={"/about"}
          className="text-gray-600 hover:text-[#CC5500] transition-colors"
        >
          ABOUT
        </NavLink>
        <NavLink
          to="/team"
          className="text-gray-600 hover:text-[#CC5500] transition-colors"
        >
          TEAM
        </NavLink>
        <NavLink
          to="/contact"
          className="text-gray-600 hover:text-[#CC5500] transition-colors"
        >
          CONTACT US
        </NavLink>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={openDonation}
          className="hidden lg:block rounded-full bg-primary px-5 py-2.5 font-medium text-white hover:bg-red-700"
        >
          Donate Now
        </button>
        <div className="hidden lg:block">
          {utoken ? (
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowAccountMenu((current) => !current)}
                className="flex items-center gap-2 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Open account menu"
                aria-expanded={showAccountMenu}
              >
                <img
                  className="w-8 h-8 rounded-full border-2 border-purple-200"
                  src={userData?.image}
                  alt=""
                />
                <img className="w-2.5" src={assets.dropdown_icon} alt="" />
              </button>
              {showAccountMenu && (
                <div className="absolute right-0 top-full z-30 mt-2 min-w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/user-portal/profile");
                      setShowAccountMenu(false);
                    }}
                    className="block w-full px-4 py-2.5 text-left hover:bg-gray-50"
                  >
                    My Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/user-portal/donations");
                      setShowAccountMenu(false);
                    }}
                    className="block w-full px-4 py-2.5 text-left hover:bg-gray-50"
                  >
                    Donation History
                  </button>
                  <div className="my-1 border-t border-gray-200" />
                  <button
                    type="button"
                    onClick={logout}
                    className="block w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                setState("Login");
                navigate("/login");
              }}
              className="bg-primary text-white px-8 py-3 rounded-full font-light hidden lg:block"
            >
              Login
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowMenu(true)}
          className="p-2 lg:hidden"
          aria-label="Open navigation menu"
        >
          <img className="w-6" src={assets.menu_icon} alt="" />
        </button>
        {/* Mobile Menu */}
        <div
          className={`${
            showMenu ? "fixed w-full" : "h-0 w-0"
          } lg:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}
        >
          <div className="flex items-center justify-between px-5 py-6">
            <img className="w-36" src={assets.logo} alt="" />
            <button
              type="button"
              onClick={() => setShowMenu(false)}
              className="p-2"
              aria-label="Close navigation menu"
            >
              <img className="w-7" src={assets.cross_icon} alt="" />
            </button>
          </div>
          <ul className="flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium">
            <div className="mb-3 flex w-full flex-col items-center gap-2 border-b border-gray-200 pb-4">
              <button
                type="button"
                onClick={() => {
                  openDonation();
                  setShowMenu(false);
                }}
                className="w-full max-w-xs rounded-full bg-primary px-8 py-3 font-medium text-white"
              >
                Donate Now
              </button>
              {utoken && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/user-portal/profile");
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 rounded hover:bg-gray-100"
                  >
                    My Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/user-portal/donations");
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 rounded hover:bg-gray-100"
                  >
                    Donation History
                  </button>
                </>
              )}
            </div>
            <NavLink onClick={() => setShowMenu(false)} to="/">
              <p className="px-4 py-2 rounded inline-block">HOME</p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to="/about">
              <p className="px-4 py-2 rounded inline-block">ABOUT</p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to="/team">
              <p className="px-4 py-2 rounded inline-block">TEAM</p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to="/contact">
              <p className="px-4 py-2 rounded inline-block">CONTACT US</p>
            </NavLink>

            {/* Mobile Login/User Menu */}
            {utoken ? (
              <div className="flex flex-col items-center gap-2 mt-4 pt-4 border-t border-gray-200 w-full">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 rounded hover:bg-gray-100 text-red-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="mt-4 pt-4 flex flex-col items-center gap-3 border-t border-gray-200 w-full">
                <button
                  onClick={() => {
                    setState("Login");
                    navigate("/login");
                    setShowMenu(false);
                  }}
                  className="bg-primary text-white px-8 py-3 rounded-full font-light w-full max-w-xs"
                >
                  Login
                </button>
              </div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
