// src/AadhaarCheck.jsx
import { useState, useMemo } from "react";

/*
  Theme: White background, blue text, green accents.
  Header: left emblem (lion) + title ("Unique Identification Authority Of India") + right Aadhaar logo.
  Removed: Offline XML verification card.
  Kept: Analyze (/analyze) and QR verify (/verify-qr).
  Added: Lookup by 12-digit Aadhaar number (GET /lookup?aadhar=XXXXXXXXXXXX)
*/

/* ---------- THEME ---------- */
const THEME = {
  bg: "#ffffff",
  text: "#04386B",        // deep blue
  subtext: "#2667A9",    // lighter blue for labels
  border: "#e6f3ff",     // very light blue border
  cardBg: "#ffffff",
  cardShadow: "0 8px 30px rgba(9,32,88,0.04)",
  green: "#138808",      // Indian green accent
  saffron: "#f59e0b",
  danger: "#d43f4a",
  success: "#138808",
  cyan: "#06b6d4",
};

/* ---------- Helpers / Styles ---------- */
const btn = (bg) => ({
  background: bg,
  border: 0,
  padding: "10px 16px",
  borderRadius: 10,
  fontWeight: 700,
  color: "#fff",
  cursor: "pointer",
  boxShadow: "0 6px 18px rgba(9,32,88,0.06)",
});

const headerStyles = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 18,
};

