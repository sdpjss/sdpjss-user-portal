
// Helper function to convert numbers to words
const toWords = (num) => {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  if (num === 0) return "Zero";
  let words = "";
  if (Math.floor(num / 10000000) > 0) {
    words += toWords(Math.floor(num / 10000000)) + " Crore ";
    num %= 10000000;
  }
  if (Math.floor(num / 100000) > 0) {
    words += toWords(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }
  if (Math.floor(num / 1000) > 0) {
    words += toWords(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }
  if (Math.floor(num / 100) > 0) {
    words += ones[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }
  if (num >= 20) {
    words += tens[Math.floor(num / 10)] + " ";
    words += ones[num % 10] + " ";
  } else if (num >= 10) {
    words += teens[num - 10] + " ";
  } else if (num > 0) {
    words += ones[num] + " ";
  }
  return words.trim();
};

// Receipt Template Component
const DonationReceiptTemplate = ({ receiptData }) => {
  if (!receiptData) return null;

  const { donation, user, childUser } = receiptData;
  const donorName = childUser ? childUser.fullname : user.fullname;
  const relationship = donation.relationName
    ? `W/O ${donation.relationName}`
    : childUser
      ? `${childUser.gender === "female" ? "D/O" : "S/O"} ${user.fullname}`
      : `${user.gender === "female" ? "D/O" : "S/O"} ${user.fatherName}`;
  const finalTotalAmount = donation.amount;

  return (
    <>
      <style>
        {`@media print {
            body { -webkit-print-color-adjust: exact; }
            .bill-container { box-shadow: none !important; border: none !important;}
          }`}
      </style>
      <div
        style={{
          position: "absolute",
          top: "55%",
          left: "50%",
          width: "60%",
          height: "60%",
          transform: "translate(-50%, -50%)",
          backgroundImage:
            "url(https://res.cloudinary.com/needlesscat/image/upload/v1754307740/logo_unr2rc.jpg)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundSize: "contain",
          opacity: 0.08,
          zIndex: 10,
          pointerEvents: "none",
        }}
      />
      <div
        className="bill-container"
        style={{
          maxWidth: "800px",
          margin: "auto",
          border: "1px solid #ccc",
          padding: "10px 20px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          color: "#333",
          position: "relative",
          backgroundColor: "white",
        }}
      >
        <div
          className="header"
          style={{
            textAlign: "center",
            borderBottom: "2px solid #d32f2f",
            paddingBottom: "10px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              <b>Estd. 1939</b>
            </span>
            <span>
              <b>Reg. No. 2020/272</b>
            </span>
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#d32f2f",
              marginBottom: "1px",
            }}
          >
            SHREE DURGAJI PATWAY JATI SUDHAR SAMITI
          </div>
          <div style={{ marginBottom: "1px", fontSize: "14px" }}>
            Shree Durga Sthan, Patwatoli, Manpur, P.O. Buniyadganj, Gaya Ji -
            823003
          </div>
          <div style={{ fontSize: "12px", color: "#444" }}>
            <strong>PAN:</strong> ABBTS1301C | <strong>Contact:</strong> 0631
            2952160, +91 9472030916 | <strong>Email:</strong>{" "}
            sdpjssmanpur@gmail.com
          </div>
        </div>
        <div
          style={{
            fontSize: "16px",
            fontWeight: 600,
            textAlign: "center",
            margin: "10px 0",
            letterSpacing: "1px",
          }}
        >
          DONATION RECEIPT
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
            fontSize: "12px",
          }}
        >
          <div>
            <strong>Receipt No:</strong> {donation.receiptId}
          </div>
          <div>
            <strong>Date:</strong>{" "}
            {new Date(donation.createdAt || donation.date).toLocaleDateString(
              "en-IN",
              { year: "numeric", month: "long", day: "numeric" }
            )}
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#f9f9f9",
            padding: "10px",
            border: "1px dashed #ddd",
            borderRadius: "8px",
            marginBottom: "12px",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              color: "#d32f2f",
              borderBottom: "1px solid #eee",
              paddingBottom: "5px",
              fontSize: "14px",
              marginBottom: "8px",
            }}
          >
            Donor Details
          </h3>
          <p style={{ fontSize: "12px", margin: "2px 0" }}>
            <strong>Name:</strong> {donorName} {relationship}
          </p>
          <p style={{ fontSize: "12px", margin: "2px 0" }}>
            <strong>Mobile:</strong> {user.contact?.mobileno?.code}{" "}
            {user.contact?.mobileno?.number}
          </p>
          <p style={{ fontSize: "12px", margin: "2px 0" }}>
            <strong>Address:</strong>{" "}
            {donation.postalAddress === "Will collect from Durga Sthan" ||
            donation.postalAddress === "" ? (
              <>
                {user.address?.room ? `Room-${user.address.room}, ` : ""}
                {user.address?.floor ? `Floor-${user.address.floor}, ` : ""}
                {user.address?.apartment ? `${user.address.apartment}, ` : ""}
                {user.address?.landmark ? `${user.address.landmark}, ` : ""}
                {user.address?.street ? `${user.address.street}, ` : ""}
                {user.address?.postoffice
                  ? `PO: ${user.address.postoffice}, `
                  : ""}
                {user.address?.city ? `${user.address.city}, ` : ""}
                {user.address?.district ? `${user.address.district}, ` : ""}
                {user.address?.state ? `${user.address.state}, ` : ""}
                {user.address?.country ? `${user.address.country} ` : ""}
                {user.address?.pin ? `- ${user.address.pin}` : ""}
              </>
            ) : (
              donation.postalAddress
            )}
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#f9f9f9",
            padding: "10px",
            border: "1px dashed #ddd",
            borderRadius: "8px",
            marginBottom: "12px",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              color: "#d32f2f",
              borderBottom: "1px solid #eee",
              paddingBottom: "5px",
              fontSize: "14px",
              marginBottom: "8px",
            }}
          >
            Donation Details
          </h3>
          <p style={{ fontSize: "12px", margin: "2px 0" }}>
            <strong>Amount Donated:</strong> ₹
            {finalTotalAmount.toLocaleString("en-IN")} (
            {toWords(finalTotalAmount)} Rupees Only)
          </p>
          <p style={{ fontSize: "12px", margin: "2px 0" }}>
            <strong>Mode of Payment:</strong> {donation.method}
          </p>
          <p style={{ fontSize: "12px", margin: "2px 0" }}>
            <strong>Date of Donation:</strong>{" "}
            {new Date(donation.createdAt || donation.date).toLocaleDateString(
              "en-IN",
              { year: "numeric", month: "long", day: "numeric" }
            )}
          </p>
          <p style={{ fontSize: "12px", margin: "2px 0" }}>
            <strong>Purpose of Donation:</strong> Durga Puja celebrations and
            societal welfare
          </p>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f9f9f9",
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            marginTop: "15px",
            fontSize: "12px",
          }}
        >
          <div>
            <h3
              style={{
                marginTop: 0,
                color: "#d32f2f",
                borderBottom: "1px solid #eee",
                paddingBottom: "5px",
                fontSize: "14px",
                marginBottom: "8px",
              }}
            >
              Declaration
            </h3>
            <p style={{ margin: "0 0 5px 0" }}>
              This receipt acknowledges the above donation received by{" "}
              <strong>SDPJSS</strong>. We deeply appreciate your support towards
              our cultural and welfare initiatives.
            </p>
          </div>
        </div>
        <div
          style={{
            textAlign: "center",
            marginTop: "1px",
            paddingTop: "1px",
            borderTop: "1px solid #ccc",
            fontSize: "10px",
            color: "#777",
          }}
        >
          <p>
            This is an electronically generated document, hence does not require
            signature.
          </p>
          <p style={{ fontStyle: "italic" }}>
            Generated on {new Date().toLocaleString("en-IN")}. All dates and times are in accordance with {Intl.DateTimeFormat().resolvedOptions().timeZone} time zone.
          </p>
        </div>
      </div>
    </>
  );
};

export default DonationReceiptTemplate;