import { useState, useEffect } from "react";
import {
  X,
  FileText,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Target,
  Code,
  BookOpen,
  Award,
} from "lucide-react";
import { getCandidateDetail } from "../api/nexvec";

// ─── Resume Section Component ────────────────────────────────────────────────
function ResumeSection({ icon, title, children }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        {icon}
        <h3
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#5C534A",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ─── Resume View Component ───────────────────────────────────────────────────
export function ResumeView({ detail }) {
  if (!detail) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Header ── */}
      <div style={{ borderBottom: "2px solid #1A1814", paddingBottom: 20 }}>
        <h1
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: 28,
            color: "#1A1814",
            letterSpacing: "-0.5px",
            marginBottom: 8,
          }}
        >
          {detail.name || "Unknown Candidate"}
        </h1>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            fontSize: 12.5,
            color: "#5C534A",
          }}
        >
          {detail.email && (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Mail size={13} color="#3B6EF5" /> {detail.email}
            </span>
          )}
          {detail.phone && (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Phone size={13} color="#3B6EF5" /> {detail.phone}
            </span>
          )}
          {detail.location && (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <MapPin size={13} color="#3B6EF5" /> {detail.location}
            </span>
          )}
          {detail.work_experience_years != null && (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Briefcase size={13} color="#3B6EF5" />{" "}
              {detail.work_experience_years === 0 ? "Fresher / Entry level" : `${detail.work_experience_years} years experience`}
            </span>
          )}
        </div>
      </div>

      {/* ── Objective / Summary ── */}
      {detail.objectives && (
        <ResumeSection
          icon={<Target size={15} color="#3B6EF5" />}
          title="Professional Summary"
        >
          <p style={{ fontSize: 13, color: "#3C3530", lineHeight: 1.8 }}>
            {detail.objectives}
          </p>
        </ResumeSection>
      )}

      {/* ── Skills ── */}
      {detail.skills && detail.skills.length > 0 && (
        <ResumeSection icon={<Code size={15} color="#3B6EF5" />} title="Skills">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {detail.skills.map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#4F46E5",
                  background: "#EEF2FF",
                  padding: "4px 12px",
                  borderRadius: 99,
                  border: "0.5px solid #C7D2FE",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </ResumeSection>
      )}

      {/* ── Work Experience ── */}
      {detail.work_experience_text && (
        <ResumeSection
          icon={<Briefcase size={15} color="#3B6EF5" />}
          title="Work Experience"
        >
          <div
            style={{
              fontSize: 13,
              color: "#3C3530",
              lineHeight: 1.9,
              whiteSpace: "pre-wrap",
            }}
          >
            {detail.work_experience_text}
          </div>
        </ResumeSection>
      )}

      {/* ── Education ── */}
      {detail.education && (
        <ResumeSection
          icon={<BookOpen size={15} color="#3B6EF5" />}
          title="Education"
        >
          <div
            style={{
              fontSize: 13,
              color: "#3C3530",
              lineHeight: 1.9,
              whiteSpace: "pre-wrap",
            }}
          >
            {detail.education}
          </div>
        </ResumeSection>
      )}

      {/* ── Projects ── */}
      {detail.projects && (
        <ResumeSection
          icon={<Code size={15} color="#3B6EF5" />}
          title="Projects"
        >
          <div
            style={{
              fontSize: 13,
              color: "#3C3530",
              lineHeight: 1.9,
              whiteSpace: "pre-wrap",
            }}
          >
            {detail.projects}
          </div>
        </ResumeSection>
      )}

      {/* ── Achievements ── */}
      {detail.achievements && (
        <ResumeSection
          icon={<Award size={15} color="#3B6EF5" />}
          title="Achievements & Certifications"
        >
          <div
            style={{
              fontSize: 13,
              color: "#3C3530",
              lineHeight: 1.9,
              whiteSpace: "pre-wrap",
            }}
          >
            {detail.achievements}
          </div>
        </ResumeSection>
      )}

      {/* ── Footer ── */}
      <div
        style={{
          borderTop: "0.5px solid #E8E4DF",
          paddingTop: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 10.5, color: "#C0B9B2" }}>
          Source: {detail.source_filename}
        </span>
        {detail.created_at && (
          <span style={{ fontSize: 10.5, color: "#C0B9B2" }}>
            Ingested: {detail.created_at.split("T")[0]}
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: 9,
          color: "#D1D0CE",
          textAlign: "center",
          marginTop: -12,
        }}
      >
        Confidential | 7EDGE
      </div>
    </div>
  );
}

// ─── Candidate Profile Modal Component ───────────────────────────────────────
export function CandidateProfile({ resumeId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!resumeId) return;
    setDetail(null);
    setLoading(true);
    setError("");
    getCandidateDetail(resumeId)
      .then((d) => {
        setDetail(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [resumeId]);

  if (!resumeId) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 20px",
        overflowY: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 700,
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Modal header bar */}
        <div
          style={{
            background: "#1A1814",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={16} color="#9CA3AF" />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#E5E7EB",
                letterSpacing: "0.02em",
              }}
            >
              Candidate Profile
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#9CA3AF",
              display: "flex",
              alignItems: "center",
              padding: 4,
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "28px 32px" }}>
          {loading && (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "#A89C94",
                fontSize: 13,
              }}
            >
              <div
                className="spin-blue"
                style={{
                  margin: "0 auto 12px",
                  width: 32,
                  height: 32,
                  borderWidth: 3,
                }}
              />
              Loading profile…
            </div>
          )}

          {error && (
            <div style={{ padding: 20, color: "#DC2626", fontSize: 13 }}>
              Failed to load: {error}
            </div>
          )}

          {detail && <ResumeView detail={detail} />}
        </div>
      </div>
    </div>
  );
}
