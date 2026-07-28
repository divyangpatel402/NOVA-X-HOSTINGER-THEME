"use client";

import { useEffect, useState, useRef, use } from "react";

export default function PayPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [qr, setQr] = useState("");
  const [upiIntent, setUpiIntent] = useState("#");
  const [amount, setAmount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180);
  const [status, setStatus] = useState<"waiting" | "success" | "rejected" | "expired">("waiting");
  const [qrLoading, setQrLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Coupon states
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState(0);

  // Fetch QR on mount
  useEffect(() => {
    fetchQR();
    startTimer();
    pollRef.current = setInterval(pollStatus, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchQR(couponCode = "") {
    setQrLoading(true);
    try {
      const res = await fetch("/api/gateway-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, couponCode }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setQr(data.qr);
      setUpiIntent(data.upi);
      setAmount(data.amount);
      setQrLoading(false);

      if (data.couponApplied) {
        setAppliedCoupon(data.couponCode);
        setDiscountPercentage(data.discount);
        if (couponCode) {
          toast(`Coupon applied! ${data.discount}% discount.`);
        }
      } else if (couponCode) {
        toast(data.couponError || "Invalid coupon code.");
      }
    } catch (err) {
      toast("Error generating QR code");
      console.error(err);
    }
  }

  function startTimer() {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          clearInterval(pollRef.current!);
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function pollStatus() {
    try {
      const res = await fetch(`/api/order-status/${orderId}`);
      const data = await res.json();
      if (data.status === "APPROVED" || data.paymentVerified) {
        clearInterval(pollRef.current!);
        clearInterval(timerRef.current!);
        setStatus("success");
      } else if (data.status === "REJECTED") {
        clearInterval(pollRef.current!);
        clearInterval(timerRef.current!);
        setStatus("rejected");
      }
    } catch (err) {
      console.error(err);
    }
  }

  function copyUPI() {
    navigator.clipboard.writeText("novaxsto@slc");
    toast("UPI ID Copied!");
  }

  function toast(msg: string) {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  const m = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const s = (timeLeft % 60).toString().padStart(2, "0");

  if (status === "success") {
    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          .pay-success-container {
            font-family: 'Inter', sans-serif;
          }
        `}</style>
        <div className="pay-success-container min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
          {/* Background Video */}
          <video className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-35" autoPlay muted loop playsInline>
            <source src="/livechackoutvideo/afterlogin.mp4" type="video/mp4" />
          </video>
          <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-[#050505]/95 to-[#050505]/75 backdrop-blur-[8px] z-10 pointer-events-none" />

          <div className="relative z-20 w-full max-w-xl p-10 bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#10b981]/15 rounded-3xl shadow-2xl space-y-6">
            <div className="w-20 h-20 bg-[#10b981]/10 border border-[#10b981]/30 rounded-full flex items-center justify-center mx-auto text-[#10b981] animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-black tracking-wide text-white">PAYMENT SUCCESSFUL</h1>
            <p className="text-[#a1a1aa] text-base leading-relaxed font-semibold">
              Payment Confirmed! Please check your email inbox (and spam folder) for server login details and credentials.
            </p>
            
            <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-3">
              <p className="text-xs text-emerald-400 tracking-wider uppercase font-bold flex items-center gap-1.5">
                <span>⚡ Instant Auto-Provisioning Complete: Your server is ready in Client Console!</span>
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                <a href="/client" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all tracking-wider uppercase shadow-lg shadow-emerald-600/30">
                  Go to Client Portal
                </a>
                <a href="/" className="bg-[#ff0f0f] hover:bg-[#cc0000] text-white text-xs font-bold px-6 py-3 rounded-xl transition-all tracking-wider uppercase">
                  Return Home
                </a>
                <a href="https://discord.gg/novax" target="_blank" rel="noopener noreferrer" className="bg-[#1f1f1f] hover:bg-white/5 border border-white/10 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all tracking-wider uppercase">
                  Join Discord
                </a>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

        .pay-page * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .pay-page {
          --primary: #ff0f0f;
          --primary-dark: #cc0000;
          --success: #10b981;
          --warning: #f59e0b;
          --info: #3b82f6;
          --bg-dark: #050505;
          --bg-card: #0f0f0f;
          --border-color: #1f1f1f;
          --text-main: #ffffff;
          --text-muted: #a1a1aa;

          font-family: 'Inter', sans-serif;
          background-color: var(--bg-dark);
          color: var(--text-main);
          overflow-x: hidden;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .pay-page .video-bg {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          z-index: 1;
          opacity: 0.35;
        }

        .pay-page .bg-overlay {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: linear-gradient(135deg, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.75) 100%);
          backdrop-filter: blur(8px);
          z-index: 2;
          pointer-events: none;
        }

        .pay-page .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .pay-page .navbar {
          background: rgba(5, 5, 5, 0.9);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 15, 15, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 1rem 0;
        }

        .pay-page .navbar-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pay-page .navbar-brand {
          font-size: 1.4rem;
          font-weight: 800;
          color: white;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .pay-page .navbar-brand i { color: var(--primary); }

        .pay-page .navbar-link {
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 500;
          transition: 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .pay-page .navbar-link:hover { color: white; }

        .pay-page .payment-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
        }

        .pay-page .card {
          background: rgba(15, 15, 15, 0.6);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 2rem;
          position: relative;
        }

        .pay-page .card-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: white;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .pay-page .card-title i { color: var(--primary); }

        .pay-page .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .pay-page .summary-label {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .pay-page .summary-value {
          font-weight: 600;
          color: white;
        }

        .pay-page .total-row {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pay-page .total-price {
          font-size: 2rem;
          font-weight: 900;
          color: var(--primary);
        }

        .pay-page .qr-container {
          background: white;
          padding: 1rem;
          border-radius: 12px;
          display: inline-block;
          margin-bottom: 1.5rem;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
          position: relative;
        }

        .pay-page .qr-image {
          width: 200px;
          height: 200px;
          display: block;
          transition: 0.3s;
        }

        .pay-page .input-group { margin-bottom: 1.5rem; }

        .pay-page .input-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .pay-page .input-wrapper {
          display: flex;
          gap: 0.5rem;
        }

        .pay-page .input {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          padding: 0.8rem 1rem;
          border-radius: 8px;
          color: white;
          font-family: 'JetBrains Mono', monospace;
          transition: 0.3s;
          flex: 1;
          outline: none;
        }

        .pay-page .input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 10px rgba(255, 15, 15, 0.2);
        }

        .pay-page .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.8rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
        }

        .pay-page .btn-primary {
          background: var(--primary);
          color: white;
        }

        .pay-page .btn-primary:hover {
          background: var(--primary-dark);
          transform: translateY(-2px);
        }

        .pay-page .btn-outline {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-muted);
        }

        .pay-page .btn-outline:hover {
          border-color: var(--primary);
          color: white;
        }

        .pay-page .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }

        .pay-page .toast {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%) translateY(100px);
          background: rgba(20, 20, 20, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border-color);
          padding: 0.8rem 1.5rem;
          border-radius: 50px;
          color: white;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 1000;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .pay-page .toast.show {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }

        .pay-page .qr-loader {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          color: var(--primary);
          font-size: 2rem;
        }

        @media (max-width: 900px) {
          .pay-page .payment-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .pay-page .container { padding: 0 1rem; }
          .pay-page .card { padding: 1.5rem; }
          .pay-page .total-price { font-size: 1.75rem; }
          .pay-page .qr-image { width: 160px; height: 160px; }
        }
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />

      <div className="pay-page">
        {/* Background */}
        <video className="video-bg" autoPlay muted loop playsInline>
          <source src="/livechackoutvideo/afterlogin.mp4" type="video/mp4" />
        </video>
        <div className="bg-overlay"></div>

        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          {/* Navbar */}
          <nav className="navbar">
          <div className="container">
            <div className="navbar-content">
              <a href="/" className="navbar-brand">
                <i className="fas fa-shield-alt"></i> NOVA X
              </a>
              <div>
                <a href="/" className="navbar-link">
                  <i className="fas fa-arrow-left"></i> <span style={{ fontWeight: 600 }}>Cancel</span>
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>

          {/* Page Header */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)",
              padding: "0.4rem 1rem", borderRadius: "50px", marginBottom: "1rem"
            }}>
              <i className="fas fa-check-circle" style={{ color: "var(--success)", fontSize: "0.9rem" }}></i>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--success)", letterSpacing: "0.5px" }}>ORDER CREATED</span>
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "0.5rem" }}>Secure Checkout</h1>
            <p style={{ color: "var(--text-muted)" }}>
              Order ID: <span style={{ color: "var(--primary)", fontFamily: "'JetBrains Mono', monospace" }}>#{orderId}</span>
            </p>
          </div>

          <div className="payment-grid">

            {/* Left Column: Summary */}
            <div className="card">
              <div className="card-title">
                <i className="fas fa-receipt"></i> Order Summary
              </div>

              <div className="summary-row">
                <div className="summary-label">Payment Type</div>
                <div className="summary-value">UPI-GPAY</div>
              </div>

              <div className="summary-row">
                <div className="summary-label">Platform</div>
                <div className="summary-value">PC / Windows</div>
              </div>

              {/* Coupon Code Section */}
              <div style={{ margin: "1.5rem 0", padding: "1.5rem 0", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <i className="fas fa-ticket-alt" style={{ color: "var(--primary)" }}></i>
                    Have a Coupon Code?
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="input"
                      placeholder={appliedCoupon ? `Applied: ${appliedCoupon}` : "Enter coupon code"}
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      disabled={!!appliedCoupon}
                      style={{ textTransform: "uppercase", letterSpacing: "1px" }}
                    />
                    <button
                      onClick={() => fetchQR(couponInput)}
                      disabled={!couponInput || !!appliedCoupon}
                      className="btn btn-outline btn-sm cursor-pointer"
                    >
                      <i className="fas fa-check"></i> Apply
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div style={{ color: "var(--success)", fontSize: "0.85rem", marginTop: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <i className="fas fa-percent"></i> Code "{appliedCoupon}" Applied! ({discountPercentage}% Discount)
                    </div>
                  )}
                </div>
              </div>

              <div className="total-row">
                <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-muted)" }}>Total Payable</span>
                <span className="total-price">₹{amount || "..."}</span>
              </div>
            </div>

            {/* Right Column: Payment Method */}
            <div className="card" style={{ textAlign: "center" }}>
              <div className="card-title" style={{ justifyContent: "center", borderBottom: "none", paddingBottom: 0 }}>
                <i className="fas fa-qrcode"></i> Scan to Pay
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                Use any UPI App (GPay, PhonePe, Paytm)
              </p>

              {/* QR Code */}
              <div className="qr-container">
                <img
                  src={qr || "/logo/NOVA-LOGO.png"}
                  alt="UPI QR Code"
                  className="qr-image"
                  style={{
                    opacity: qrLoading ? 0.5 : status === "expired" ? 0.1 : 1,
                    filter: qrLoading ? "blur(2px)" : "none",
                  }}
                />
                {qrLoading && (
                  <div className="qr-loader">
                    <i className="fas fa-spinner fa-spin"></i>
                  </div>
                )}
              </div>

              {/* UPI ID & Copy */}
              <div className="input-group" style={{ textAlign: "left" }}>
                <label className="input-label">UPI ID</label>
                <div className="input-wrapper">
                  <input type="text" className="input" value="novaxsto@slc" readOnly />
                  <button className="btn btn-outline btn-sm" onClick={copyUPI}>
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>

              {/* Pay Button (Mobile Intent) */}
              <a
                href={upiIntent}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  pointerEvents: status === "expired" ? "none" : "auto",
                  opacity: status === "expired" ? 0.5 : 1,
                }}
              >
                <i className="fas fa-mobile-alt"></i> Pay via UPI App
              </a>
            </div>
          </div>

          {/* Bottom Section: Payment Timer */}
          <div className="card" style={{ marginTop: "2rem", borderColor: "rgba(255, 15, 15, 0.3)", textAlign: "center" }}>
            <div className="card-title" style={{ justifyContent: "center" }}>
              <i className="fas fa-clock"></i> Time Remaining
            </div>
            <p style={{ color: "var(--text-muted)", marginBottom: "1rem", fontSize: "0.95rem" }}>
              Please complete your payment within the next 3 minutes.
            </p>
            <div style={{
              fontSize: "2.5rem", fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: status === "expired" ? "var(--text-muted)" : "var(--primary)"
            }}>
              {m}:{s}
            </div>
            <p style={{
              marginTop: "1rem", fontWeight: 600,
              color: status === "success" ? "var(--success)" : status === "expired" || status === "rejected" ? "var(--primary)" : "var(--warning)"
            }}>
              {status === "waiting" && <><i className="fas fa-spinner fa-spin"></i> Waiting for payment...</>}
              {status === "success" && <><i className="fas fa-check-circle"></i> Payment Successful and check your inbox or spam box in mail</>}
              {status === "expired" && <><i className="fas fa-times-circle"></i> Payment Expired</>}
              {status === "rejected" && <><i className="fas fa-times-circle"></i> Payment Rejected</>}
            </p>
          </div>

          {/* Support Link */}
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <a href="https://discord.gg/novax" target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem" }}>
              <i className="fab fa-discord"></i> Having trouble? Contact Support
            </a>
          </div>
        </main>

        {/* Toast Notification */}
        <div className={`toast ${showToast ? "show" : ""}`}>
          <i className="fas fa-check-circle" style={{ color: "var(--success)" }}></i>
          <span>{toastMsg}</span>
        </div>
        </div>
      </div>
    </>
  );
}
