"use client";

import { useEffect, useState, use } from "react";
import { CheckCircle, Clock, ArrowLeft, Disc, Loader2 } from "lucide-react";

interface OrderDetails {
  orderId: string;
  product: string;
  price: number;
  timestamp: number;
  utr?: string;
}

export default function StatusPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [status, setStatus] = useState<string>("PENDING");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5s

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/order-status/${orderId}`);
      const data = await res.json();
      if (data.order) {
        setOrder(data.order);
        setStatus(data.status);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching order status:", err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#ff0f0f]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <a href="/" className="bg-[#ff0f0f] hover:bg-[#cc0000] text-white px-6 py-3 rounded-lg font-semibold transition-colors">
          Go Home
        </a>
      </div>
    );
  }

  const isApproved = status === "APPROVED";

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

        .status-page * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .status-page {
          --primary: #ff0f0f;
          --primary-dark: #cc0000;
          --success: #10b981;
          --warning: #f59e0b;
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

        .status-page .video-bg {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          z-index: 1;
          opacity: 0.35;
        }

        .status-page .bg-overlay {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: linear-gradient(135deg, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.75) 100%);
          backdrop-filter: blur(8px);
          z-index: 2;
          pointer-events: none;
        }

        .status-page .container {
          max-width: 700px;
          margin: 0 auto;
          padding: 0 1.5rem;
          position: relative;
          z-index: 10;
        }

        .status-page .navbar {
          background: rgba(5, 5, 5, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 15, 15, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 1rem 0;
        }

        .status-page .navbar-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .status-page .navbar-brand {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .status-page .navbar-link {
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 500;
          transition: 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .status-page .navbar-link:hover { color: white; }

        .status-page .card {
          background: rgba(15, 15, 15, 0.6);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
        }

        .status-page .card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 4px; height: 100%;
          background: var(--primary);
          opacity: 0.5;
        }

        .status-page .status-icon-container {
          width: 90px;
          height: 90px;
          margin: 0 auto 1.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
        }

        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }

        .status-page .pulse-success {
          animation: pulse-green 2s infinite;
          border-color: var(--success);
        }

        .status-page .pulse-warning {
          animation: pulse-red 2s infinite;
          border-color: var(--warning);
        }

        .status-page .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1.5rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 1.5rem;
          border-radius: 12px;
        }

        .status-page .timeline {
          position: relative;
          padding-left: 2rem;
        }

        .status-page .timeline-line {
          position: absolute;
          left: 0.6rem;
          top: 0.5rem;
          bottom: 0;
          width: 2px;
          background: var(--border-color);
        }

        .status-page .timeline-item {
          position: relative;
          margin-bottom: 2.5rem;
        }

        .status-page .timeline-dot {
          position: absolute;
          left: -2rem;
          width: 1.4rem;
          height: 1.4rem;
          border-radius: 50%;
          background: var(--bg-dark);
          border: 2px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .status-page .timeline-dot.active {
          border-color: var(--success);
          background: rgba(16, 185, 129, 0.1);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
        }

        .status-page .btn {
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

        .status-page .btn-primary {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 15px rgba(255, 15, 15, 0.2);
        }

        .status-page .btn-primary:hover {
          background: var(--primary-dark);
          transform: translateY(-2px);
        }

        .status-page .btn-outline {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-muted);
        }

        .status-page .btn-outline:hover {
          border-color: var(--primary);
          color: white;
        }
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />

      <div className="status-page">
        {/* Background */}
        <video className="video-bg" autoPlay muted loop playsInline style={{ position: "fixed", zIndex: 1 }}>
          <source src="/livechackoutvideo/afterlogin.mp4" type="video/mp4" />
        </video>
        <div className="bg-overlay" style={{ position: "fixed", zIndex: 2 }}></div>

        {/* Navbar */}
        <nav className="navbar" style={{ position: "relative", zIndex: 10 }}>
          <div className="navbar-content">
            <a href="/" className="navbar-brand">
              <img src="/logo/NOVA-LOGO.png" style={{ height: "30px", width: "30px", borderRadius: "8px", objectFit: "cover", marginRight: "10px" }} alt="Logo" />
              NOVA X
            </a>
            <div className="flex gap-4">
              <a href="/" className="navbar-link">
                <i className="fas fa-home"></i> Home
              </a>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container" style={{ paddingTop: "3rem", paddingBottom: "3rem", position: "relative", zIndex: 10 }}>
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            
            {/* Header */}
            <div className="text-center" style={{ marginBottom: "3rem" }}>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>ORDER STATUS</h1>
              <div style={{ fontSize: "1.1rem", color: "var(--primary)", letterSpacing: "1px", fontFamily: "'JetBrains Mono', monospace" }}>
                #{order.orderId}
              </div>
            </div>

            {/* Main Status Card */}
            <div className="card" style={{ textAlign: "center" }}>
              {isApproved ? (
                <>
                  <div className="status-icon-container pulse-success">
                    <CheckCircle className="w-10 h-10 text-[#10b981]" />
                  </div>
                  <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem", color: "white" }}>Order Approved</h2>
                  <p style={{ color: "var(--text-muted)" }}>Your payment has been verified. Product delivered below.</p>
                  <div style={{ background: "rgba(255, 15, 15, 0.1)", border: "1px solid var(--primary)", padding: "10px", borderRadius: "8px", marginTop: "15px" }}>
                    <p style={{ color: "var(--primary)", fontWeight: "bold", margin: 0, fontSize: "0.95rem" }}>
                      <i className="fas fa-envelope" style={{ marginRight: "5px" }}></i> IMPORTANT: PLEASE CHECK YOUR INBOX OR SPAM BOX IN MAIL FOR CONFIRMATION
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="status-icon-container pulse-warning">
                    <Clock className="w-10 h-10 text-[#f59e0b]" />
                  </div>
                  <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem", color: "white" }}>Verification Pending</h2>
                  <p style={{ color: "var(--text-muted)" }}>We are currently verifying your payment.</p>
                </>
              )}

              <div className="details-grid" style={{ marginTop: "2rem", textAlign: "left" }}>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>PRODUCT</div>
                  <div style={{ fontWeight: 600 }}>{order.product}</div>
                </div>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>AMOUNT</div>
                  <div style={{ fontWeight: 600, color: "var(--primary)" }}>₹{order.price}</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <i className="fas fa-history" style={{ color: "var(--primary)" }}></i> Timeline
              </h3>
              <div className="timeline">
                <div className="timeline-line"></div>
                <div className="timeline-item">
                  <div className="timeline-dot active">
                    <i className="fas fa-check" style={{ color: "var(--success)" }}></i>
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>Order Created</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Order placed successfully</div>
                </div>
                <div className="timeline-item">
                  <div className={`timeline-dot ${isApproved ? "active" : ""}`}>
                    {isApproved && <i className="fas fa-check" style={{ color: "var(--success)" }}></i>}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: "0.2rem", color: isApproved ? "white" : "var(--text-muted)" }}>Admin Verification</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {isApproved ? "Payment approved by admin" : "Pending verification"}
                  </div>
                </div>
                <div className="timeline-item" style={{ marginBottom: 0 }}>
                  <div className={`timeline-dot ${isApproved ? "active" : ""}`}>
                    {isApproved && <i className="fas fa-box" style={{ color: "var(--success)" }}></i>}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: "0.2rem", color: isApproved ? "white" : "var(--text-muted)" }}>Delivery</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {isApproved ? "Access granted via Discord/Email" : "Access pending approval"}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem" }}>
              <a href="/" className="btn btn-outline">
                <ArrowLeft className="w-4 h-4 mr-1 inline" /> Home
              </a>
              <a href="https://discord.gg/novax" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <Disc className="w-4 h-4 mr-1 inline" /> Support
              </a>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