const leftHeader = {
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const titleStyle = {
  margin: 0,
  fontSize: 24,
  fontWeight: 800,
  color: THEME.text,
  lineHeight: 1.05,
};

const container = {
  minHeight: "100vh",
  background: THEME.bg,
  color: THEME.text,
  fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: "28px 20px",
};

const inner = { width: "100%", maxWidth: 1200 };

const card = {
  background: THEME.cardBg,
  border: `1px solid ${THEME.border}`,
  borderRadius: 12,
  padding: 18,
  width: "100%",
  boxShadow: THEME.cardShadow,
};

const label = { color: THEME.subtext, marginRight: 8, minWidth: 120, display: "inline-block" };

/* ---------- small utilities ---------- */
function maskAadhaar(s) {
  if (!s || s.length < 4) return s || "N/A";
  const clean = s.replace(/\s+/g, "");
  if (clean.length !== 12) return s;
  return `XXXX-XXXX-${clean.slice(-4)}`;
}

function Field({ title, value }) {
  return (
    <p style={{ margin: "6px 0", color: THEME.text }}>
      <span style={label}>{title}</span>
      <span style={{ fontWeight: 700 }}>{value ?? "N/A"}</span>
    </p>
  );
}

/* ---------- Component ---------- */
export default function AadhaarCheck() {
  // Analyze / OCR
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // QR
  const [qrFile, setQrFile] = useState(null);
  const [qrRes, setQrRes] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Lookup by Aadhaar
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupRes, setLookupRes] = useState(null);

  // API base (env)
  const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

  // ---------- classify + OCR ----------
  const handleFileUpload = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setResult(null);
    setPreview(f ? URL.createObjectURL(f) : "");
  };

  const submitAnalyze = async () => {
    if (!file) return alert("Select an image");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/analyze`, { method: "POST", body: form });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  // ---------- QR verify ----------
  const submitQR = async () => {
    if (!qrFile) return alert("Select an image containing the Aadhaar QR");
    setQrLoading(true);
    try {
      const form = new FormData();
      form.append("file", qrFile);
      const res = await fetch(`${API_BASE}/verify-qr`, { method: "POST", body: form });
      const data = await res.json();
      setQrRes(data);
    } catch (e) {
      setQrRes({ error: e.message });
    } finally {
      setQrLoading(false);
    }
  };

  // ---------- Lookup by Aadhaar ----------
  const validateAadhaarInput = (s) => {
    const digits = (s || "").replace(/\D/g, "");
    return digits.length === 12;
  };

  const submitLookup = async () => {
    const digits = (aadhaarInput || "").replace(/\D/g, "");
    if (digits.length !== 12) {
      setLookupRes({ error: "Enter exactly 12 digits." });
      return;
    }
    setLookupLoading(true);
    setLookupRes(null);
    try {
      // GET /lookup?aadhar=XXXXXXXXXXXX
      const res = await fetch(`${API_BASE}/lookup?aadhar=${encodeURIComponent(digits)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLookupRes({ error: err.detail || "Lookup failed" });
      } else {
        const data = await res.json();
        // expected: person object
        setLookupRes(data);
      }
    } catch (e) {
      setLookupRes({ error: e.message });
    } finally {
      setLookupLoading(false);
    }
  };

  // ---------- status badge ----------
  const statusBadge = useMemo(() => {
    if (!result || result.error) return null;
    return result.verified ? (
      <span
        style={{
          display: "inline-block",
          padding: "6px 10px",
          borderRadius: 999,
          background: THEME.success,
          color: "#fff",
          fontWeight: 700,
        }}
      >
        ✅ Verified Aadhaar
      </span>
    ) : (
      <span
        style={{
          display: "inline-block",
          padding: "6px 10px",
          borderRadius: 999,
          background: THEME.danger,
          color: "#fff",
          fontWeight: 700,
        }}
      >
        ❌ Fake Aadhaar
      </span>
    );
  }, [result]);

  /* ---------- render ---------- */
  return (
    <div style={container}>
      <div style={inner}>
        {/* Header */}
        <header style={headerStyles}>
          <div style={leftHeader}>
            {/* Left emblem: place /public/assets/lion_emblem.png */}
            <img src="/assets/lion_emblem.png" alt="Emblem" style={{ height: 56, objectFit: "contain" }} />
            <div style={{ textAlign: "left" }}>
              <h1 style={titleStyle}>Unique Identification Authority Of India</h1>
            </div>
          </div>

          {/* Right Aadhaar logo: place /public/assets/aadhaar_logo.png */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/assets/aadhaar_logo.png" alt="Aadhaar logo" style={{ height: 56, objectFit: "contain" }} />
          </div>
        </header>

        {/* Grid: Analyze + QR + Lookup */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {/* Analyze */}
          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 18, color: THEME.text }}>1) Analyze (Image → OCR + Prediction)</h2>
              {statusBadge}
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                marginTop: 12,
                flexWrap: "wrap",
              }}
            >
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ color: THEME.subtext }} />
              <button onClick={submitAnalyze} disabled={loading || !file} style={btn(THEME.green)}>
                {loading ? "Analyzing…" : "Analyze"}
              </button>
            </div>

            {preview && (
              <div style={{ marginTop: 14 }}>
                <img
                  src={preview}
                  alt="preview"
                  style={{
                    width: "100%",
                    maxWidth: 480,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 10,
                  }}
                />
              </div>
            )}

            {result && (
              <div
                style={{
                  marginTop: 14,
                  background: "#fbfdff",
                  borderRadius: 10,
                  padding: 14,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                {result.error ? (
                  <p style={{ color: THEME.danger }}>Error: {result.error}</p>
                ) : (
                  <>
                    <p style={{ margin: 0 }}>
                      <span style={label}>Prediction</span>
                      <b>{result.predicted_label}</b>
                    </p>
                    <p style={{ margin: "8px 0" }}>
                      <span style={label}>Confidence</span>
                      <b>{(result.confidence * 100).toFixed(1)}%</b>
                    </p>

                    <hr style={{ borderColor: THEME.border, margin: "12px 0" }} />

                    <h4 style={{ margin: "8px 0 6px" }}>Extracted Details</h4>
                    <Field title="Name" value={result.ocr?.name || "N/A"} />
                    <Field title="DOB / YOB" value={result.ocr?.dob || result.ocr?.yob || "N/A"} />
                    <Field title="Gender" value={result.ocr?.gender || "N/A"} />
                    <Field title="Aadhaar No." value={maskAadhaar(result.ocr?.aadhaar_number)} />
                  </>
                )}
              </div>
            )}
          </section>

          {/* QR */}
          <section style={card}>
            <h2 style={{ margin: 0, fontSize: 18, color: THEME.text }}>2) Aadhaar QR Verification (Image)</h2>

            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                marginTop: 12,
                flexWrap: "wrap",
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setQrFile(e.target.files?.[0] || null);
                  setQrRes(null);
                }}
                style={{ color: THEME.subtext }}
              />
              <button onClick={submitQR} disabled={qrLoading || !qrFile} style={btn(THEME.green)}>
                {qrLoading ? "Decoding…" : "Verify QR"}
              </button>
            </div>

            {qrRes && (
              <div
                style={{
                  marginTop: 14,
                  background: "#fbfdff",
                  borderRadius: 10,
                  padding: 14,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                {qrRes.error ? (
                  <p style={{ color: THEME.danger }}>Error: {qrRes.error}</p>
                ) : (
                  <>
                    <Field title="Aadhaar No." value={maskAadhaar(qrRes.aadhaar_number)} />
                    <Field title="Name" value={qrRes.name || "N/A"} />
                    <Field title="DOB / YOB" value={qrRes.dob || qrRes.yob || "N/A"} />
                    <Field title="Gender" value={qrRes.gender || "N/A"} />

                    <p style={{ marginTop: 8 }}>
                      <span style={label}>Verhoeff</span>
                      {qrRes.verhoeff_ok ? (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 10px",
                            borderRadius: 999,
                            background: THEME.success,
                            color: "#fff",
                            fontWeight: 700,
                          }}
                        >
                          valid
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 10px",
                            borderRadius: 999,
                            background: THEME.danger,
                            color: "#fff",
                            fontWeight: 700,
                          }}
                        >
                          invalid / not found
                        </span>
                      )}
                    </p>
                  </>
                )}
              </div>
            )}
          </section>

          {/* Lookup by Aadhaar number */}
          <section style={card}>
            <h2 style={{ margin: 0, fontSize: 18, color: THEME.text }}>3) Lookup by Aadhaar Number</h2>

            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Enter 12-digit Aadhaar"
                value={aadhaarInput}
                onChange={(e) => setAadhaarInput(e.target.value)}
                maxLength={14}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${THEME.border}`,
                  minWidth: 220,
                  color: THEME.text,
                  backgroundColor: "#ffffff",         // <--- ensure white background so digits are visible
                  WebkitTextFillColor: THEME.text,    // safari / chrome text color enforcement
                  fontSize: 15,
                }}
              />
              <button onClick={submitLookup} disabled={lookupLoading} style={btn(THEME.cyan)}>
                {lookupLoading ? "Looking up…" : "Lookup"}
              </button>
            </div>

            {lookupRes && (
              <div
                style={{
                  marginTop: 14,
                  background: "#fbfdff",
                  borderRadius: 10,
                  padding: 14,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                {lookupRes.error ? (
                  <p style={{ color: THEME.danger }}>{lookupRes.error}</p>
                ) : lookupRes.not_found ? (
                  <p style={{ color: THEME.danger }}>Not found in local database.</p>
                ) : (
                  <>
                    <Field title="Aadhaar No." value={maskAadhaar(lookupRes.aadhaar)} />
                    <Field title="Name" value={lookupRes.name || "N/A"} />
                    <Field title="DOB" value={lookupRes.dob || "N/A"} />
                    <Field title="Gender" value={lookupRes.gender || "N/A"} />
                    <Field title="Address" value={lookupRes.address || "N/A"} />
                  </>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Footer tip */}
        <footer style={{ color: THEME.subtext, marginTop: 18, fontSize: 13 }}>
          Tip: Set <code style={{ color: THEME.green }}>VITE_API_BASE</code> in your frontend <code>.env</code> to point to the FastAPI server.
        </footer>
      </div>
    </div>
  );
}
