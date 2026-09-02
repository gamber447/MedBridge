import { useState, useEffect } from "react";
import PatientVerification from "./PatientVerification";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useLocation,
  useSearchParams
} from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Building2,
  ChevronDown,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  WalletCards,
  X,
  Eye,
  ArrowRight,
  ArrowLeft,
  UserRound,
  Hospital,
  ScanSearch,
  Landmark,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ReceiptText
} from "lucide-react";

import "./App.css";
import {
  getCurrentUser,
  getDashboardSummary,
  getAdminFundingDetails,
  getDonorStatistics,
  getMedicalCases,
  getPatient,
  getPatients,
  getFundingStatus,
  getPaymentStatus,
  getPayments,
  getCaseAuditLogs,
  getBankAuditLogs,
  registerPatient,
  createFundingRequest,
  createMedicalCase,
  evaluateCaseRisk,
  login,
  logout,
} from "./services/api";


const navigationByRole = {
  ADMIN: [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Medical Cases", icon: FileText },
    { label: "Patients", icon: HeartPulse },
    { label: "Donors", icon: Users },
    { label: "Funding", icon: WalletCards },
    { label: "Payments", icon: Activity },
    { label: "Audit & Security", icon: ShieldCheck },
  ],

  DOCTOR: [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Medical Cases", icon: FileText },
    { label: "Patients", icon: HeartPulse },
    { label: "Risk Evaluation", icon: ShieldCheck },
    { label: "Funding Status", icon: WalletCards },
  ],

  AUDITOR: [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Funding", icon: WalletCards },
    { label: "Payments", icon: Activity },
    { label: "Audit & Security", icon: ShieldCheck },
  ],
};


function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await login(email.trim(), password);

      if (!result.success) {
        setError(result.message || "Authentication failed.");
        return;
      }

      sessionStorage.setItem(
        "medbridge_token",
        result.access_token
      );

      sessionStorage.setItem(
        "medbridge_user",
        JSON.stringify(result.user)
      );

      onLogin(result.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError(
          "Unable to connect to the MedBridge server."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">
            <HeartPulse size={25} strokeWidth={2.5} />
          </div>

          <div>
            <div className="brand-name">MedBridge</div>
            <div className="brand-subtitle">
              Medical Funding Platform
            </div>
          </div>
        </div>

        <div className="login-heading">
          <div className="eyebrow">SECURE ACCESS</div>

          <h1>Welcome back</h1>

          <p>
            Sign in to access the MedBridge secure platform.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="enter email address"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              required
            />
          </label>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              "Signing in..."
            ) : (
              <>
                <LogIn size={17} />
                Sign in securely
              </>
            )}
          </button>
        </form>

        <div className="login-security">
          <ShieldCheck size={17} />

          <span>
            Protected by JWT authentication and role-based
            access control
          </span>
        </div>
      </div>
    </div>
  );
}

function CaseDetails({ medicalCase, onBack }) {
  const [patient, setPatient] = useState(null);
  const [patientLoading, setPatientLoading] =
    useState(false);
  const [patientError, setPatientError] =
    useState("");
  const [activeOperation, setActiveOperation] = useState(null);
  
  const [paymentData, setPaymentData] = useState(null);
  const [paymentLoading, setPaymentLoading] =
  useState(false);
  const [paymentError, setPaymentError] =
  useState("");

  const [auditData, setAuditData] = useState(null);
const [auditLoading, setAuditLoading] = useState(false);
const [auditError, setAuditError] = useState("");


  async function loadPatient() {
    try {
      setPatientLoading(true);
      setPatientError("");

      const data = await getPatient(patient.patient_reference);

      setPatient(data.patient);

    } catch (error) {
      console.error(
        "Patient loading failed:",
        error
      );

      setPatientError(
        error?.response?.data?.detail ||
        "Unable to load patient details."
      );

    } finally {
      setPatientLoading(false);
    }
  }
  async function loadPayment() {
  try {
    setPaymentLoading(true);
    setPaymentError("");

    const data = await getPaymentStatus(
      medicalCase.case_id
    );

    console.log("PAYMENT DATA RECEIVED:", data);

    setPaymentData(data);
  } catch (error) {
    console.error("PAYMENT ERROR:", error);

    setPaymentError(
      error?.response?.data?.detail ||
      "Unable to load payment status."
    );
  } finally {
    setPaymentLoading(false);
  }
}
async function loadAudit() {
  try {
    setAuditLoading(true);
    setAuditError("");

    const data = await getCaseAuditLogs(
      medicalCase.case_id
    );

    console.log("AUDIT DATA RECEIVED:", data);

    setAuditData(data);
  } catch (error) {
    console.error("AUDIT ERROR:", error);

    setAuditError(
      error?.response?.data?.detail ||
      "Unable to load audit information."
    );
  } finally {
    setAuditLoading(false);
  }
}

  return (
    <div className="medical-case-details">

      {/* BACK BUTTON */}

      <button
        className="back-button"
        onClick={onBack}
      >
        ← Back to Medical Cases
      </button>


      {/* HEADER */}

      <div className="case-details-heading">

        <div>

          <div className="eyebrow">
            MEDICAL CASE
          </div>

          <h1>
            {medicalCase.case_reference}
          </h1>

          <p>
            {medicalCase.emergency_type
              ?.replaceAll("_", " ")}
          </p>

        </div>

        <span
          className={`status-badge status-${medicalCase.status?.toLowerCase()}`}
        >
          {medicalCase.status}
        </span>

      </div>


      {/* INFORMATION GRID */}

      <div className="case-details-grid">

        {/* CASE INFORMATION */}

        <section className="detail-card">

          <h2>Case Information</h2>

          <div className="detail-list">

            <div>
              <span>Case ID</span>
              <strong>
                #{medicalCase.case_id}
              </strong>
            </div>

            <div>
              <span>Case Reference</span>
              <strong>
                {medicalCase.case_reference}
              </strong>
            </div>

            <div>
              <span>Emergency Type</span>
              <strong>
                {medicalCase.emergency_type
                  ?.replaceAll("_", " ")}
              </strong>
            </div>

            <div>
              <span>Diagnosis</span>
              <strong>
                {medicalCase.diagnosis_category
                  ?.replaceAll("_", " ")}
              </strong>
            </div>

          </div>

        </section>
{activeOperation === "patient" && patientLoading && (
  <section className="detail-card">
    <h2>Patient Details</h2>

    <div className="patient-loading">
      Loading patient information...
    </div>
  </section>
)}

{activeOperation === "patient" && patientError && (
  <section className="detail-card dashboard-error">
    <h2>Patient Details</h2>
    <p>{patientError}</p>
  </section>
)}
{activeOperation === "patient" && patient && (
  <section className="detail-card patient-detail-card">
    <h2>Patient Details</h2>

    <div className="detail-list">

      <div className="detail-row">
        <span>Patient ID</span>
        <strong>#{patient.patient_id}</strong>
      </div>

      <div className="detail-row">
        <span>Patient Reference</span>
        <strong>{patient.patient_reference}</strong>
      </div>

      <div className="detail-row">
        <span>Age</span>
        <strong>{patient.age}</strong>
      </div>

      <div className="detail-row">
        <span>Gender</span>
        <strong>
          {patient.gender?.replaceAll("_", " ")}
        </strong>
      </div>

      <div className="detail-row">
        <span>Identity Status</span>
        <span className="status-badge status-verified">
          {patient.identity_status}
        </span>
      </div>

      <div className="contribution-amount">
  {Number(selectedDonor.actual_contribution || 0).toLocaleString(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  )}
</div>

    </div>
  </section>
)}
    
        {/* LINKED RECORDS */}

        <section className="detail-card">

          <h2>Linked Records</h2>

          <div className="detail-list">

            <div>
              <span>Hospital ID</span>

              <strong>
                {medicalCase.hospital_id}
              </strong>
            </div>

            <div>
              <span>Patient ID</span>

              <strong>
                {medicalCase.patient_id}
              </strong>
            </div>

            <div>
              <span>Created</span>

              <strong>
                {new Date(
                  medicalCase.created_at
                ).toLocaleString("en-GB")}
              </strong>
            </div>

          </div>

        </section>


        {/* NEXT FEATURES */}

        <section className="detail-card case-actions-card">

          <h2>Case Operations</h2>

          <div className="case-actions">

 <button
  className={`case-action-button ${
    activeOperation === "patient" ? "active" : ""
  }`}
  onClick={() => {
    if (activeOperation === "patient") {
      setActiveOperation(null);
      return;
    }

    setActiveOperation("patient");
    loadPatient();
  }}
>
  Patient Details
</button>

  <button
    className={`case-action-button ${
      activeOperation === "risk" ? "active" : ""
    }`}
    onClick={async () => {
  if (activeOperation === "risk") {
    setActiveOperation(null);
    return;
  }

  if (!selectedMedicalCase?.id) {
    setError("No medical case selected.");
    return;
  }

  try {
    setError("");
    setActiveOperation("risk");

    const result = await evaluateCaseRisk(
      selectedMedicalCase.case_id
    );

    console.log(
      "RISK EVALUATION RESULT:",
      result
    );

    setSelectedMedicalCase((previous) => ({
      ...previous,
      trust_score: result.trust_score,
      risk_level: result.risk_level,
      verification_status:
        result.verification_status,
    }));

  } catch (err) {
    console.error(
      "Risk evaluation failed:",
      err
    );

    const detail = err?.response?.data?.detail;

setError(
  Array.isArray(detail)
    ? detail
        .map((item) => item?.msg || "Validation error")
        .join(", ")
    : typeof detail === "string"
      ? detail
      : "Unable to evaluate case risk."
);
  }
}}
  >
    Risk Evaluation
  </button>

  <button
    className={`case-action-button ${
      activeOperation === "funding" ? "active" : ""
    }`}
    onClick={() =>
      setActiveOperation(
        activeOperation === "funding"
          ? null
          : "funding"
      )
    }
  >
    Funding Status
  </button>

  <button
    className={`case-action-button ${
      activeOperation === "payment" ? "active" : ""
    }`}
    onClick={() => {
  if (activeOperation === "payment") {
    setActiveOperation(null);
    return;
  }

  setActiveOperation("payment");
  loadPayment();
}}
  >
    Payment Status
  </button>

 <button
  className={`case-action-button ${
    activeOperation === "audit" ? "active" : ""
  }`}
  onClick={() => {
    if (activeOperation === "audit") {
      setActiveOperation(null);
      return;
    }

    setActiveOperation("audit");
    loadAudit();
  }}
>
  Audit & Security
</button>

</div>

        </section>

        {activeOperation === "funding" && (
  <section className="detail-card funding-status-card">
    <h2>Funding Status</h2>

    <div className="detail-list">

      <div className="detail-row">
        <span>Requested Amount</span>
        <strong>
          ₹{Number(medicalCase.requested_amount || 0).toLocaleString("en-IN")}
        </strong>
      </div>

      <div className="detail-row">
        <span>Approved Amount</span>
        <strong>
          ₹{Number(
            medicalCase.approved_amount || 0
          ).toLocaleString("en-IN")}
        </strong>
      </div>

      <div className="detail-row">
        <span>Remaining Amount</span>
        <strong>
          ₹{Math.max(
            0,
            Number(medicalCase.requested_amount || 0) -
            Number(medicalCase.approved_amount || 0)
          ).toLocaleString("en-IN")}
        </strong>
      </div>

      <div className="detail-row">
        <span>Funding Status</span>

        <span className="status-badge status-verified">
          {Number(medicalCase.approved_amount || 0) >=
          Number(medicalCase.requested_amount || 0)
            ? "FULLY FUNDED"
            : "PARTIALLY FUNDED"}
        </span>
      </div>

    </div>

    <div className="funding-progress-section">
      <div className="funding-progress-header">
        <span>Funding Progress</span>

        <strong>
          {medicalCase.requested_amount > 0
            ? Math.min(
                100,
                Math.round(
                  (medicalCase.approved_amount /
                    medicalCase.requested_amount) *
                    100
                )
              )
            : 0}
          %
        </strong>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${
              medicalCase.requested_amount > 0
                ? Math.min(
                    100,
                    Math.round(
                      (medicalCase.approved_amount /
                        medicalCase.requested_amount) *
                        100
                    )
                  )
                : 0
            }%`,
          }}
        />
      </div>
    </div>
  </section>
)}
{activeOperation === "payment" && (
  <section className="detail-card">
    <h2>Payment Status</h2>

    {paymentLoading && (
      <div className="patient-loading">
        Loading payment information...
      </div>
    )}

    {paymentError && (
      <div className="panel dashboard-error">
        {paymentError}
      </div>
    )}

    {!paymentLoading && !paymentError && !paymentData && (
      <div className="patient-loading">
        No payment information loaded.
      </div>
    )}

    {!paymentLoading &&
      !paymentError &&
      paymentData &&
      paymentData.transactions &&
      paymentData.transactions.length === 0 && (
        <div className="patient-loading">
          No payment transactions found for this case.
        </div>
      )}

    {!paymentLoading &&
      !paymentError &&
      paymentData?.transactions?.map((transaction) => (
        <div
          className="detail-list"
          key={transaction.transaction_reference}
        >
          <div className="detail-row">
            <span>Transaction Reference</span>
            <strong>
              {transaction.transaction_reference}
            </strong>
          </div>

          <div className="detail-row">
            <span>Amount</span>
            <strong>
              ₹{Number(transaction.amount).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="detail-row">
            <span>Payment Status</span>
            <span className="status-badge status-verified">
              {transaction.payment_status}
            </span>
          </div>

          <div className="detail-row">
            <span>Allocation ID</span>
            <strong>
              #{transaction.allocation_id}
            </strong>
          </div>

          <div className="detail-row">
            <span>Donor ID</span>
            <strong>
              #{transaction.donor_id}
            </strong>
          </div>

          <div className="detail-row">
            <span>Destination</span>
            <strong>
              {transaction.destination_reference}
            </strong>
          </div>

          <div className="detail-row">
            <span>Created</span>
            <strong>
              {new Date(
                transaction.created_at
              ).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="detail-row">
            <span>Completed</span>
            <strong>
              {transaction.completed_at
                ? new Date(
                    transaction.completed_at
                  ).toLocaleString("en-IN")
                : "Not completed"}
            </strong>
          </div>
        </div>
      ))}
  </section>
)}
{activeOperation === "audit" && (
  <section className="detail-card audit-status-card">
    <h2>Audit & Security</h2>

    {auditLoading && (
      <div className="patient-loading">
        Loading audit information...
      </div>
    )}

    {auditError && (
      <div className="panel dashboard-error">
        {auditError}
      </div>
    )}

    {!auditLoading &&
      !auditError &&
      auditData &&
      auditData.audit_logs &&
      auditData.audit_logs.length === 0 && (
        <div className="patient-loading">
          No audit events found for this case.
        </div>
      )}

    {!auditLoading &&
      !auditError &&
      auditData?.audit_logs?.map((log) => (
        <div
          className="detail-list"
          key={log.event_reference}
        >
          <div className="detail-row">
            <span>Event Reference</span>
            <strong>
              {log.event_reference}
            </strong>
          </div>

          <div className="detail-row">
            <span>Event Type</span>
            <strong>
              {log.event_type}
            </strong>
          </div>

          <div className="detail-row">
            <span>Action</span>
            <strong>
              {log.action}
            </strong>
          </div>

          <div className="detail-row">
            <span>Status</span>
            <span className="status-badge status-verified">
              {log.status}
            </span>
          </div>

          <div className="detail-row">
            <span>Details</span>
            <strong>
              {log.details || "No details"}
            </strong>
          </div>

          <div className="detail-row">
            <span>Created</span>
            <strong>
              {new Date(
                log.created_at
              ).toLocaleString("en-IN")}
            </strong>
          </div>
        </div>
      ))}
  </section>
)}
{activeOperation === "risk" && (
  <section className="detail-card risk-status-card">
    <h2>Risk Evaluation</h2>

    <div className="detail-list">

      <div className="detail-row">
        <span>Urgency Score</span>
        <strong>
          {medicalCase.urgency_score}
        </strong>
      </div>

      <div className="detail-row">
        <span>Fraud Probability</span>
        <strong>
          {medicalCase.fraud_probability}%
        </strong>
      </div>

      <div className="detail-row">
        <span>Risk Level</span>

        <span
          className={`status-badge ${
            medicalCase.risk_level?.toLowerCase() === "low"
              ? "status-low"
              : ""
          }`}
        >
          {medicalCase.risk_level}
        </span>
      </div>

      <div className="detail-row">
        <span>Case Status</span>

        <strong>
          {medicalCase.status}
        </strong>
      </div>

    </div>
  </section>
)}

      </div>
      {/* ==================================================
    FUNDING JOURNEY
================================================== */}

{selectedPatient.medical_cases?.length > 0 && (() => {

  const medicalCase =
    selectedPatient.medical_cases[0];

  const journey =
    medicalCase.journey || [];

  const funding =
    medicalCase.funding || {};

  const payments =
    medicalCase.payments || {};

  const journeyIcons = {
    REGISTRATION: UserRound,
    IDENTITY_VERIFICATION: ShieldCheck,
    MEDICAL_CASE: Hospital,
    RISK_EVALUATION: ScanSearch,
    FUNDING: WalletCards,
    BANK_SETTLEMENT: Landmark,
  };

  const getJourneyStatusClass = (status) => {

    if (status === "COMPLETED") {
      return "completed";
    }

    if (
      status === "IN_PROGRESS" ||
      status === "PENDING"
    ) {
      return "pending";
    }

    if (
      status === "FAILED" ||
      status === "HIGH_RISK"
    ) {
      return "failed";
    }

    return "pending";
  };

  return (

    <div className="patient-funding-section">

      {/* HEADER */}

      <div className="patient-funding-header">

        <div>

          <div className="eyebrow">
            FUNDING JOURNEY
          </div>

          <h2>
            Patient Funding & Settlement
          </h2>

          <p>
            Track the patient's journey from
            registration through final bank settlement.
          </p>

        </div>

        <div className="funding-summary-badge">

          <span>
            {funding.funding_status || "NOT_FUNDED"}
          </span>

        </div>

      </div>


      {/* HORIZONTAL TIMELINE */}

      <div className="funding-timeline">

        {journey.map((stage, index) => {

          const Icon =
            journeyIcons[stage.stage] || ReceiptText;

          const statusClass =
            getJourneyStatusClass(stage.status);

          return (

            <div
              className="funding-timeline-item"
              key={stage.stage}
            >

              {/* CONNECTING LINE */}

              {index < journey.length - 1 && (
                <div
                  className={`funding-timeline-line ${
                    stage.status === "COMPLETED"
                      ? "completed"
                      : ""
                  }`}
                />
              )}


              {/* ICON */}

              <div
                className={`funding-timeline-icon ${statusClass}`}
              >

                {stage.status === "COMPLETED" ? (

                  <CheckCircle2 size={21} />

                ) : stage.status === "FAILED" ? (

                  <AlertCircle size={21} />

                ) : (

                  <Icon size={21} />

                )}

              </div>


              {/* CONTENT */}

              <div className="funding-timeline-content">

                <span className="funding-stage-label">
                  {stage.label}
                </span>

                <strong
                  className={`funding-stage-status ${statusClass}`}
                >
                  {stage.status}
                </strong>


                {/* DATE */}

                {stage.date && (

                  <span className="funding-stage-date">

                    {new Date(
                      stage.date
                    ).toLocaleDateString("en-GB")}

                  </span>

                )}


                {/* RISK */}

                {stage.risk_level && (

                  <span className="funding-stage-detail">
                    Risk: {stage.risk_level}
                  </span>

                )}


                {/* FUNDING AMOUNT */}

{stage.stage === "FUNDING" && (

  <span className="funding-stage-detail">

    ₹
    {Number(
      stage.amount ?? funding.total_allocated ?? 0
    ).toLocaleString("en-IN")}

    {" / ₹"}

    {Number(
      stage.target ?? medicalCase.approved_amount ?? 0
    ).toLocaleString("en-IN")}

  </span>

)}


                {/* BANK SETTLEMENT */}

                {stage.stage === "BANK_SETTLEMENT" && (

                  <span className="funding-stage-detail">

                    ₹
                    {Number(
                      stage.amount || 0
                    ).toLocaleString()}

                    {" / ₹"}

                    {Number(
                      stage.target || 0
                    ).toLocaleString()}

                  </span>

                )}

              </div>

            </div>

          );

        })}

      </div>


      {/* ==================================================
          FUNDING SUMMARY
      ================================================== */}

      <div className="funding-summary-grid">

        <div className="funding-summary-card">

          <span>
            Approved Amount
          </span>

          <strong>
            ₹
            {Number(
              funding.approved_amount || 0
            ).toLocaleString()}
          </strong>

        </div>


        <div className="funding-summary-card">

          <span>
            Total Allocated
          </span>

          <strong>
            ₹
            {Number(
              funding.total_allocated || 0
            ).toLocaleString()}
          </strong>

        </div>


        <div className="funding-summary-card">

          <span>
            Total Settled
          </span>

          <strong>
            ₹
            {Number(
              funding.total_settled || 0
            ).toLocaleString()}
          </strong>

        </div>


        <div className="funding-summary-card">

          <span>
            Remaining
          </span>

          <strong>
            ₹
            {Number(
              funding.remaining_amount || 0
            ).toLocaleString()}
          </strong>

        </div>

      </div>


      {/* ==================================================
          PAYMENT ACTIVITY
      ================================================== */}

      {payments.transactions?.length > 0 && (

        <div className="funding-activity">

          <div className="funding-activity-header">

            <div>

              <div className="eyebrow">
                PAYMENT ACTIVITY
              </div>

              <h3>
                Bank Settlement Transactions
              </h3>

            </div>

            <span className="activity-count">

              {payments.transaction_count || 0}
              {" "}
              Transactions

            </span>

          </div>


          <div className="funding-activity-list">

            {payments.transactions.map(
              (transaction) => (

                <div
                  className="funding-activity-row"
                  key={
                    transaction.transaction_reference
                  }
                >

                  <div className="activity-icon">

                    <ReceiptText size={17} />

                  </div>


                  <div className="activity-main">

                    <strong>

                      {transaction.transaction_reference}

                    </strong>

                    <span>

                      Allocation #
                      {transaction.allocation_id}

                    </span>

                  </div>


                  <div className="activity-destination">

                    <span>
                      Destination
                    </span>

                    <strong>

                      {transaction.destination_reference
                        || "—"}

                    </strong>

                  </div>


                  <div className="activity-date">

                    <span>
                      Completed
                    </span>

                    <strong>

                      {transaction.completed_at
                        ? new Date(
                            transaction.completed_at
                          ).toLocaleString(
                            "en-GB"
                          )
                        : "—"}

                    </strong>

                  </div>


                  <div className="activity-amount">

                    <strong>

                      ₹
                      {Number(
                        transaction.amount || 0
                      ).toLocaleString()}

                    </strong>

                  </div>


                  <div className="activity-status">

                    <CheckCircle2 size={15} />

                    {transaction.payment_status}

                  </div>

                </div>

              )
            )}

          </div>

        </div>

      )}

    </div>

  );

})()}

    </div>
  );
}
function MedicalCasesPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);

  const navigate = useNavigate();
  const { caseReference } = useParams();

  useEffect(() => {
  async function loadCases() {
    try {
      setLoading(true);
      setError("");

      const data = await getMedicalCases();

      const loadedCases = data.cases || [];

      setCases(loadedCases);

      if (caseReference) {
        const matchedCase = loadedCases.find(
          (item) =>
            item.case_reference === caseReference
        );

        if (matchedCase) {
          setSelectedCase(matchedCase);
        }
      }
    } catch (err) {
      console.error("Failed to load medical cases:", err);

      setError(
        err?.response?.data?.detail ||
        "Unable to load medical cases."
      );
    } finally {
      setLoading(false);
    }
  }

    loadCases();
}, [caseReference]);



  if (loading) {
    return (
      

  <div className="patients-page">
    
        <div className="patients-heading">
          <div>
            <div className="eyebrow">MEDICAL OPERATIONS</div>
            <h1>Medical Cases</h1>
            <p>Loading verified medical funding cases...</p>
          </div>
        </div>

        <div className="medical-cases-state">
          Loading cases...
         </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="medical-cases-page">
        <div className="medical-cases-heading">
          <div>
            <div className="eyebrow">MEDICAL OPERATIONS</div>
            <h1>Medical Cases</h1>
            <p>Review and monitor medical funding cases.</p>
          </div>
        </div>

        <div className="medical-cases-error">
          {error}
        </div>
      </div>
    );
  }

  const verifiedCases = cases.filter(
    (item) => item.status === "VERIFIED"
  ).length;

  const urgentCases = cases.filter(
    (item) => Number(item.urgency_score || 0) >= 70
  ).length;

  const totalRequested = cases.reduce(
    (total, item) =>
      total + Number(item.requested_amount || 0),
    0
  );

  return (
    <div className="medical-cases-page">

      {/* HEADER */}

      <div className="medical-cases-heading">
        <div>
          <div className="eyebrow">
            MEDICAL OPERATIONS
          </div>

          <h1>Medical Cases</h1>

          <p>
            Review and monitor verified medical funding cases.
          </p>
        </div>

        <div className="medical-cases-count">
          <strong>{cases.length}</strong>
          <span>Active cases</span>
        </div>
      </div>


      {/* SUMMARY CARDS */}

      <div className="medical-case-summary">

        <div className="case-summary-card">
          <div className="case-summary-top">
            <span className="case-summary-label">
              TOTAL CASES
            </span>

            <div className="case-summary-icon">
              <FileText size={18} />
            </div>
          </div>

          <div className="case-summary-value">
            {cases.length}
          </div>

          <div className="case-summary-description">
            Cases in the system
          </div>
        </div>


        <div className="case-summary-card">
          <div className="case-summary-top">
            <span className="case-summary-label">
              VERIFIED CASES
            </span>

            <div className="case-summary-icon">
              <ShieldCheck size={18} />
            </div>
          </div>

          <div className="case-summary-value">
            {verifiedCases}
          </div>

          <div className="case-summary-description">
            Successfully verified
          </div>
        </div>


        <div className="case-summary-card">
          <div className="case-summary-top">
            <span className="case-summary-label">
              HIGH URGENCY
            </span>

            <div className="case-summary-icon">
              <AlertTriangle size={18} />
            </div>
          </div>

          <div className="case-summary-value">
            {urgentCases}
          </div>

          <div className="case-summary-description">
            Urgency score 70+
          </div>
        </div>


        <div className="case-summary-card">
          <div className="case-summary-top">
            <span className="case-summary-label">
              REQUESTED FUNDING
            </span>

            <div className="case-summary-icon">
              <WalletCards size={18} />
            </div>
          </div>

          <div className="case-summary-value">
            ₹{totalRequested.toLocaleString()}
          </div>

          <div className="case-summary-description">
            Total requested amount
          </div>
        </div>

      </div>


      {/* CASE TABLE */}

      <div className="medical-cases-table-card">

        <div className="medical-cases-table-header">

          <div>
            <h2>All Medical Cases</h2>

            <p>
              Verified cases currently available
              for review.
            </p>
          </div>

          <span>
            {cases.length} cases
          </span>

        </div>


        <div className="medical-cases-table-wrapper">

          <table className="medical-cases-table">

            <thead>
              <tr>
                <th>Case</th>
                <th>Emergency</th>
                <th>Requested</th>
                <th>Approved</th>
                <th>Urgency</th>
                <th>Risk</th>
                <th>Status</th>
              </tr>
            </thead>


            <tbody>

              {cases.map((medicalCase) => (
  <tr
  key={medicalCase.case_id ?? medicalCase.case_reference ?? index}
  onClick={() =>
    navigate(
      `/medical-cases/${medicalCase.case_reference}`
    )
  }
>

                  <td>
                    <div className="case-reference">
                      {medicalCase.case_reference}
                    </div>

                    <div className="case-id">
                      Case #{medicalCase.case_id}
                    </div>
                  </td>


                  <td>
                    <div className="case-emergency">
                      {medicalCase.emergency_type}
                    </div>

                    <div className="case-diagnosis">
                      {medicalCase.diagnosis_category}
                    </div>
                  </td>


                  <td>
                    <span className="case-money">
                      ₹
                      {Number(
                        medicalCase.requested_amount || 0
                      ).toLocaleString()}
                    </span>
                  </td>


                  <td>
                    <span className="case-money">
                      ₹
                      {Number(
                        medicalCase.approved_amount || 0
                      ).toLocaleString()}
                    </span>
                  </td>


                  <td>
                    <span className="case-urgency">
                      {medicalCase.urgency_score}
                    </span>
                  </td>


                  <td>
                    <span
                      className={`case-risk-badge ${
                        medicalCase.risk_level === "HIGH"
                          ? "case-risk-high"
                          : medicalCase.risk_level === "MEDIUM"
                          ? "case-risk-medium"
                          : "case-risk-low"
                      }`}
                    >
                      {medicalCase.risk_level}
                    </span>
                  </td>


                  <td>
                    <span className="case-status-badge">
                      {medicalCase.status}
                    </span>
                  </td>

                </tr>

))}

            </tbody>

          </table>

        </div>

      </div>


      {/* CASE DETAIL */}

      {selectedCase && (
        <div className="case-detail-overlay">

          <div className="case-detail-modal">

            <div className="case-detail-header">

              <div>
                <div className="eyebrow">
                  CASE DETAILS
                </div>

                <h2>
                  {selectedCase.case_reference}
                </h2>
              </div>

              <button
  className="case-detail-close"
  onClick={() => {
    setSelectedCase(null);
    navigate("/medical-cases");
  }}
>
                <X size={20} />
              </button>

            </div>


            <div className="case-detail-grid">

              <div className="case-detail-item">
                <span>Emergency Type</span>
                <strong>
                  {selectedCase.emergency_type}
                </strong>
              </div>

              <div className="case-detail-item">
                <span>Diagnosis</span>
                <strong>
                  {selectedCase.diagnosis_category}
                </strong>
              </div>

              <div className="case-detail-item">
                <span>Requested Amount</span>
                <strong>
                  ₹
                  {Number(
                    selectedCase.requested_amount || 0
                  ).toLocaleString()}
                </strong>
              </div>

              <div className="case-detail-item">
                <span>Approved Amount</span>
                <strong>
                  ₹
                  {Number(
                    selectedCase.approved_amount || 0
                  ).toLocaleString()}
                </strong>
              </div>

              <div className="case-detail-item">
                <span>Urgency Score</span>
                <strong>
                  {selectedCase.urgency_score}
                </strong>
              </div>

              <div className="case-detail-item">
                <span>Fraud Probability</span>
                <strong>
                  {selectedCase.fraud_probability}%
                </strong>
              </div>

              <div className="case-detail-item">
                <span>Risk Level</span>

                <strong>
                  {selectedCase.risk_level}
                </strong>
              </div>

              <div className="case-detail-item">
                <span>Status</span>

                <strong>
                  {selectedCase.status}
                </strong>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
function DonorsPage() {
  const navigate = useNavigate();
  const { donorReference } = useParams();

  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [donationStatus, setDonationStatus] = useState("ALL");

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedDonor, setSelectedDonor] = useState(null);

  const PAGE_SIZE = 20;

  /*
   * ---------------------------------------------------------
   * READ FILTERS FROM URL
   * ---------------------------------------------------------
   */

  function getFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);

    return {
      consentStatus:
        params.get("consent_status") || "ALL",

      donationStatus:
        params.get("donation_status") || "ALL",

      search:
        params.get("search") || "",
    };
  }

  /*
   * ---------------------------------------------------------
   * UPDATE DONORS URL
   * ---------------------------------------------------------
   */

  function updateDonorsUrl(
    currentStatus,
    currentDonationStatus,
    currentSearch = ""
  ) {
    const params = new URLSearchParams();

    if (currentStatus !== "ALL") {
      params.set(
        "consent_status",
        currentStatus
      );
    }

    if (currentDonationStatus !== "ALL") {
      params.set(
        "donation_status",
        currentDonationStatus
      );
    }

    if (currentSearch.trim()) {
      params.set(
        "search",
        currentSearch.trim()
      );
    }

    const query = params.toString();

    navigate(
      query
        ? `/donors?${query}`
        : "/donors"
    );
  }

  /*
   * ---------------------------------------------------------
   * LOAD DONORS
   * ---------------------------------------------------------
   */

  async function loadDonors(
    currentPage = 1,
    currentStatus = status,
    currentDonationStatus = donationStatus,
    currentSearch = search
  ) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(currentPage),
        page_size: String(PAGE_SIZE),
      });

      /*
       * DETAIL PAGE
       *
       * When a donor reference exists, search specifically
       * for that donor instead of loading page 1 and hoping
       * that donor is included there.
       */

      if (donorReference) {
        params.set(
          "search",
          donorReference
        );
      } else {
        if (currentStatus !== "ALL") {
          params.set(
            "consent_status",
            currentStatus
          );
        }

        if (currentDonationStatus !== "ALL") {
          params.set(
            "donation_status",
            currentDonationStatus
          );
        }

        if (currentSearch.trim()) {
          params.set(
            "search",
            currentSearch.trim()
          );
        }
      }

      console.log(
        "Donor API:",
        `http://127.0.0.1:8001/bank/donors?${params.toString()}`
      );

      const response = await fetch(
        `http://127.0.0.1:8001/bank/donors?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.detail ||
            "Unable to load donors."
        );
      }

      const loadedDonors =
        Array.isArray(data.donors)
          ? data.donors
          : [];

      /*
       * -----------------------------------------------------
       * DETAIL PAGE
       * -----------------------------------------------------
       */

      if (donorReference) {
        const matchedDonor =
          loadedDonors.find(
            (donor) =>
              String(
                donor.donor_reference
              ) ===
              String(donorReference)
          );

        if (!matchedDonor) {
          setSelectedDonor(null);
          setDonors([]);
          setError(
            `Donor ${donorReference} was not found.`
          );
        } else {
          setSelectedDonor(
            matchedDonor
          );
          setError("");
        }

        setTotal(
          data.total_count || loadedDonors.length
        );

        setPage(
          data.page || 1
        );

        setTotalPages(
          data.total_pages || 1
        );

        return;
      }

      /*
       * -----------------------------------------------------
       * NORMAL DONOR LIST
       * -----------------------------------------------------
       */

      setSelectedDonor(null);

      setDonors(
        loadedDonors
      );

      setTotal(
        data.total_count || 0
      );

      setPage(
        data.page || currentPage
      );

      setTotalPages(
        data.total_pages || 1
      );

    } catch (err) {
      console.error(
        "Failed to load donors:",
        err
      );

      setError(
        err.message ||
          "Unable to load donors."
      );

      setDonors([]);
      setSelectedDonor(null);
      setTotal(0);
      setTotalPages(1);

    } finally {
      setLoading(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * INITIAL LOAD
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const urlFilters =
      getFiltersFromUrl();

    setStatus(
      urlFilters.consentStatus
    );

    setDonationStatus(
      urlFilters.donationStatus
    );

    setSearch(
      urlFilters.search
    );

    /*
     * Detail page
     */
    if (donorReference) {
      loadDonors(
        1,
        urlFilters.consentStatus,
        urlFilters.donationStatus,
        donorReference
      );

      return;
    }

    /*
     * Normal donors page
     */
    loadDonors(
      1,
      urlFilters.consentStatus,
      urlFilters.donationStatus,
      urlFilters.search
    );

  }, [donorReference]);

  /*
   * ---------------------------------------------------------
   * SEARCH
   * ---------------------------------------------------------
   */

  function handleSearch(e) {
    const value =
      e.target.value;

    setSearch(value);
    setPage(1);

    updateDonorsUrl(
      status,
      donationStatus,
      value
    );

    loadDonors(
      1,
      status,
      donationStatus,
      value
    );
  }

  /*
   * ---------------------------------------------------------
   * CONSENT STATUS
   * ---------------------------------------------------------
   */

  function handleStatusChange(e) {
    const value =
      e.target.value;

    setStatus(value);
    setPage(1);

    updateDonorsUrl(
      value,
      donationStatus,
      search
    );

    loadDonors(
      1,
      value,
      donationStatus,
      search
    );
  }

  /*
   * ---------------------------------------------------------
   * DONATION STATUS
   * ---------------------------------------------------------
   */

  function handleDonationStatusChange(e) {
    const value =
      e.target.value;

    setDonationStatus(value);
    setPage(1);

    updateDonorsUrl(
      status,
      value,
      search
    );

    loadDonors(
      1,
      status,
      value,
      search
    );
  }

  /*
   * ---------------------------------------------------------
   * PAGINATION
   * ---------------------------------------------------------
   */

  function goToPage(nextPage) {
    if (
      nextPage < 1 ||
      nextPage > totalPages
    ) {
      return;
    }

    setPage(nextPage);

    loadDonors(
      nextPage,
      status,
      donationStatus,
      search
    );
  }

  /*
   * =========================================================
   * DONOR DETAIL PAGE
   * =========================================================
   */

  if (donorReference) {

    if (loading) {
      return (
        <div className="donor-detail-page">
          <div className="empty-state">
            Loading donor record...
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="donor-detail-page">

          <button
            className="donor-back-button"
            onClick={() => {
              const query =
                window.location.search;

              navigate(
                `/donors${query}`
              );
            }}
          >
            <ArrowLeft size={16} />
            Back to Donors
          </button>

          <div className="error-state">
            {error}
          </div>

        </div>
      );
    }

    if (!selectedDonor) {
      return (
        <div className="donor-detail-page">

          <button
            className="donor-back-button"
            onClick={() => {
              const query =
                window.location.search;

              navigate(
                `/donors${query}`
              );
            }}
          >
            <ArrowLeft size={16} />
            Back to Donors
          </button>

          <div className="error-state">
            Donor record not found.
          </div>

        </div>
      );
    }

    return (
      <div className="donor-detail-page">

        {/* BACK TO DONORS */}

        <button
          className="donor-back-button"
          onClick={() => {

            /*
             * Preserve the filters that were selected
             * before opening this donor.
             */

            const query =
              window.location.search;

            navigate(
              `/donors${query}`
            );

          }}
        >
          <ArrowLeft size={16} />
          Back to Donors
        </button>


        {/* DETAILS HEADER */}

        <div className="donor-details-header">

          <div className="donor-details-title">

            <div className="eyebrow">
              DONOR RECORD
            </div>

            <h1>
              {selectedDonor.donor_reference}
            </h1>

            <p>
              Donor identity, consent and
              contribution information.
            </p>

          </div>

          <span className="donor-status">
            {selectedDonor.consent_status}
          </span>

        </div>


        {/* DETAILS GRID */}

        <div className="donor-details-grid">

          {/* DONOR INFORMATION */}

          <div className="donor-info-card">

            <div className="donor-info-card-header">

              <div>

                <div className="eyebrow">
                  DONOR INFORMATION
                </div>

                <h2>
                  Donor Profile
                </h2>

              </div>

              <div className="donor-avatar large">
                {String(
                  selectedDonor.donor_id
                ).slice(-3)}
              </div>

            </div>


            <div className="donor-info-grid">

              <div>
                <span>
                  Donor ID
                </span>

                <strong>
                  {selectedDonor.donor_id}
                </strong>
              </div>


              <div>
                <span>
                  Donor Reference
                </span>

                <strong>
                  {selectedDonor.donor_reference}
                </strong>
              </div>


              <div>
                <span>
                  Account
                </span>

                <strong>
                  {selectedDonor.account_status}
                </strong>
              </div>


              <div>
                <span>
                  Consent
                </span>

                <strong>
                  {selectedDonor.consent_status}
                </strong>
              </div>


              <div>
                <span>
                  Maximum Contribution
                </span>

                <strong>
                  ₹
                  {Number(
                    selectedDonor.maximum_contribution || 0
                  ).toLocaleString("en-IN")}
                </strong>
              </div>


              <div>
                <span>
                  Registered
                </span>

                <strong>
                  {selectedDonor.created_at
                    ? new Date(
                        selectedDonor.created_at
                      ).toLocaleDateString("en-GB")
                    : "—"}
                </strong>
              </div>

            </div>

          </div>


          {/* CONTRIBUTION INFORMATION */}

          <div className="donor-contribution-card">

            <div className="eyebrow">
              CONTRIBUTION
            </div>

            <h2>
              Donation Information
            </h2>


            <div className="contribution-amount">

              ₹
              {Number(
                selectedDonor.actual_contribution || 0
              ).toLocaleString("en-IN")}

            </div>


            <span className="contribution-label">

              {selectedDonor.donation_status ===
              "DONATED"
                ? "Actual contribution recorded"
                : "No contribution recorded"}

            </span>


            <div className="contribution-status">

              <ShieldCheck size={18} />

              <span>
                Donation status:{" "}

                <strong>
                  {selectedDonor.donation_status ||
                    "NOT_DONATED"}
                </strong>
              </span>

            </div>


            <div className="contribution-status">

              <ShieldCheck size={18} />

              <span>
                Donor consent:{" "}

                <strong>
                  {selectedDonor.consent_status ||
                    "UNKNOWN"}
                </strong>
              </span>

            </div>


            <div className="contribution-summary">

              <span>
                Maximum Contribution
              </span>

              <strong>
                ₹
                {Number(
                  selectedDonor.maximum_contribution || 0
                ).toLocaleString("en-IN")}
              </strong>

            </div>


            <p>
              Contribution information is shown
              from authorised funding records.
            </p>

          </div>

        </div>

      </div>
    );
  }


  /*
   * =========================================================
   * DONORS LIST PAGE
   * =========================================================
   */

  return (
    <div className="donor-detail-page">

      {/* BACK TO MEDICAL CASES */}

      <button
        className="donors-back-button"
        onClick={() =>
          navigate("/medical-cases")
        }
      >
        <ArrowLeft size={16} />
        Back to Medical Cases
      </button>


      {/* PAGE HEADER */}

      <div className="donors-heading">

        <div>

          <div className="eyebrow">
            DONOR MANAGEMENT
          </div>

          <h1>
            Donors
          </h1>

          <p>
            Registered donors and authorised
            contribution information.
          </p>

        </div>


        <div className="donors-count">

          {total.toLocaleString("en-IN")}

          {" "}

          Donors

        </div>

      </div>


      {/* SEARCH + FILTERS */}

      <div className="donor-controls">

        <input
          type="text"
          placeholder="Search donors..."
          value={search}
          onChange={handleSearch}
        />


        <select
          value={status}
          onChange={handleStatusChange}
        >

          <option value="ALL">
            All Consent Status
          </option>

          <option value="ACTIVE">
            Active
          </option>

          <option value="PENDING">
            Pending
          </option>

          <option value="DECLINED">
            Declined
          </option>

        </select>


        <select
          value={donationStatus}
          onChange={handleDonationStatusChange}
        >

          <option value="ALL">
            All Donation Status
          </option>

          <option value="DONATED">
            Donated
          </option>

          <option value="NOT_DONATED">
            Not Donated
          </option>

        </select>

      </div>


      {/* LOADING */}

      {loading && (
        <div className="empty-state">
          Loading donor records...
        </div>
      )}


      {/* ERROR */}

      {/* =========================================================
    DONOR TABLE
    Matches the Medical Cases visual structure
   ========================================================= */}

{!loading && !error && (

  <>

    <div className="donors-table-card">

      {/* TABLE HEADER */}

      <div className="donors-table-header">

        <div>
          <h2>All Donors</h2>

          <p>
            Registered donors and authorised contribution information.
          </p>
        </div>

        <span>
          {donors.length} donors
        </span>

      </div>


      {/* COLUMN HEADER */}

      <div className="donors-table-columns">

        <div>DONOR</div>
        <div>ACCOUNT</div>
        <div>CONSENT</div>
        <div>MAX CONTRIBUTION</div>
        <div>ACTUAL DONATION</div>
        <div>STATUS</div>
        <div>ACTION</div>

      </div>


      {/* DONOR ROWS */}

      <div className="donors-table-body">

        {donors.map((donor) => (

          <div
            className="donor-table-row"
            key={donor.donor_id}
          >

            {/* DONOR */}

            <div className="donor-table-identity">

              <strong className="donor-table-reference">
                {donor.donor_reference}
              </strong>

              <span className="donor-table-id">
                Donor #{donor.donor_id}
              </span>

              <span className="donor-table-name">
                {donor.full_name ||
                  `Donor ${donor.donor_id}`}
              </span>

            </div>


            {/* ACCOUNT */}

            <div className="donor-table-value">

              <span className="donor-mobile-label">
                Account
              </span>

              <strong>
                {donor.account_status}
              </strong>

            </div>


            {/* CONSENT */}

            <div className="donor-table-value">

              <span className="donor-mobile-label">
                Consent
              </span>

              <span
                className={`donor-consent-badge donor-consent-${String(
                  donor.consent_status || ""
                ).toLowerCase()}`}
              >
                {donor.consent_status}
              </span>

            </div>


            {/* MAXIMUM CONTRIBUTION */}

            <div className="donor-table-value">

              <span className="donor-mobile-label">
                Maximum
              </span>

              <strong>
                ₹
                {Number(
                  donor.maximum_contribution || 0
                ).toLocaleString("en-IN")}
              </strong>

            </div>


            {/* ACTUAL DONATION */}

            <div className="donor-table-value">

              <span className="donor-mobile-label">
                Actual
              </span>

              <strong>
                ₹
                {Number(
                  donor.actual_contribution || 0
                ).toLocaleString("en-IN")}
              </strong>

            </div>


            {/* DONATION STATUS */}

            <div className="donor-table-value">

              <span className="donor-mobile-label">
                Donation
              </span>

              <span
                className={`donor-donation-badge ${
                  donor.donation_status === "DONATED"
                    ? "donor-donated"
                    : "donor-not-donated"
                }`}
              >
                {donor.donation_status ||
                  "NOT_DONATED"}
              </span>

            </div>


            {/* ACTION */}

            <div className="donor-table-action">

              <button
                className="donor-view-button"
                onClick={() => {

                  const params =
                    new URLSearchParams();

                  if (status !== "ALL") {
                    params.set(
                      "consent_status",
                      status
                    );
                  }

                  if (
                    donationStatus !==
                    "ALL"
                  ) {
                    params.set(
                      "donation_status",
                      donationStatus
                    );
                  }

                  if (search.trim()) {
                    params.set(
                      "search",
                      search.trim()
                    );
                  }

                  const query =
                    params.toString();

                  navigate(
                    `/donors/${donor.donor_reference}${
                      query
                        ? `?${query}`
                        : ""
                    }`
                  );

                }}
              >

                <Eye size={14} />

                View

                <ArrowRight size={15} />

              </button>

            </div>

          </div>

        ))}


        {donors.length === 0 && (

          <div className="empty-state">
            No donor records found.
          </div>

        )}

      </div>

    </div>


    {/* PAGINATION */}

    {totalPages > 1 && (

      <div className="donor-pagination">

        <button
          disabled={page === 1}
          onClick={() =>
            goToPage(page - 1)
          }
        >
          Previous
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={
            page === totalPages
          }
          onClick={() =>
            goToPage(page + 1)
          }
        >
          Next
        </button>

      </div>

    )}

  </>

)}

    </div>
  );
}
function CreateMedicalCasePage() {
  const { patientReference } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);

  const [emergencyType, setEmergencyType] = useState("");
  const [diagnosisCategory, setDiagnosisCategory] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPatient() {
      try {
        setLoading(true);
        setError("");

        const response = await getPatient(patientReference);

        setPatient(response?.patient || null);

        if (!response?.patient) {
          setError("Patient record not found.");
        }

      } catch (err) {
        console.error(
          "Failed to load patient:",
          err
        );

        setError(
          err?.response?.data?.detail ||
          err?.message ||
          "Unable to load patient."
        );

      } finally {
        setLoading(false);
      }
    }

    if (patientReference) {
      loadPatient();
    }
  }, [patientReference]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!patient?.patient_id) {
      setError("Patient ID is missing.");
      return;
    }

    if (!emergencyType.trim()) {
      setError("Please select an emergency type.");
      return;
    }

    if (!requestedAmount || Number(requestedAmount) <= 0) {
      setError("Please enter a valid requested amount.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createMedicalCase({
        patient_id: Number(patient.patient_id),
        emergency_type: emergencyType.trim(),
        diagnosis_category:
          diagnosisCategory.trim() || null,
        requested_amount: Number(requestedAmount),
      });

      console.log(
        "Medical case created:",
        response
      );

      if (!response?.success) {
        setError(
          response?.message ||
          "Unable to create medical case."
        );
        return;
      }

      /*
       * Medical case now exists with PENDING status.
       *
       * Move to the existing Patient Verification page.
       */
      navigate(
        `/patients/${patientReference}/verification`
      );

    } catch (err) {
      console.error(
        "Medical case creation failed:",
        err
      );

      const detail =
        err?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : err?.message ||
            "Unable to create medical case."
      );

    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="patients-page">
        <div className="empty-state">
          Loading patient information...
        </div>
      </div>
    );
  }

  return (
    <div className="patients-page">

      <div className="patient-details-header">

        <button
          type="button"
          className="patient-back-button"
          onClick={() =>
            navigate(
              `/patients/${patientReference}`
            )
          }
        >
          <ArrowLeft size={16} />
          Back to Patient
        </button>

        <div className="patient-details-title">

          <div className="eyebrow">
            MEDICAL CASE
          </div>

          <h1>
            Create Medical Case
          </h1>

          <p>
            Create a medical funding case for this patient.
          </p>

        </div>

      </div>


      <div
        className="register-patient-card"
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >

        <div className="register-patient-header">

          <div>

            <div className="eyebrow">
              PATIENT RECORD
            </div>

            <h2>
              {patient?.patient_reference ||
                patientReference}
            </h2>

            <p>
              {patient?.full_name || "Patient"}
            </p>

          </div>

        </div>


        <div
          className="patient-info-grid"
          style={{
            marginBottom: "30px",
          }}
        >

          <div>
            <span>Patient ID</span>
            <strong>
              {patient?.patient_id ?? "—"}
            </strong>
          </div>

          <div>
            <span>Patient Reference</span>
            <strong>
              {patient?.patient_reference ?? "—"}
            </strong>
          </div>

          <div>
            <span>Full Name</span>
            <strong>
              {patient?.full_name ?? "—"}
            </strong>
          </div>

          <div>
            <span>Identity Status</span>
            <strong>
              {patient?.identity_status ?? "—"}
            </strong>
          </div>

        </div>


        <form onSubmit={handleSubmit}>

          <div className="register-form-grid">

            <div className="form-field">

              <label>
                Emergency Type
              </label>

              <select
                value={emergencyType}
                onChange={(e) =>
                  setEmergencyType(
                    e.target.value
                  )
                }
                required
              >

                <option value="">
                  Select emergency type
                </option>

                <option value="EMERGENCY">
                  Emergency
                </option>

                <option value="URGENT">
                  Urgent
                </option>

                <option value="NON_URGENT">
                  Non-Urgent
                </option>

              </select>

            </div>


            <div className="form-field">

              <label>
                Requested Amount
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={requestedAmount}
                onChange={(e) =>
                  setRequestedAmount(
                    e.target.value
                  )
                }
                placeholder="Enter requested funding amount"
                required
              />

            </div>


            <div
              className="form-field"
              style={{
                gridColumn: "1 / -1",
              }}
            >

              <label>
                Diagnosis Category
              </label>

              <input
                type="text"
                value={diagnosisCategory}
                onChange={(e) =>
                  setDiagnosisCategory(
                    e.target.value
                  )
                }
                placeholder="Enter medical diagnosis category"
              />

            </div>

          </div>


          {error && (
            <div className="register-error">
              {error}
            </div>
          )}


          <div className="register-form-actions">

            <button
              type="button"
              className="register-cancel-button"
              onClick={() =>
                navigate(
                  `/patients/${patientReference}`
                )
              }
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="register-patient-button"
              disabled={submitting}
            >
              {submitting
                ? "Creating Case..."
                : "Create Medical Case →"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}
function PatientsPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);

const [loading, setLoading] = useState(true);
const [detailsLoading, setDetailsLoading] = useState(false);
const [error, setError] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
const [registerLoading, setRegisterLoading] = useState(false);
const [registerError, setRegisterError] = useState("");
const [registerSuccess, setRegisterSuccess] = useState(null);

const [formData, setFormData] = useState({
  full_name: "",
  date_of_birth: "",
  government_id_reference: "",
  age: "",
  gender: "",
});

    useEffect(() => {
  loadPatients();
}, []);
useEffect(() => {
  if (patientId) {
    loadPatientDetails(patientId);
  } else {
    setSelectedPatientDetails(null);
  }
}, [patientId]);

async function loadPatients() {
  try {
    setLoading(true);
    setError("");

    const response = await getPatients();

    const patientList = response?.patients || [];

    setPatients(patientList);

  } catch (err) {
    console.error(
      "Failed to load patients:",
      err
    );

    setError(
      err?.response?.data?.detail ||
      err?.message ||
      "Unable to load patients."
    );

  } finally {
    setLoading(false);
  }
}
async function loadPatientDetails(patientReference) {
  try {
    setDetailsLoading(true);

    const response = await getPatient(patientReference);

    setSelectedPatientDetails(response);

  } catch (err) {
    console.error(
      "Failed to load patient details:",
      err
    );

    setSelectedPatientDetails(null);

    setError(
      err?.response?.data?.detail ||
      err?.message ||
      "Unable to load patient details."
    );

  } finally {
    setDetailsLoading(false);
  }
}

async function handleRegisterPatient(e) {
  e.preventDefault();

  setRegisterError("");
  setRegisterSuccess(null);

  if (!formData.full_name.trim()) {
    setRegisterError("Please enter patient's full name.");
    return;
  }

  if (!formData.date_of_birth) {
    setRegisterError("Please enter patient's date of birth.");
    return;
  }

  if (!formData.government_id_reference.trim()) {
    setRegisterError("Please enter government ID reference.");
    return;
  }

  if (!formData.age) {
    setRegisterError("Please enter patient age.");
    return;
  }

  if (!formData.gender) {
    setRegisterError("Please select patient gender.");
    return;
  }

  try {
    setRegisterLoading(true);

    const response = await registerPatient({
      full_name: formData.full_name.trim(),
      date_of_birth: formData.date_of_birth,
      government_id_reference:
        formData.government_id_reference.trim(),
      age: Number(formData.age),
      gender: formData.gender,
    });

    const newPatient = response?.patient;

    setRegisterSuccess(newPatient);

    setFormData({
      full_name: "",
      date_of_birth: "",
      government_id_reference: "",
      age: "",
      gender: "",
    });

    await loadPatients();

  } catch (err) {
    console.error(
      "Patient registration failed:",
      err
    );

    const detail =
      err?.response?.data?.detail;

    let errorMessage =
      "Unable to register patient.";

    if (Array.isArray(detail)) {
      errorMessage = detail
        .map((item) => {
          const field = Array.isArray(item?.loc)
            ? item.loc[item.loc.length - 1]
            : "field";

          return `${field}: ${item?.msg || "Invalid value"}`;
        })
        .join(", ");
    } else if (typeof detail === "string") {
      errorMessage = detail;
    } else if (err?.message) {
      errorMessage = err.message;
    }

    setRegisterError(errorMessage);

  } finally {
    setRegisterLoading(false);
  }
}

  const selectedPatient =
  selectedPatientDetails?.patient ||
  patients.find(
    (patient) =>
      patient.patient_reference === patientId ||
      String(patient.patient_id) === patientId
  );
  const selectedMedicalCase =
  selectedPatientDetails?.medical_cases?.[0] || null;

const selectedJourney =
  selectedMedicalCase?.journey || [];
  if (patientId && detailsLoading) {
  return (
    <div className="patients-page">
      <div className="empty-state">
        Loading patient record...
      </div>
    </div>
  );
}
  if (selectedPatient) {
  return (
    <div className="patients-page">
      
      <div className="patient-details-header">

        <button
          className="patient-back-button"
          onClick={() => navigate("/patients")}
        >
          <ArrowLeft size={16} />
          Back to Patients
        </button>

        <div className="patient-details-title">
          <div className="eyebrow">
            PATIENT RECORD
          </div>

          <h1>
            {selectedPatient.patient_reference}
          </h1>

          <p>
  Patient information and verification record.
</p>
        </div>

        <span className="patient-status">
          {selectedPatient.identity_status}
        </span>

      </div>


      <div className="patient-details-grid">

        <div className="patient-info-card">

          <div className="patient-info-card-header">
            <div>
              <div className="eyebrow">
                PATIENT INFORMATION
              </div>

              <h2>
                Patient Profile
              </h2>
            </div>

            <div className="patient-avatar large">
              001
            </div>
          </div>


          <div className="patient-info-grid">

  <div>
    <span>Patient ID</span>
    <strong>
      {selectedPatient.patient_id ?? "—"}
    </strong>
  </div>

  <div>
    <span>Patient Reference</span>
    <strong>
      {selectedPatient.patient_reference ?? "—"}
    </strong>
  </div>

  <div>
    <span>Full Name</span>
    <strong>
      {selectedPatient.full_name || "—"}
    </strong>
  </div>

  <div>
    <span>Date of Birth</span>
    <strong>
      {selectedPatient.date_of_birth
        ? new Date(
            selectedPatient.date_of_birth
          ).toLocaleDateString("en-GB")
        : "—"}
    </strong>
  </div>

  <div>
    <span>Age</span>
    <strong>
      {selectedPatient.age ?? "—"}
    </strong>
  </div>

  <div>
    <span>Gender</span>
    <strong>
      {selectedPatient.gender || "—"}
    </strong>
  </div>

  <div>
    <span>Government ID Reference</span>
    <strong>
      {selectedPatient.government_id_reference || "—"}
    </strong>
  </div>

  <div>
    <span>Identity Status</span>
    <strong>
      {selectedPatient.identity_status || "—"}
    </strong>
  </div>

  <div>
    <span>Registered</span>
    <strong>
      {selectedPatient.created_at
        ? new Date(
            selectedPatient.created_at
          ).toLocaleDateString("en-GB")
        : "—"}
    </strong>
  </div>

</div>

        </div>


        <div className="patient-verification-card">

  <div className="eyebrow">
    VERIFICATION
  </div>

  {/* =====================================================
      VERIFIED
      ===================================================== */}

  {selectedPatient.identity_status === "VERIFIED" ? (

  <>
    <h2>
      Identity Verified
    </h2>

    <div className="verification-status">
      <ShieldCheck size={20} />

      <span>
        Patient identity has been verified
      </span>
    </div>

    <p>
      Patient identity has been verified and the
      record can proceed through the funding
      eligibility workflow.
    </p>
  </>

) : selectedPatient.identity_status === "UNDER_REVIEW" ? (

  <>
    <h2>
      Identity Verification Under Review
    </h2>

    <div className="verification-status">
      <ShieldCheck size={20} />

      <span>
        Patient verification has been submitted
        and is currently under review.
      </span>
    </div>

    <p>
      The patient application and supporting medical
      document have been submitted successfully.
      Verification checks are currently pending.
    </p>

    <div
      className="verification-review-status"
      style={{
        marginTop: "20px",
        padding: "16px",
        borderRadius: "10px",
        background: "#f0faf8",
        border: "1px solid #cceee8",
      }}
    >
      <strong>
        Verification Submitted
      </strong>

      <span
        style={{
          display: "block",
          marginTop: "6px",
          fontSize: "13px",
          color: "#667085",
        }}
      >
        Please wait for the verification process
        to be completed.
      </span>
    </div>
  </>

) : !selectedMedicalCase ? (

  <>
    <h2>
      Medical Case Required
    </h2>

    <div className="verification-status">
      <ShieldCheck size={20} />

      <span>
        Patient identity information is registered,
        but no medical case has been created.
      </span>
    </div>

    <p>
      Create a medical case for this patient before
      starting the verification process.
    </p>

    <button
  className="register-patient-button"
  onClick={() =>
    navigate(
      `/patients/${selectedPatient.patient_reference}/create-case`
    )
  }
>
  Create Medical Case →
</button>
  </>

) : (

  <>
    <h2>
      Identity Verification Pending
    </h2>

    <div className="verification-status">
      <ShieldCheck size={20} />

      <span>
        Patient identity has not yet been verified
      </span>
    </div>

    <p>
      A medical case exists for this patient.
      Complete the patient verification process
      before the case can proceed to risk evaluation.
    </p>

    <button
      type="button"
      className="register-patient-button"
      onClick={() =>
        navigate(
          `/patients/${selectedPatient.patient_reference}/verification`
        )
      }
    >
      Start Patient Verification →
    </button>
  </>

)}

</div>

      </div>

      {/* FUNDING JOURNEY */}

<div className="patient-funding-journey">

  <div className="eyebrow">
    FUNDING JOURNEY
  </div>

  <h2>Patient Funding Journey</h2>

  <div className="funding-journey-track">

    <div className="funding-journey-step completed">

      <div className="funding-journey-icon">
        ✓
      </div>

      <div className="funding-journey-content">
        <strong>
          Patient Registration
        </strong>

        <span>
          Completed
        </span>
      </div>

    </div>


    <div className="funding-journey-connector" />


    <div className="funding-journey-step completed">

      <div className="funding-journey-icon">
        ✓
      </div>

      <div className="funding-journey-content">
        <strong>
          Identity Verification
        </strong>

        <span>
          {selectedPatient.identity_status}
        </span>
      </div>

    </div>


    <div className="funding-journey-connector" />


    <div className="funding-journey-step completed">

      <div className="funding-journey-icon">
        ✓
      </div>

      <div className="funding-journey-content">

        <strong>
          Medical Case
        </strong>

        <span>
          {selectedMedicalCase?.emergency_type || "Medical Case"}
        </span>

      </div>

    </div>


    <div className="funding-journey-connector" />


    <div className="funding-journey-step completed">

      <div className="funding-journey-icon">
        ✓
      </div>

      <div className="funding-journey-content">

        <strong>
          Risk Evaluation
        </strong>

        <span>
          {selectedMedicalCase?.risk_level || "PENDING"}
        </span>

      </div>

    </div>


    <div className="funding-journey-connector" />


    <div className="funding-journey-step completed">

      <div className="funding-journey-icon">
        ₹
      </div>

      <div className="funding-journey-content">

        <strong>
          Funding
        </strong>

        <span>
  ₹
  {Number(
    selectedMedicalCase?.funding?.total_allocated || 0
  ).toLocaleString()}
  {" / ₹"}
  {Number(
    selectedMedicalCase?.approved_amount || 0
  ).toLocaleString()}
</span>

<small>
  {selectedMedicalCase?.funding?.funding_status ||
    "NOT_FUNDED"}
</small>

      </div>

    </div>

  </div>

</div>

    </div>
    
  );
}

  return (
    <div className="patients-page">
      

      {/* PAGE HEADER */}

      <div className="patients-heading">

        <div>
          <div className="eyebrow">
            PATIENT MANAGEMENT
          </div>

          <h1>Patients</h1>

          <p>
  Patient records and verification status.
</p>
        </div>

        <div className="patients-heading-actions">
          {registerOpen && (
  <div className="register-patient-card">

    <div className="register-patient-header">
      <div>
        <div className="eyebrow">
          PATIENT REGISTRATION
        </div>

        <h2>Register New Patient</h2>

        <p>
          Create a new patient record in MedBridge.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setRegisterOpen(false)}
      >
        ×
      </button>
    </div>

    {registerSuccess ? (

      <div className="register-success">

        <div className="register-success-icon">
          ✓
        </div>

        <h3>
          Patient Registered Successfully
        </h3>

        <p>
          Patient reference
        </p>

        <strong>
          {registerSuccess.patient_reference}
        </strong>

        <div className="register-success-details">

          <span>
            Patient ID:{" "}
            {registerSuccess.patient_id}
          </span>

          <span>
            Identity:{" "}
            {registerSuccess.identity_status}
          </span>

        </div>

        <button
          type="button"
          className="register-patient-button"
          onClick={() => {
            setRegisterSuccess(null);
            setRegisterOpen(false);
          }}
        >
          Done
        </button>

      </div>

    ) : (

      <form onSubmit={handleRegisterPatient}>

        <div className="register-form-grid">

          <div className="form-field">

  <label>
    Full Name
  </label>

  <input
    type="text"
    value={formData.full_name}
    onChange={(e) =>
      setFormData({
        ...formData,
        full_name: e.target.value,
      })
    }
    placeholder="Enter patient's full name"
    required
  />

</div>

<div className="form-field">

  <label>
    Date of Birth
  </label>

  <input
    type="date"
    value={formData.date_of_birth}
    onChange={(e) =>
      setFormData({
        ...formData,
        date_of_birth: e.target.value,
      })
    }
    required
  />

</div>

<div className="form-field">

  <label>
    Government ID Reference
  </label>

  <input
    type="text"
    value={formData.government_id_reference}
    onChange={(e) =>
      setFormData({
        ...formData,
        government_id_reference: e.target.value,
      })
    }
    placeholder="Enter government ID reference"
    required
  />

</div>

          <div className="form-field">

            <label>
              Age
            </label>

            <input
              type="number"
              min="0"
              max="150"
              value={formData.age}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  age: e.target.value,
                })
              }
              placeholder="Enter age"
            />

          </div>

          <div className="form-field">

            <label>
              Gender
            </label>

            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  gender: e.target.value,
                })
              }
            >
              <option value="">
                Select gender
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Female">
                Female
              </option>

              <option value="Other">
                Other
              </option>

            </select>

          </div>

        </div>

        {registerError && (
          <div className="register-error">
            {registerError}
          </div>
        )}

        <div className="register-form-actions">

          <button
            type="button"
            className="register-cancel-button"
            onClick={() => {
              setRegisterOpen(false);
              setRegisterError("");
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="register-patient-button"
            disabled={registerLoading}
          >
            {registerLoading
              ? "Registering..."
              : "Register Patient"}
          </button>

        </div>

      </form>

    )}

  </div>
)}


  <div className="patients-count">
    {patients.length} Patient
    {patients.length !== 1 ? "s" : ""}
  </div>

  <button
    className="register-patient-button"
    onClick={() => {
      setRegisterOpen(true);
      setRegisterError("");
      setRegisterSuccess(null);
    }}
  >
    + Register Patient
  </button>

</div>

      </div>


      {/* LOADING */}

      {loading && (
        <div className="empty-state">
          Loading patient records...
        </div>
      )}


      {/* ERROR */}

      {!loading && error && (
        <div className="error-state">
          {error}
        </div>
      )}


      {/* PATIENT LIST */}

      {!loading && !error && (
        <div className="patients-grid">

          {patients.map((patient) => (

            <section
  className="patient-card"
  key={patient.patient_id}
>
  <div className="patient-card-header">

    <div className="patient-avatar">
      {patient.patient_reference?.slice(-3)}
    </div>

    <div className="patient-main-info">
      <div className="eyebrow">
  {patient.identity_status === "VERIFIED"
    ? "VERIFIED PATIENT"
    : "PATIENT RECORD"}
</div>

      <h2>
        {patient.patient_reference}
      </h2>

      <span>
        Patient ID #{patient.patient_id}
      </span>
    </div>

    <span className="patient-status">
      {patient.identity_status}
    </span>

  </div>

  <div className="patient-details">

    <div className="patient-detail">
      <span>Age</span>
      <strong>{patient.age}</strong>
    </div>

    <div className="patient-detail">
      <span>Gender</span>
      <strong>{patient.gender}</strong>
    </div>

    <div className="patient-detail">
      <span>Identity</span>
      <strong>{patient.identity_status}</strong>
    </div>

    <div className="patient-detail">
      <span>Registered</span>
      <strong>
        {new Date(patient.created_at).toLocaleDateString("en-GB")}
      </strong>
    </div>

  </div>

  <div className="patient-card-footer">

  <span>
    {patient.identity_status === "VERIFIED"
      ? "Medical record verified"
      : "Verification pending"}
  </span>

  <button
  className="patient-view-button"
  onClick={() =>
  navigate(`/patients/${patient.patient_reference}`)
}
>
  <Eye size={15} />
  View Patient
  <ArrowRight size={14} />
</button>
</div>

</section>

          ))}


          {patients.length === 0 && (
            <div className="empty-state">
              No patient records found.
            </div>
          )}

        </div>
      )}

    </div>
  );
}
function FundingPage() {
  const navigate = useNavigate();
  const [fundingRequests, setFundingRequests] = useState([]);
  const [fundingStats, setFundingStats] = useState({
    total: 0,
    pending: 0,
    settled: 0,
  });
  const [fundingLoading, setFundingLoading] = useState(true);
  const [fundingError, setFundingError] = useState("");
  const [fundingDonorCounts, setFundingDonorCounts] = useState({});
  const [selectedFunding, setSelectedFunding] = useState(null);
const [fundingDetailsLoading, setFundingDetailsLoading] = useState(false);
const [fundingDetailsError, setFundingDetailsError] = useState("");

const [fundingSearch, setFundingSearch] = useState("");
const [fundingStatusFilter, setFundingStatusFilter] = useState("");
const [fundingMinAmount, setFundingMinAmount] = useState("");
const [fundingMaxAmount, setFundingMaxAmount] = useState("");

  useEffect(() => {
    loadFundingData();
  }, []);
  async function openFundingDetails(funding) {
  try {
    setFundingDetailsLoading(true);
    setFundingDetailsError("");

    // Change the URL
    navigate(`/funding/${funding.funding_id}`);

    // Load funding details
    const data = await getAdminFundingDetails(
      funding.funding_id
    );

    setSelectedFunding(data);

  } catch (error) {
    console.error(
      "Funding details loading failed:",
      error
    );

    setFundingDetailsError(
      "Unable to load funding details."
    );
  } finally {
    setFundingDetailsLoading(false);
  }
}

  async function loadFundingData() {
    try {
      setFundingLoading(true);
      setFundingError("");

      const [requestsResponse, statsResponse] = await Promise.all([
        fetch("http://127.0.0.1:8001/bank/funding-requests"),
        fetch("http://127.0.0.1:8001/bank/funding-requests/statistics"),
      ]);

      const requestsData = await requestsResponse.json();
      const statsData = await statsResponse.json();

      if (!requestsResponse.ok) {
        throw new Error(
          requestsData.detail || "Unable to load funding requests."
        );
      }

      if (!statsResponse.ok) {
        throw new Error(
          statsData.detail || "Unable to load funding statistics."
        );
      }

      const requests = Array.isArray(requestsData)
  ? requestsData
  : requestsData.funding_requests || [];

setFundingRequests(requests);

// Load donor counts for each funding request
const donorCountEntries = await Promise.all(
  requests.map(async (funding) => {
    try {
      const details = await getAdminFundingDetails(
        funding.funding_id
      );

      return [
        funding.funding_id,
        details?.donor_summary?.donor_count ??
          details?.donors?.length ??
          0,
      ];
    } catch (error) {
      console.error(
        `Unable to load donor count for funding ${funding.funding_id}:`,
        error
      );

      return [funding.funding_id, 0];
    }
  })
);

setFundingDonorCounts(
  Object.fromEntries(donorCountEntries)
);

      setFundingStats({
        total:
          statsData.total ??
          statsData.total_requests ??
          0,

        pending:
          statsData.pending ??
          statsData.pending_requests ??
          0,

        settled:
          statsData.settled ??
          statsData.settled_amount ??
          0,
      });

    } catch (error) {
      console.error("Funding loading failed:", error);
      setFundingError(
        error.message || "Unable to load funding information."
      );
    } finally {
      setFundingLoading(false);
    }
  }
    const fundingStatuses = [
    ...new Set(
      fundingRequests
        .map((funding) => funding.status)
        .filter(Boolean)
    ),
  ];

  const filteredFundingRequests = fundingRequests.filter((funding) => {
    const search = fundingSearch.trim().toLowerCase();

    const searchableText = [
      funding.funding_id,
      funding.id,
      funding.funding_reference,
      funding.patient_reference,
      funding.patient_id,
      funding.transaction_reference,
      funding.medbridge_transaction_reference,
      funding.case_reference,
      funding.hospital_account_reference,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !search || searchableText.includes(search);

    const matchesStatus =
      !fundingStatusFilter ||
      String(funding.status || "").toLowerCase() ===
        fundingStatusFilter.toLowerCase();

    const requestedAmount = Number(
      funding.requested_amount || 0
    );

    const minAmount =
      fundingMinAmount === ""
        ? null
        : Number(fundingMinAmount);

    const maxAmount =
      fundingMaxAmount === ""
        ? null
        : Number(fundingMaxAmount);

    const matchesMinAmount =
      minAmount === null ||
      (!Number.isNaN(minAmount) &&
        requestedAmount >= minAmount);

    const matchesMaxAmount =
      maxAmount === null ||
      (!Number.isNaN(maxAmount) &&
        requestedAmount <= maxAmount);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesMinAmount &&
      matchesMaxAmount
    );
  });

  function clearFundingFilters() {
    setFundingSearch("");
    setFundingStatusFilter("");
    setFundingMinAmount("");
    setFundingMaxAmount("");
  }

  return (
    <div className="funding-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="page-heading">
        <div>
          <div className="eyebrow">
            FUNDING
          </div>

          <h1>Funding</h1>

          <p>
            Manage medical funding requests, donor allocations and settlements.
          </p>
        </div>

        <div className="system-status">
          <span className="status-dot" />
          System operational
        </div>
      </div>


      {/* =====================================================
          SUMMARY
          ===================================================== */}

      <div className="funding-summary-grid">

        <div className="funding-summary-card">
          <span>Total Funding Requests</span>
          <strong>
            {fundingStats.total}
          </strong>
        </div>

        <div className="funding-summary-card">
          <span>Pending Funding</span>
          <strong>
            {fundingStats.pending}
          </strong>
        </div>

        <div className="funding-summary-card">
          <span>Settled Funding</span>
          <strong>
            {Number(fundingStats.settled || 0).toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="funding-summary-card">
          <span>Donors Contributing</span>
          <strong>
            {Object.values(fundingDonorCounts).reduce(
      (total, count) => total + Number(count || 0),
      0
    )}

          </strong>
        </div>

      </div>


      {/* =====================================================
          FUNDING REQUESTS
          ===================================================== */}

      <div className="funding-table-card">

        <div className="funding-table-header">

          <div>
            <h2>Funding Requests</h2>

            <p>
              Medical funding requests and their current settlement status.
            </p>
          </div>

          <span>
  {filteredFundingRequests.length} OF {fundingRequests.length} REQUESTS
</span>

        </div>
        <div className="funding-filters">

  <div className="funding-search-box">
    <label>Search</label>

    <input
      type="text"
      value={fundingSearch}
      onChange={(e) => setFundingSearch(e.target.value)}
      placeholder="Search funding ID, patient, reference..."
    />
  </div>


  <div className="funding-filter-box">
    <label>Status</label>

    <select
      value={fundingStatusFilter}
      onChange={(e) =>
        setFundingStatusFilter(e.target.value)
      }
    >
      <option value="">All statuses</option>

      {fundingStatuses.map((status) => (
        <option
          key={status}
          value={status}
        >
          {status}
        </option>
      ))}
    </select>
  </div>


  <div className="funding-filter-box">
    <label>Min Amount</label>

    <input
      type="number"
      min="0"
      value={fundingMinAmount}
      onChange={(e) =>
        setFundingMinAmount(e.target.value)
      }
      placeholder="₹ Min"
    />
  </div>


  <div className="funding-filter-box">
    <label>Max Amount</label>

    <input
      type="number"
      min="0"
      value={fundingMaxAmount}
      onChange={(e) =>
        setFundingMaxAmount(e.target.value)
      }
      placeholder="₹ Max"
    />
  </div>


  <button
    type="button"
    className="funding-clear-filters"
    onClick={clearFundingFilters}
  >
    Clear Filters
  </button>

</div>


        {/* Loading */}

        {fundingLoading ? (

          <div className="funding-empty-state">
            Loading funding requests...
          </div>

        ) : fundingError ? (

          /* Error */

          <div className="funding-empty-state">
            {fundingError}
          </div>

        ) : fundingRequests.length === 0 ? (

  <div className="funding-empty-state">
    No funding requests available.
  </div>

) : filteredFundingRequests.length === 0 ? (

  <div className="funding-empty-state">
    No funding requests match your filters.
  </div>

        ) : (

          /* =================================================
             TABLE
             ================================================= */

          <div className="funding-table">

            <div className="funding-table-columns">

              <div>Funding Reference</div>

              <div>Patient</div>

              <div>Requested</div>

              <div>Settled</div>

              <div>Donors</div>

              <div>Status</div>

              <div>Action</div>

            </div>


            <div className="funding-table-body">

              {filteredFundingRequests.map((funding) => (

                <div
                  className="funding-table-row"
                  key={
                    funding.funding_id ||
                    funding.id ||
                    funding.funding_reference
                  }
                >

                  {/* Funding reference */}

                  <div>
                    <strong>
                      {funding.funding_reference ||
                        `FUND-${funding.funding_id}`}
                    </strong>
                  </div>


                  {/* Patient */}

                  <div>
                    {funding.patient_reference ||
                      funding.patient_id ||
                      "—"}
                  </div>


                  {/* Requested */}

                  <div>
                    ₹
                    {Number(
                      funding.requested_amount || 0
                    ).toLocaleString("en-IN")}
                  </div>


                  {/* Settled */}

<div>
  ₹
  {Number(
    funding.settled_amount || 0
  ).toLocaleString("en-IN")}
</div>


{/* Donors */}

<div>
  {fundingDonorCounts[funding.funding_id] ?? 0}
</div>


{/* Status */}

<div>
  <span className="funding-status">
    {funding.status || "UNKNOWN"}
  </span>
</div>


                  {/* Action */}

                  <div>

                    <button
  className="funding-view-button"
  onClick={(e) => {
    e.stopPropagation();
    openFundingDetails(funding);
  }}
>
  View →
</button>

                  </div>

                </div>

              ))}

            </div>

          </div>

        )}

      </div>
{selectedFunding && (
  <div
    className="funding-modal-overlay"
    onClick={() => {
  setSelectedFunding(null);
  navigate("/funding", { replace: true });
}}
  >
    <div
      className="funding-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <button
  onClick={() => {
  setSelectedFunding(null);
  setFundingDetailsError("");
  navigate("/funding", { replace: true });
}}
>
  ×
</button>

      <div className="funding-modal-eyebrow">
        FUNDING DETAILS
      </div>

      <h2>
        {selectedFunding.funding_request?.funding_reference ||
          selectedFunding.funding_reference}
      </h2>

      {fundingDetailsLoading ? (
        <div className="funding-modal-loading">
          Loading funding details...
        </div>
      ) : fundingDetailsError ? (
        <div className="funding-modal-error">
          {fundingDetailsError}
        </div>
      ) : (
        <>
          <div className="funding-detail-grid">

            <div className="funding-detail-card">
              <span>Funding Reference</span>
              <strong>
                {selectedFunding.funding_request?.funding_reference}
              </strong>
            </div>

            <div className="funding-detail-card">
              <span>Patient</span>
              <strong>
                {selectedFunding.funding_request?.patient_reference}
              </strong>
            </div>

            <div className="funding-detail-card">
              <span>Requested Amount</span>
              <strong>
                ₹
                {Number(
                  selectedFunding.funding_request?.requested_amount || 0
                ).toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="funding-detail-card">
              <span>Settled Amount</span>
              <strong>
                ₹
                {Number(
                  selectedFunding.funding_request?.settled_amount || 0
                ).toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="funding-detail-card">
              <span>Status</span>
              <strong>
                {selectedFunding.funding_request?.status}
              </strong>
            </div>

            <div className="funding-detail-card">
              <span>Donors</span>
              <strong>
                {selectedFunding.donor_summary?.donor_count || 0}
              </strong>
            </div>

          </div>

          <div className="funding-donors-section">

            <h3>Donor Contributions</h3>

            <div className="funding-donors-table-wrapper">

              <table className="funding-donors-table">

                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Name</th>
                    <th>Allocated</th>
                    <th>Contributed</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {(selectedFunding.donors || []).map(
                    (donor) => (
                      <tr key={donor.donor_id}>

                        <td>
                          {donor.donor_reference}
                        </td>

                        <td>
                          {donor.donor_name}
                        </td>

                        <td>
                          ₹
                          {Number(
                            donor.allocated_amount || 0
                          ).toLocaleString("en-IN")}
                        </td>

                        <td>
                          ₹
                          {Number(
                            donor.contributed_amount || 0
                          ).toLocaleString("en-IN")}
                        </td>

                        <td>
                          {donor.contribution_status}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>
        </>
      )}

    </div>
  </div>
)}

    </div>
  );
}
function FundingStatusPage() {
  const [creatingFundingCaseId, setCreatingFundingCaseId] =
  useState(null);
  const [cases, setCases] = useState([]);
  const [fundingStatuses, setFundingStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadFundingStatuses();
  }, []);

  async function handleCreateFundingRequest(caseId) {
  try {
    setCreatingFundingCaseId(caseId);
    setError("");

    const result = await createFundingRequest(caseId);

    console.log(
      "FUNDING REQUEST CREATED:",
      result
    );

    await loadFundingStatuses();

  } catch (err) {
    console.error(
      "Funding request creation failed:",
      err
    );

    setError(
      err?.response?.data?.detail ||
      err?.message ||
      "Unable to create funding request."
    );
  } finally {
    setCreatingFundingCaseId(null);
  }
}

  async function loadFundingStatuses() {
    try {
      setLoading(true);
      setError("");

      // First load all medical cases
      const casesResponse = await getMedicalCases();

      const medicalCases = casesResponse.cases || [];

      setCases(medicalCases);

      // Then load funding status for each case
      const results = await Promise.allSettled(
        medicalCases
          .filter(
  (medicalCase) =>
    medicalCase.case_id !== undefined &&
    medicalCase.case_id !== null
)
.map(async (medicalCase) => {
  const fundingStatus = await getFundingStatus(
    medicalCase.case_id
  );

  return {
    caseId: medicalCase.case_id,
    data: fundingStatus
  };
})
      );

      const statusMap = {};

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          statusMap[result.value.caseId] = result.value.data;
        }
      });

      setFundingStatuses(statusMap);

    } catch (err) {
      console.error(
        "Funding status loading failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        err?.message ||
        "Unable to load funding status."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatAmount(amount) {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  }

  function getFundingStatusClass(status) {
    const value = String(status || "").toUpperCase();

    if (value === "FULLY_FUNDED") {
      return "status-verified";
    }

    if (value === "PARTIALLY_FUNDED") {
      return "status-pending";
    }

    return "";
  }

  if (loading) {
    return (
      <section className="panel">

        <div className="page-heading">
          <div>
            <div className="eyebrow">
              FUNDING STATUS
            </div>

            <h1>Funding Status</h1>

            <p>
              Loading funding information for medical cases...
            </p>
          </div>

          <div className="system-status">
            <span className="status-dot" />
            System operational
          </div>
        </div>

        <div className="empty-state">
          Loading funding status...
        </div>

      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">

        <div className="page-heading">
          <div>
            <div className="eyebrow">
              FUNDING STATUS
            </div>

            <h1>Funding Status</h1>

            <p>
              View the current funding status of medical cases.
            </p>
          </div>
        </div>

        <div className="panel dashboard-error">
          {error}
        </div>

      </section>
    );
  }

  return (
    <section className="panel">

      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="page-heading">

        <div>
          <div className="eyebrow">
            FUNDING STATUS
          </div>

          <h1>Funding Status</h1>

          <p>
            View the current funding status of medical cases.
          </p>
        </div>

        <div className="system-status">
          <span className="status-dot" />
          System operational
        </div>

      </div>


      {/* =========================
          FUNDING OVERVIEW
      ========================= */}

      <div
        className="funding-status-card"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "24px"
        }}
      >

        <div>
          <span>Total Cases</span>

          <strong>
            {cases.length}
          </strong>
        </div>

        <div>
          <span>Fully Funded</span>

          <strong>
            {
              Object.values(fundingStatuses).filter(
                (item) =>
                  String(
                    item?.funding_status || ""
                  ).toUpperCase() ===
                  "FULLY_FUNDED"
              ).length
            }
          </strong>
        </div>

        <div>
          <span>Partially / Not Funded</span>

          <strong>
            {
              Object.values(fundingStatuses).filter(
                (item) =>
                  String(
                    item?.funding_status || ""
                  ).toUpperCase() !==
                  "FULLY_FUNDED"
              ).length
            }
          </strong>
        </div>

      </div>


      {/* =========================
          MEDICAL CASE FUNDING
      ========================= */}

      <section className="detail-card">

        <div className="case-section-header">

          <div>
            <div className="eyebrow">
              CASE FUNDING
            </div>

            <h2>Medical Cases</h2>

            <p>
              Current funding allocation and settlement status
              for each medical case.
            </p>
          </div>

          <span className="status-badge status-verified">
            {cases.length} Cases
          </span>

        </div>


        {cases.length === 0 ? (

          <div className="medical-cases-state">
            No medical cases found.
          </div>

        ) : (

          <div className="risk-case-list">

            {cases.map((medicalCase) => {

              const funding =
  fundingStatuses[medicalCase.case_id];

              const fundingStatus =
                funding?.funding_status ||
                "NOT_FUNDED";

              const requestedAmount =
                funding?.requested_amount ??
                medicalCase.requested_amount ??
                medicalCase.amount_required ??
                0;

              const approvedAmount =
                funding?.approved_amount ??
                medicalCase.approved_amount ??
                0;

              const totalAllocated =
                funding?.total_allocated ?? 0;

              const totalSettled =
                funding?.total_settled ?? 0;

              const totalPending =
                funding?.total_pending ?? 0;

              const remainingAmount =
                funding?.remaining_amount ??
                Math.max(
                  Number(approvedAmount || 0) -
                  Number(totalAllocated || 0),
                  0
                );

              return (

                <div
                  className="risk-case-card"
                  key={medicalCase.case_id}
                >

                  {/* CASE HEADER */}

                  <div className="risk-case-header">

                    <div>

                      <strong>
                        {medicalCase.case_reference ||
                          `CASE-${medicalCase.id}`}
                      </strong>

                      <span>
                        {medicalCase.diagnosis_category ||
                          "Medical Case"}
                      </span>

                    </div>

                    <span
                      className={`status-badge ${getFundingStatusClass(
                        fundingStatus
                      )}`}
                    >
                      {fundingStatus}
                    </span>

                  </div>


                  {/* FUNDING DETAILS */}

                  <div className="risk-case-details">

                    <div>
                      <span>
                        Requested
                      </span>

                      <strong>
                        {formatAmount(
                          requestedAmount
                        )}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Approved
                      </span>

                      <strong>
                        {formatAmount(
                          approvedAmount
                        )}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Allocated
                      </span>

                      <strong>
                        {formatAmount(
                          totalAllocated
                        )}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Settled
                      </span>

                      <strong>
                        {formatAmount(
                          totalSettled
                        )}
                      </strong>
                    </div>

                  </div>


                  {/* SECONDARY FUNDING DETAILS */}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap: "12px",
                      marginTop: "12px"
                    }}
                  >

                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: "#f8fafc"
                      }}
                    >

                      <span
                        style={{
                          display: "block",
                          fontSize: "11px",
                          color: "#8996aa",
                          marginBottom: "5px"
                        }}
                      >
                        Pending Settlement
                      </span>

                      <strong>
                        {formatAmount(
                          totalPending
                        )}
                      </strong>

                    </div>


                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: "#f8fafc"
                      }}
                    >

                      <span
                        style={{
                          display: "block",
                          fontSize: "11px",
                          color: "#8996aa",
                          marginBottom: "5px"
                        }}
                      >
                        Remaining Funding
                      </span>

                      <strong>
                        {formatAmount(
                          remainingAmount
                        )}
                      </strong>

                    </div>

                  </div>


                  {/* ALLOCATION COUNT */}

                  <div
                    style={{
                      marginTop: "14px",
                      fontSize: "12px",
                      color: "#8996aa"
                    }}
                  >
                    Donor allocations:{" "}
                    <strong
                      style={{
                        color: "#172b4d"
                      }}
                    >
                      {funding?.allocation_count ?? 0}
                    </strong>
                  </div>

                  {fundingStatus === "NOT_FUNDED" &&
  Number(approvedAmount || 0) > 0 &&
  String(medicalCase.status || "").toUpperCase() ===
    "VERIFIED" && (

  <div
    style={{
      marginTop: "18px",
      display: "flex",
      justifyContent: "flex-end"
    }}
  >
    <button
      className="refresh-button"
      onClick={() =>
        handleCreateFundingRequest(
          medicalCase.case_id
        )
      }
      disabled={
        creatingFundingCaseId ===
        medicalCase.case_id
      }
    >
      {creatingFundingCaseId ===
      medicalCase.case_id
        ? "Creating..."
        : "Create Funding Request"}
    </button>
  </div>

)}

                </div>

              );
            })}

          </div>

        )}

      </section>

    </section>
  );
}
function PaymentsPage() {
  const navigate = useNavigate();
  const { transactionReference } = useParams();
const { patientReference } = useParams();

  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState("");

  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [paymentMinAmount, setPaymentMinAmount] = useState("");
  const [paymentMaxAmount, setPaymentMaxAmount] = useState("");

  useEffect(() => {
    loadPaymentsData();
  }, []);

  async function loadPaymentsData() {
    try {
      setPaymentsLoading(true);
      setPaymentsError("");

      const data = await getPayments();

      setPayments(data?.transactions || []);
    } catch (error) {
      console.error(
        "Payments loading failed:",
        error
      );

      setPaymentsError(
        error?.response?.data?.detail ||
        error?.message ||
        "Unable to load payments."
      );

      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }

  const paymentStatuses = [
    ...new Set(
      payments
        .map((payment) => payment.payment_status)
        .filter(Boolean)
    ),
  ];

  const filteredPayments = payments.filter((payment) => {
    const search = paymentSearch
      .trim()
      .toLowerCase();

    const searchableText = [
      payment.transaction_reference,
      payment.allocation_id,
      payment.case_id,
      payment.donor_id,
      payment.destination_reference,
    ]
      .filter(
        (value) =>
          value !== null &&
          value !== undefined
      )
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !search ||
      searchableText.includes(search);

    const matchesStatus =
      !paymentStatusFilter ||
      payment.payment_status ===
        paymentStatusFilter;

    const amount = Number(
      payment.amount || 0
    );

    const matchesMin =
      !paymentMinAmount ||
      amount >= Number(paymentMinAmount);

    const matchesMax =
      !paymentMaxAmount ||
      amount <= Number(paymentMaxAmount);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesMin &&
      matchesMax
    );
  });

  const totalAmount = payments.reduce(
    (total, payment) =>
      total + Number(payment.amount || 0),
    0
  );

  const completedPayments = payments.filter(
    (payment) =>
      payment.payment_status ===
        "COMPLETED" ||
      payment.payment_status ===
        "SETTLED"
  ).length;

  const pendingPayments = payments.filter(
    (payment) =>
      payment.payment_status ===
        "PENDING"
  ).length;

  const failedPayments = payments.filter(
    (payment) =>
      payment.payment_status ===
        "FAILED"
  ).length;

  function clearPaymentFilters() {
    setPaymentSearch("");
    setPaymentStatusFilter("");
    setPaymentMinAmount("");
    setPaymentMaxAmount("");
  }

  function openPaymentDetails(payment) {
    navigate(
      `/payments/${payment.transaction_reference}`
    );
  }
  if (transactionReference) {
  return <PaymentDetails />;
}


  return (
    <div className="funding-page">

      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="page-heading">
        <div>
          <div className="eyebrow">
            FINANCIAL OPERATIONS
          </div>

          <h1>Payments</h1>

          <p>
            Monitor payment transactions and
            settlement activity.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadPaymentsData}
          disabled={paymentsLoading}
        >
          {paymentsLoading
            ? "Loading..."
            : "Refresh"}
        </button>
      </div>

      {/* =========================
          SUMMARY CARDS
      ========================= */}

      <div className="stats-grid">

  <div className="stat-card">
    <span
      style={{
        display: "block",
        fontSize: "12px",
        marginBottom: "14px",
        color: "#6f7f95",
      }}
    >
      Total Payments
    </span>

    <strong
      style={{
        display: "block",
        fontSize: "26px",
        lineHeight: "1",
        marginBottom: "10px",
        color: "#17243a",
      }}
    >
      {payments.length}
    </strong>

    <small
      style={{
        display: "block",
        fontSize: "12px",
        color: "#8b98aa",
      }}
    >
      Payment transactions
    </small>
  </div>


  <div className="stat-card">
    <span
      style={{
        display: "block",
        fontSize: "12px",
        marginBottom: "14px",
        color: "#6f7f95",
      }}
    >
      Completed
    </span>

    <strong
      style={{
        display: "block",
        fontSize: "26px",
        lineHeight: "1",
        marginBottom: "10px",
        color: "#17243a",
      }}
    >
      {completedPayments}
    </strong>

    <small
      style={{
        display: "block",
        fontSize: "12px",
        color: "#8b98aa",
      }}
    >
      Successfully processed
    </small>
  </div>


  <div className="stat-card">
    <span
      style={{
        display: "block",
        fontSize: "12px",
        marginBottom: "14px",
        color: "#6f7f95",
      }}
    >
      Pending
    </span>

    <strong
      style={{
        display: "block",
        fontSize: "26px",
        lineHeight: "1",
        marginBottom: "10px",
        color: "#17243a",
      }}
    >
      {pendingPayments}
    </strong>

    <small
      style={{
        display: "block",
        fontSize: "12px",
        color: "#8b98aa",
      }}
    >
      Awaiting completion
    </small>
  </div>


  <div className="stat-card">
    <span
      style={{
        display: "block",
        fontSize: "12px",
        marginBottom: "14px",
        color: "#6f7f95",
      }}
    >
      Total Amount
    </span>

    <strong
      style={{
        display: "block",
        fontSize: "26px",
        lineHeight: "1",
        marginBottom: "10px",
        color: "#17243a",
      }}
    >
      ₹{totalAmount.toLocaleString("en-IN")}
    </strong>

    <small
      style={{
        display: "block",
        fontSize: "12px",
        color: "#8b98aa",
      }}
    >
      Across all payments
    </small>
  </div>

</div>

      {/* =========================
          SEARCH & FILTERS
      ========================= */}

      <section className="panel">

        <div className="panel-header">
          <div>
            <h3>
              Search & Filter Payments
            </h3>

            <p>
              Search by transaction, case,
              donor or destination reference.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "2fr 1fr 1fr 1fr auto",
            gap: "12px",
            padding: "20px 25px",
          }}
        >

          <input
  type="text"
  value={paymentSearch}
  onChange={(event) =>
    setPaymentSearch(event.target.value)
  }
  placeholder="Search payment, case, donor..."
  style={{
    padding: "11px 13px",
    border: "1px solid #dfe5ec",
    borderRadius: "8px",
    fontSize: "12px",
    outline: "none",
    background: "#ffffff",
    color: "#17243a",
    boxSizing: "border-box",
  }}
/>

          <select
            value={paymentStatusFilter}
            onChange={(event) =>
              setPaymentStatusFilter(
                event.target.value
              )
            }
            style={{
  padding: "11px 13px",
  border: "1px solid #dfe5ec",
  borderRadius: "8px",
  fontSize: "12px",
  background: "#ffffff",
  color: "#17243a",
  boxSizing: "border-box",
}}
          >
           <option
  value=""
  style={{
    background: "#ffffff",
    color: "#17243a",
  }}
>
  All Statuses
</option>

            {paymentStatuses.map((status) => (
  <option
    key={status}
    value={status}
    style={{
      background: "#ffffff",
      color: "#17243a",
    }}
  >
    {status}
  </option>
))}
          </select>

          <input
  type="number"
  value={paymentMinAmount}
  onChange={(event) =>
    setPaymentMinAmount(event.target.value)
  }
  placeholder="Min amount"
  style={{
    padding: "11px 13px",
    border: "1px solid #dfe5ec",
    borderRadius: "8px",
    fontSize: "12px",
    background: "#ffffff",
    color: "#17243a",
    boxSizing: "border-box",
  }}
/>

          <input
  type="number"
  value={paymentMaxAmount}
  onChange={(event) =>
    setPaymentMaxAmount(event.target.value)
  }
  placeholder="Max amount"
  style={{
    padding: "11px 13px",
    border: "1px solid #dfe5ec",
    borderRadius: "8px",
    fontSize: "12px",
    background: "#ffffff",
    color: "#17243a",
    boxSizing: "border-box",
  }}
/>

          <button
            className="refresh-button"
            onClick={clearPaymentFilters}
          >
            Clear
          </button>

        </div>

      </section>

      {/* =========================
          PAYMENT LIST
      ========================= */}

      <section className="panel">

        <div className="panel-header">

          <div>
            <h3>
              Payment Transactions
            </h3>

            <p>
              Showing{" "}
              <strong>
                {filteredPayments.length}
              </strong>{" "}
              of{" "}
              <strong>
                {payments.length}
              </strong>{" "}
              payments
            </p>
          </div>

        </div>

        {paymentsError && (
          <div
            style={{
              margin: "20px 25px",
              padding: "14px",
              borderRadius: "10px",
              background: "#fff1f1",
              color: "#b42318",
              border:
                "1px solid #ffd0d0",
            }}
          >
            {paymentsError}
          </div>
        )}

        {paymentsLoading ? (
          <div className="empty-state">
            Loading payment transactions...
          </div>

        ) : filteredPayments.length === 0 ? (
          <div className="empty-state">
            No payment transactions found.
          </div>

        ) : (
          <div>

            {filteredPayments.map(
              (payment) => (
                <button
                  key={
                    payment.transaction_reference
                  }
                  onClick={() =>
                    openPaymentDetails(
                      payment
                    )
                  }
                  style={{
                    width: "100%",
                    border: 0,
                    borderBottom:
                      "1px solid #edf0f4",
                    background: "#fff",
                    padding:
                      "17px 25px",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "grid",
                    gridTemplateColumns:
                      "1.7fr 1.5fr 1fr 1fr auto",
                    gap: "18px",
                    alignItems: "center",
                  }}
                >

                  <div>
                    <strong
                      style={{
                        fontSize: "13px",
                      }}
                    >
                      {
                        payment.transaction_reference
                      }
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: "4px",
                        color:
                          "#929dad",
                        fontSize: "10px",
                      }}
                    >
                      Allocation #
                      {
                        payment.allocation_id
                      }
                    </span>
                  </div>

                  <div>
                    <strong
                      style={{
                        fontSize: "13px",
                      }}
                    >
                      Case #
                      {payment.case_id}
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: "4px",
                        color:
                          "#929dad",
                        fontSize: "10px",
                      }}
                    >
                      Donor #
                      {payment.donor_id}
                    </span>
                  </div>

                  <div>
                    <strong
                      style={{
                        fontSize: "13px",
                      }}
                    >
                      ₹
                      {Number(
                        payment.amount || 0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: "4px",
                        color:
                          "#929dad",
                        fontSize: "10px",
                      }}
                    >
                      Payment amount
                    </span>
                  </div>

                  <div>
                    <span className="settled">
                      {
                        payment.payment_status
                      }
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "20px",
                      color: "#087f73",
                    }}
                  >
                    →
                  </div>

                </button>
              )
            )}

          </div>
        )}

      </section>

    </div>
  );
}
function AuditSecurityPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  async function loadAuditLogs() {
    try {
      setLoading(true);
      setError("");

      const response = await getBankAuditLogs();

      const logs = response?.audit_logs || [];

      setAuditLogs(logs);
    } catch (err) {
      console.error("Audit logs error:", err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="audit-security-page">

      <div className="audit-security-header">
        <div>
          <div className="eyebrow">
            SECURITY & AUDIT
          </div>

          <h1>Audit & Security</h1>

          <p>
            Monitor security events and audit activity
            across the MedBridge platform.
          </p>
        </div>

        <button
          className="audit-refresh-button"
          onClick={loadAuditLogs}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="audit-security-status">

        <div className="audit-status-icon">
          🛡
        </div>

        <div>
          <strong>System Protected</strong>

          <span>
            Audit logging and security controls are active.
          </span>
        </div>

        <div className="audit-status-count">
          <strong>{auditLogs.length}</strong>
          <span>Audit Events</span>
        </div>

      </div>

      {error && (
        <div className="audit-error">
          {error}
        </div>
      )}

      <section className="audit-events-card">

        <div className="audit-events-header">

          <div>
            <h2>Audit Events</h2>

            <p>
              Recorded security and transaction events.
            </p>
          </div>

          <span className="audit-event-total">
            {auditLogs.length} events
          </span>

        </div>

        {loading ? (

          <div className="audit-empty">
            Loading audit events...
          </div>

        ) : auditLogs.length === 0 ? (

          <div className="audit-empty">
            No audit events found.
          </div>

        ) : (

          <div className="audit-event-list">

            {auditLogs.map((log, index) => (

              <div
                className="audit-event-row"
                key={
                  log.event_reference ||
                  index
                }
              >

                <div className="audit-event-icon">
                  🛡
                </div>

                <div className="audit-event-main">

                  <strong>
                    {log.event_type || "Security Event"}
                  </strong>

                  <span>
                    {log.action || "—"}
                  </span>

                  {log.details && (
                    <small>
                      {log.details}
                    </small>
                  )}

                </div>

                <div className="audit-event-reference">

                  <strong>
                    {log.event_reference || "—"}
                  </strong>

                  {log.transaction_reference && (
                    <span>
                      Transaction:{" "}
                      {log.transaction_reference}
                    </span>
                  )}

                </div>

                <div className="audit-event-status">

                  <span
                    className={
                      String(log.status).toUpperCase() ===
                      "SUCCESS"
                        ? "audit-status-success"
                        : "audit-status-failed"
                    }
                  >
                    {log.status || "—"}
                  </span>

                </div>

                <div className="audit-event-date">

                  {log.created_at
                    ? new Date(
                        log.created_at
                      ).toLocaleString()
                    : "—"}

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}
function RiskEvaluationPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [evaluatingCaseId, setEvaluatingCaseId] = useState(null);
  const [results, setResults] = useState({});

  useEffect(() => {
    async function loadCases() {
      try {
        setLoading(true);
        setError("");

        const data = await getMedicalCases();

        setCases(data.cases || []);
      } catch (err) {
        console.error(
          "Failed to load risk evaluation cases:",
          err
        );

        setError(
          err?.response?.data?.detail ||
          "Unable to load medical cases."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCases();
  }, []);

  async function handleRiskEvaluation(caseId) {
  try {
    setEvaluatingCaseId(caseId);
    setError("");

    console.log("EVALUATING CASE ID:", caseId);

    const result = await evaluateCaseRisk(caseId);

    console.log("RISK API RESULT:", result);

    // Update the visible cases immediately
    setCases((previousCases) =>
      previousCases.map((medicalCase) => {
        if (
          String(medicalCase.case_id) ===
          String(caseId)
        ) {
          console.log(
            "UPDATING CASE IN UI:",
            medicalCase.case_id,
            result
          );

          return {
            ...medicalCase,
            trust_score: result.trust_score,
            risk_level: result.risk_level,
            verification_status:
              result.verification_status,
          };
        }

        return medicalCase;
      })
    );

    // Keep evaluation results separately as well
    setResults((previousResults) => ({
      ...previousResults,
      [String(caseId)]: result,
    }));

  } catch (err) {
  console.error(
    "Risk evaluation failed:",
    err
  );

  const detail = err?.response?.data?.detail;

  if (Array.isArray(detail)) {
    setError(
      detail
        .map((item) => item.msg)
        .join(", ")
    );
  } else if (typeof detail === "string") {
    setError(detail);
  } else {
    setError("Unable to evaluate case risk.");
  }
} finally {
  setEvaluatingCaseId(null);
}
}

  function getRiskClass(riskLevel) {
    if (!riskLevel) {
      return "";
    }

    return `risk-${riskLevel.toLowerCase()}`;
  }
    const filteredCases = cases.filter((medicalCase) => {
    
    const result =
  results[String(medicalCase.case_id)];

    const searchText = searchTerm
      .toLowerCase()
      .trim();

    if (!searchText) {
      return true;
    }

    const searchableText = [
      medicalCase.case_reference,
      medicalCase.diagnosis_category,
      medicalCase.emergency_type,
      medicalCase.risk_level,
      medicalCase.verification_status,
      result?.risk_level,
      result?.verification_status,
      result?.trust_score,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(searchText);
  });

  if (loading) {
    return (
      <section className="page">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              SECURITY & RISK
            </div>

            <h1>Risk Evaluation</h1>

            <p>
              Loading medical cases for risk evaluation...
            </p>
          </div>
        </div>

        <section className="detail-card">
          Loading cases...
        </section>
      </section>
    );
  }

  return (
    <section className="page">

      <div className="page-heading">
        <div>
          <div className="eyebrow">
            SECURITY & RISK
          </div>

          <h1>Risk Evaluation</h1>

          <p>
            Evaluate verified medical cases using
            trust scores and risk classification.
          </p>
        </div>
      </div>

      {error && (
        <div className="panel dashboard-error">
          {error}
        </div>
      )}

      <section className="detail-card">

        <div className="case-section-header risk-page-header">

  <div>
    <div className="eyebrow">
      CASE RISK ASSESSMENT
    </div>

    <h2>Medical Cases</h2>

    <p>
      Run automated risk evaluation for
      individual medical cases.
    </p>
  </div>

  <div className="risk-search-area">

    <div className="risk-search-box">

      <span className="risk-search-icon">
        🔍
      </span>

      <input
        type="text"
        value={searchTerm}
        onChange={(event) =>
          setSearchTerm(event.target.value)
        }
        placeholder="Search cases..."
        aria-label="Search medical cases"
      />

      {searchTerm && (
        <button
          type="button"
          className="risk-search-clear"
          onClick={() => setSearchTerm("")}
          aria-label="Clear search"
        >
          ×
        </button>
      )}

    </div>

    <span className="status-badge status-verified">
      {filteredCases.length} of {cases.length} Cases
    </span>

  </div>

</div>

        {cases.length === 0 ? (
  <div className="medical-cases-state">
    No medical cases found.
  </div>
) : filteredCases.length === 0 ? (
  <div className="medical-cases-state">
    No medical cases match "{searchTerm}".
  </div>
) : (
  <div className="risk-case-list">

    {filteredCases.map((medicalCase, index) => {
              console.log("MEDICAL CASE OBJECT:", medicalCase);
console.log("MEDICAL CASE ID:", medicalCase.case_id);
console.log("CASE REFERENCE:", medicalCase.case_reference);
              const result =
  results[String(medicalCase.case_id)];

              const riskLevel =
                result?.risk_level ||
                medicalCase.risk_level ||
                "PENDING";

              const verificationStatus =
                result?.verification_status ||
                medicalCase.verification_status ||
                "PENDING";

              const trustScore =
                result?.trust_score ??
                medicalCase.trust_score ??
                null;
              console.log(
  "CASE RENDER:",
  medicalCase.case_id,
  "RESULT:",
  result
);

              return (
                <div
  className="risk-case-card"
  key={
  medicalCase.case_id ??
  medicalCase.case_reference ??
  index
}
>

                  <div className="risk-case-header">

                    <div>
                      <strong>
                        {medicalCase.case_reference}
                      </strong>

                      <span>
                        {medicalCase.diagnosis_category ||
                          "Medical Case"}
                      </span>
                    </div>

                    <span
                      className={`status-badge ${
                        getRiskClass(riskLevel)
                      }`}
                    >
                      {riskLevel}
                    </span>

                  </div>


                  <div className="risk-case-details">

                    <div>
                      <span>Emergency</span>

                      <strong>
                        {medicalCase.emergency_type ||
                          "N/A"}
                      </strong>
                    </div>


                    <div>
                      <span>Requested Amount</span>

                      <strong>
                        ₹
                        {Number(
                          medicalCase.amount_required ||
                          medicalCase.requested_amount ||
                          0
                        ).toLocaleString("en-IN")}
                      </strong>
                    </div>


                    <div>
                      <span>Trust Score</span>

                      <strong>
                        {trustScore !== null
                          ? trustScore
                          : "—"}
                      </strong>
                    </div>


                    <div>
                      <span>Verification</span>

                      <strong>
                        {verificationStatus}
                      </strong>
                    </div>

                  </div>


                  <div className="risk-case-actions">

                    <button
  type="button"
  className="register-patient-button"
  disabled={evaluatingCaseId === medicalCase.case_id}
  onClick={() =>
    handleRiskEvaluation(medicalCase.case_id)
  }
>
  {evaluatingCaseId === medicalCase.case_id
    ? "Evaluating..."
    : "Evaluate Risk"}
</button>

                  </div>


                  {result && (
                    <div className="risk-result">

                      <div>
                        <span>
                          Trust Score
                        </span>

                        <strong>
                          {result.trust_score}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Risk Level
                        </span>

                        <strong>
                          {result.risk_level}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Verification Status
                        </span>

                        <strong>
                          {result.verification_status}
                        </strong>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}

      </section>

    </section>
  );
}
function Dashboard({
  user,
  onLogout,
  initialPage = "Dashboard",
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
const navigate = useNavigate();

  const [activePage, setActivePage] =
  useState(initialPage);
  const [activityOpen, setActivityOpen] = useState(false);

  const [showHeartbeat, setShowHeartbeat] = useState(false);
const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [dashboardError, setDashboardError] = useState("");
  const [bankFundingData, setBankFundingData] = useState(null);

  

const [bankFundingLoading, setBankFundingLoading] = useState(false);

const [bankFundingError, setBankFundingError] = useState("");

const [donorStatistics, setDonorStatistics] = useState(null);

const [donorStatisticsLoading, setDonorStatisticsLoading] = useState(false);

const [donorStatisticsError, setDonorStatisticsError] = useState("");

const [payments, setPayments] = useState([]);
const [paymentsLoading, setPaymentsLoading] = useState(false);
const [paymentsError, setPaymentsError] = useState("");

const [paymentSearch, setPaymentSearch] = useState("");
const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
const [paymentMinAmount, setPaymentMinAmount] = useState("");
const [paymentMaxAmount, setPaymentMaxAmount] = useState("");

const loadPayments = async () => {
  try {
    setPaymentsLoading(true);
    setPaymentsError("");

    const data = await getPayments();

    setPayments(data?.transactions || []);
  } catch (error) {
    console.error("Failed to load payments:", error);

    setPaymentsError(
      error?.response?.data?.detail ||
      "Unable to load payment transactions."
    );
  } finally {
    setPaymentsLoading(false);
  }
};

useEffect(() => {
  if (location.pathname === "/funding-status") {
    setActivePage("Funding Status");
  } else if (
    location.pathname === "/funding" ||
    location.pathname.startsWith("/funding/")
  ) {
    setActivePage("Funding");
  }

  if (location.pathname.startsWith("/payments")) {
    setActivePage("Payments");
  }

  if (activePage === "Payments") {
    loadPayments();
  }
}, [location.pathname, activePage]);
const [selectedFunding, setSelectedFunding] = useState(null);

const openFundingDetails = async (funding) => {
  try { 
    console.log("Opening funding details:", funding);

    const details = await getAdminFundingDetails(
      funding.funding_id
    );

    setSelectedFunding(details);

  } catch (error) {
    console.error(
      "Funding details loading failed:",
      error
    );

    alert(
      error.message ||
      "Unable to load funding details."
    );
  }
};


  useEffect(() => {
  async function loadDashboard() {
    try {
      setDashboardLoading(true);
      setDashboardError("");

      const data =
        await getDashboardSummary();

      setDashboardData(data);
    } catch (error) {
      console.error(
        "Dashboard loading failed:",
        error
      );

      if (error.response?.status === 401) {
        onLogout();
        navigate("/login", {
          replace: true,
        });
        return;
      }

      setDashboardError(
        "Unable to load dashboard data."
      );
    } finally {
      setDashboardLoading(false);
    }
  }
  async function loadBankFunding() {
  try {
    setBankFundingLoading(true);
    setBankFundingError("");

    const data =
      await getAdminFundingDetails(2);

    setBankFundingData(data);

  } catch (error) {
    console.error(
      "Bank funding loading failed:",
      error
    );

    setBankFundingError(
      "Unable to load bank funding details."
    );

  } finally {
    setBankFundingLoading(false);
  }
}
async function loadDonorStatistics() {
  try {
    setDonorStatisticsLoading(true);
    setDonorStatisticsError("");

    const data =
      await getDonorStatistics();

    setDonorStatistics(data);

  } catch (error) {
    console.error(
      "Donor statistics loading failed:",
      error
    );

    setDonorStatisticsError(
      "Unable to load donor statistics."
    );

  } finally {
    setDonorStatisticsLoading(false);
  }
}
  loadDashboard();
loadBankFunding();
loadDonorStatistics();

}, [navigate, onLogout]);

  const navigation =
    navigationByRole[user.role] ||
    navigationByRole.AUDITOR;

  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-mark">
            <HeartPulse
              size={22}
              strokeWidth={2.5}
            />
          </div>

          <div>
            <div className="brand-name">
              MedBridge
            </div>

            <div className="brand-subtitle">
              Medical Funding Platform
            </div>
          </div>

          <button
            className="mobile-close"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section-label">
          MAIN MENU
        </div>

        <nav className="navigation">
          {navigation.map(
            ({ label, icon: Icon }) => (
              <button
                key={label}
                className={`nav-item ${
                  activePage === label
                    ? "nav-item-active"
                    : ""
                }`}
                onClick={() => {
  setActivePage(label);

  const routes = {
  Dashboard: "/dashboard",
  "Medical Cases": "/medical-cases",
  Patients: "/patients",
  "Risk Evaluation": "/risk-evaluation",
  Donors: "/donors",
  Funding: "/funding",
  "Funding Status": "/funding-status",
  Payments: "/payments",
  "Audit & Security": "/audit-security",
};

  const targetRoute = routes[label];
  console.log("Clicked menu:", label);
console.log("Target route:", targetRoute);

  if (targetRoute) {
    navigate(targetRoute);
  }
}}
              >
                <Icon size={19} />

                <span>{label}</span>

                {label ===
                  "Audit & Security" && (
                  <span className="nav-alert">
                    3
                  </span>
                )}
              </button>
            )
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="security-mini-card">
            <div className="security-icon">
              <ShieldCheck size={18} />
            </div>

            <div>
              <strong>
                System Protected
              </strong>

              <span>
                Security controls active
              </span>
            </div>

            <span className="status-dot" />
          </div>

          <button
            className="nav-item logout-item"
            onClick={() => {
            onLogout();
            navigate("/login", { replace: true });
}}
          >
            <LogOut size={19} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() =>
              setSidebarOpen(true)
            }
          >
            <Menu size={22} />
          </button>

          <div className="breadcrumb">
  <span>MedBridge</span>

  <span className="breadcrumb-divider">
    /
  </span>

  <strong>{activePage}</strong>
</div>

{showHeartbeat && (
  <div className="heartbeat-monitor">
    <svg
      viewBox="0 0 1000 60"
      preserveAspectRatio="none"
      className="heartbeat-svg"
    >
      <path
        className="heartbeat-path"
        d="
          M0 30
          L100 30
          L120 30
          L135 30
          L145 10
          L155 50
          L165 30
          L280 30
          L300 30
          L315 30
          L325 10
          L335 50
          L345 30
          L460 30
          L480 30
          L495 30
          L505 10
          L515 50
          L525 30
          L640 30
          L660 30
          L675 30
          L685 10
          L695 50
          L705 30
          L820 30
          L840 30
          L855 30
          L865 10
          L875 50
          L885 30
          L1000 30
        "
      />
    </svg>
  </div>
)}

<div className="topbar-right">

  <div className="activity-wrapper">

  <button
    className={`notification-button ${
      showHeartbeat ? "heartbeat-active" : ""
    }`}
    onClick={() => {
      setShowHeartbeat((prev) => !prev);
      setNotificationsOpen((prev) => !prev);
    }}
    title="Notifications"
  >
    <Activity size={19} />

    {/* Notification indicator */}
    <span className="notification-dot" />
  </button>

  {notificationsOpen && (
    <div className="notification-dropdown">

      <div className="notification-header">
        <div>
          <strong>Notifications</strong>
          <span>Recent security activity</span>
        </div>

        <span className="notification-count">
          3
        </span>
      </div>

      <div className="notification-divider" />

      <div className="notification-item">
        <div className="notification-item-icon">
          <ShieldCheck size={16} />
        </div>

        <div>
          <strong>Security event recorded</strong>
          <span>
            Audit logging is active.
          </span>
        </div>
      </div>

      <div className="notification-item">
        <div className="notification-item-icon">
          <Activity size={16} />
        </div>

        <div>
          <strong>System operational</strong>
          <span>
            MedBridge services are running normally.
          </span>
        </div>
      </div>

      <div className="notification-item">
        <div className="notification-item-icon">
          <HeartPulse size={16} />
        </div>

        <div>
          <strong>Funding settlement completed</strong>
          <span>
            Latest transaction successfully settled.
          </span>
        </div>
      </div>

      <button
        className="view-notifications"
        onClick={() => {
          setNotificationsOpen(false);
          navigate("/audit-security");
        }}
      >
        View all security events
      </button>

    </div>
  )}

</div>

  <div className="profile-wrapper">
    <button
      className="profile"
      onClick={() =>
        setProfileOpen((prev) => !prev)
      }
      type="button"
    >
      <div className="avatar">
        {user.full_name?.charAt(0) || "U"}
      </div>

      <div className="profile-info">
        <strong>{user.full_name}</strong>

        <span>{user.role}</span>
      </div>

      <ChevronDown
        size={16}
        className={`profile-chevron ${
          profileOpen ? "profile-chevron-open" : ""
        }`}
      />
    </button>

    {profileOpen && (
      <div className="profile-dropdown">
        <div className="profile-dropdown-user">
          <strong>{user.full_name}</strong>
          <span>{user.role}</span>
        </div>

        <div className="profile-dropdown-divider" />

        <button
          type="button"
          onClick={() => {
            setProfileOpen(false);
            onLogout();
          }}
        >
          Sign out
        </button>
      </div>
    )}
  </div>

</div>
        </header>

        <section className="page">

  {activePage === "Medical Cases" ? (
  <MedicalCasesPage />

) : activePage === "Patients" ? (
  <PatientsPage />

) : activePage === "Donors" ? (
  <DonorsPage />

) : activePage === "Funding" ? (
  <FundingPage />

) : activePage === "Funding Status" ? (
  <FundingStatusPage />

) : activePage === "Payments" ? (
  <PaymentsPage />

) : activePage === "Audit & Security" ? (
  <AuditSecurityPage />

) : activePage === "Risk Evaluation" ? (
  <RiskEvaluationPage />

) : (
    <>

          <div className="page-heading">
            <div>
              <div className="eyebrow">
                OVERVIEW
              </div>

              <h1>{activePage}</h1>

              <p>
                Welcome back,{" "}
                <strong>
                  {user.full_name}
                </strong>
                . Monitor the MedBridge platform
                securely.
              </p>
            </div>

            <div className="system-status">
              <span className="status-dot" />
              System operational
            </div>
          </div>

          <div className="stats-grid">
  {dashboardLoading ? (
    <>
      <div className="stat-card">
        <div className="stat-top">
          <span>Active Cases</span>
        </div>
        <div className="stat-value">...</div>
      </div>

      <div className="stat-card">
        <div className="stat-top">
          <span>Funded Cases</span>
        </div>
        <div className="stat-value">...</div>
      </div>

      <div className="stat-card">
        <div className="stat-top">
          <span>Total Funding</span>
        </div>
        <div className="stat-value">...</div>
      </div>

      <div className="stat-card">
        <div className="stat-top">
          <span>Security Events</span>
        </div>
        <div className="stat-value">...</div>
      </div>
    </>
  ) : dashboardError ? (
    <div className="panel dashboard-error">
      {dashboardError}
    </div>
  ) : (
    <>
      <div className="stat-card">
        <div className="stat-top">
          <span>Active Cases</span>

          <div className="stat-icon">
            <FileText size={18} />
          </div>
        </div>

        <div className="stat-value">
          {dashboardData.active_cases}
        </div>

        <div className="stat-change">
          Live database value
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-top">
          <span>Funded Cases</span>

          <div className="stat-icon">
            <HeartPulse size={18} />
          </div>
        </div>

        <div className="stat-value">
          {dashboardData.funded_cases}
        </div>

        <div className="stat-change">
          Live database value
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-top">
          <span>Total Funding</span>

          <div className="stat-icon">
            <WalletCards size={18} />
          </div>
        </div>

        <div className="stat-value">
          ₹{Number(dashboardData.total_funding).toLocaleString("en-IN")}
        </div>

        <div className="stat-change">
          Settled funding
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-top">
          <span>Security Events</span>

          <div className="stat-icon">
            <ShieldCheck size={18} />
          </div>
        </div>

        <div className="stat-value">
          {dashboardData.security_events}
        </div>

        <div className="stat-change">
          Recorded audit events
        </div>
      </div>
    </>
  )}
</div>
{/* Bank Overview */}
<div className="bank-overview-section">

  <div className="bank-overview-header">
    <div>
      <div className="bank-overview-eyebrow">
        BANK OVERVIEW
      </div>

      <h2>Donor Funding Network</h2>

      <p>
        {donorStatistics?.bank_reference ||
          "BANK-IN-001"}
        {" "}· India
      </p>
    </div>

    <div className="bank-overview-label">
      VERIFIED BANK
    </div>
  </div>

  {donorStatisticsLoading ? (

    <div className="bank-overview-loading">
      Loading donor statistics...
    </div>

  ) : donorStatisticsError ? (

    <div className="bank-overview-error">
      {donorStatisticsError}
    </div>

  ) : donorStatistics ? (

    <>
      <div className="bank-statistics-grid">

        <div className="bank-stat-card">
          <span>Total Donors</span>

          <strong>
            {donorStatistics.total_donors.toLocaleString("en-IN")}
          </strong>

          <small>
            Registered donor accounts
          </small>
        </div>


        <div className="bank-stat-card active">
          <span>Active Consent</span>

          <strong>
            {donorStatistics.active_consent.toLocaleString("en-IN")}
          </strong>

          <small>
            {(
              donorStatistics.active_consent /
              donorStatistics.total_donors *
              100
            ).toFixed(1)}
            % of donors
          </small>
        </div>


        <div className="bank-stat-card pending">
          <span>Pending Consent</span>

          <strong>
            {donorStatistics.pending_consent.toLocaleString("en-IN")}
          </strong>

          <small>
            {(
              donorStatistics.pending_consent /
              donorStatistics.total_donors *
              100
            ).toFixed(1)}
            % of donors
          </small>
        </div>


        <div className="bank-stat-card declined">
          <span>Declined Consent</span>

          <strong>
            {donorStatistics.declined_consent.toLocaleString("en-IN")}
          </strong>

          <small>
            {(
              donorStatistics.declined_consent /
              donorStatistics.total_donors *
              100
            ).toFixed(1)}
            % of donors
          </small>
        </div>

      </div>


      <div className="bank-eligibility">

        <div>
          <span>Eligible for Medical Funding</span>

          <strong>
            {donorStatistics.eligible_for_funding.toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="bank-eligibility-progress">

          <div
            className="bank-eligibility-bar"
            style={{
              width: `${
                (
                  donorStatistics.eligible_for_funding /
                  donorStatistics.total_donors
                ) * 100
              }%`
            }}
          />

        </div>

        <small>
          {(
            donorStatistics.eligible_for_funding /
            donorStatistics.total_donors *
            100
          ).toFixed(1)}
          % currently eligible
        </small>

      </div>
    </>

  ) : (

    <div className="bank-overview-loading">
      No donor statistics available.
    </div>

  )}

</div>
{/* Bank Funding Overview */}
<div className="bank-funding-section">

  <div className="section-header">
    <div>
      <div className="section-eyebrow">
        BANK INTEGRATION
      </div>

      <h2>Funding & Donor Contributions</h2>

      <p>
        Bank settlement activity and authorised donor
        contribution information.
      </p>
    </div>

    {bankFundingData && (
      <div className="bank-settled-badge">
        {bankFundingData.funding_request.status}
      </div>
    )}
  </div>

  {bankFundingLoading ? (
    <div className="bank-funding-loading">
      Loading bank funding information...
    </div>
  ) : bankFundingError ? (
    <div className="bank-funding-error">
      {bankFundingError}
    </div>
  ) : bankFundingData ? (

    <>
      {/* Funding summary */}

      <div className="bank-funding-summary">

        <div className="bank-funding-card">
          <span>Funding Reference</span>

          <strong>
            {bankFundingData.funding_request.funding_reference}
          </strong>
        </div>

        <div className="bank-funding-card">
          <span>Patient</span>

          <strong>
            {bankFundingData.funding_request.patient_reference}
          </strong>
        </div>

        <div className="bank-funding-card">
          <span>Requested</span>

          <strong>
            ₹
            {bankFundingData.funding_request.requested_amount.toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="bank-funding-card">
          <span>Settled</span>

          <strong>
            ₹
            {bankFundingData.funding_request.settled_amount.toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="bank-funding-card">
          <span>Donors Involved</span>

          <strong>
            {bankFundingData.donor_summary.donor_count}
          </strong>
        </div>

        <div className="bank-funding-card">
          <span>Total Contributed</span>

          <strong>
            ₹
            {bankFundingData.donor_summary.total_contributed.toLocaleString("en-IN")}
          </strong>
        </div>

      </div>

      {/* Donor contributions */}

      <div className="bank-donor-table">

        <div className="bank-table-title">
          <div>
            <h3>Donor Contributions</h3>

            <p>
              Donors whose consent was used for this funding request.
            </p>
          </div>

          <strong>
            {bankFundingData.donor_summary.donor_count} donors
          </strong>
        </div>

        <div className="table-wrapper">

          <table>

            <thead>
              <tr>
                <th>Donor</th>
                <th>Name</th>
                <th>Consent</th>
                <th>Allocated</th>
                <th>Contributed</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              {bankFundingData.donors.map((donor) => (

                <tr key={donor.donor_id}>

                  <td>
                    {donor.donor_reference}
                  </td>

                  <td>
                    {donor.donor_name}
                  </td>

                  <td>
                    {donor.consent_reference}
                  </td>

                  <td>
                    ₹
                    {donor.allocated_amount.toLocaleString("en-IN")}
                  </td>

                  <td>
                    ₹
                    {donor.contributed_amount.toLocaleString("en-IN")}
                  </td>

                  <td>
                    <span className="bank-status-settled">
                      {donor.contribution_status}
                    </span>
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* Bank transaction */}

      {bankFundingData.bank_transaction && (

        <div className="bank-transaction-card">

          <div>
            <span>Bank Transaction</span>

            <strong>
              {bankFundingData.bank_transaction.transaction_reference}
            </strong>
          </div>

          <div>
            <span>Hospital Account</span>

            <strong>
              {bankFundingData.funding_request.hospital_account_reference}
            </strong>
          </div>

          <div>
            <span>Settlement</span>

            <strong>
              ₹
              {bankFundingData.bank_transaction.amount.toLocaleString("en-IN")}
            </strong>
          </div>

          <div>
            <span>Status</span>

            <strong className="bank-status-settled">
              {bankFundingData.bank_transaction.transaction_status}
            </strong>
          </div>

        </div>

      )}

    </>

  ) : (

    <div className="bank-funding-empty">
      No bank funding information available.
    </div>

  )}

</div>

          <div className="content-grid">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>
                    Recent Activity
                  </h2>

                  <p>
                    Latest activity across
                    MedBridge
                  </p>
                </div>

                <button className="text-button">
                  View all
                </button>
              </div>

              <div className="activity-list">
                <div className="activity-row">
                  <div className="activity-marker success">
                    <ShieldCheck size={17} />
                  </div>

                  <div className="activity-details">
                    <strong>
                      Authentication successful
                    </strong>

                    <span>
                      {user.email} signed in
                      successfully.
                    </span>
                  </div>

                  <time>Now</time>
                </div>

                <div className="activity-row">
                  <div className="activity-marker success">
                    <ShieldCheck size={17} />
                  </div>

                  <div className="activity-details">
                    <strong>
                      Role verified
                    </strong>

                    <span>
                      Role: {user.role}
                    </span>
                  </div>

                  <time>Now</time>
                </div>

                <div className="activity-row">
                  <div className="activity-marker warning">
                    <AlertTriangle size={17} />
                  </div>

                  <div className="activity-details">
                    <strong>
                      Security monitoring active
                    </strong>

                    <span>
                      Protected API session
                      established.
                    </span>
                  </div>

                  <time>Now</time>
                </div>
              </div>
            </section>

            <section className="panel case-panel">
              <div className="panel-header">
                <div>
                  <h2>
                    Demo Funding Case
                  </h2>

                  <p>
                    Existing MedBridge case
                  </p>
                </div>
              </div>

              <div className="case-reference">
                <div className="case-icon">
                  <Building2 size={20} />
                </div>

                <div>
                  <strong>
                    MB-AUDIT-TEST-001
                  </strong>

                  <span>
                    Emergency medical funding
                  </span>
                </div>
              </div>

              <div className="funding-amounts">
                <div>
                  <span>Approved</span>
                  <strong>3.00</strong>
                </div>

                <div>
                  <span>Settled</span>
                  <strong>₹3.00</strong>
                </div>

                <div>
                  <span>Remaining</span>
                  <strong>₹0.00</strong>
                </div>
              </div>

              <div className="progress-label">
                <span>
                  Funding progress
                </span>

                <strong>100%</strong>
              </div>

              <div className="progress-track">
                <div className="progress-fill" />
              </div>

              <div className="funding-status">
                <span className="status-dot" />
                Fully funded & settled
              </div>
            </section>
          </div>

          </>
)}
        </section>
      </main>
    </div>
  );
}
function PaymentDetails() {
  const { transactionReference } = useParams();
  const navigate = useNavigate();
  const { patientReference } = useParams();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPayment() {
      try {
        setLoading(true);
        setError("");

        const response = await getPayments();

        const transactions = response?.transactions || [];

        const foundPayment = transactions.find(
          (item) =>
            String(item.transaction_reference).trim() ===
            String(transactionReference).trim()
        );

        if (!foundPayment) {
          throw new Error(
            `Payment not found: ${transactionReference}`
          );
        }

        setPayment(foundPayment);
      } catch (err) {
        console.error("Payment details error:", err);

        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Unable to load payment details."
        );
      } finally {
        setLoading(false);
      }
    }

    if (transactionReference) {
      loadPayment();
    }
  }, [transactionReference]);

  /* =========================
     LOADING
     ========================= */

  if (loading) {
    return (
      <div className="payment-detail">
        <button
          className="payment-back-button"
          onClick={() => navigate("/payments", { replace: true })}
        >
          ← Back to Payments
        </button>

        <div className="payment-details-loading">
          Loading payment details...
        </div>
      </div>
    );
  }

  /* =========================
     ERROR
     ========================= */

  if (error || !payment) {
    return (
      <div className="payment-detail">
        <button
          className="payment-back-button"
           onClick={() => navigate("/payments", { replace: true })}
        >
          ← Back to Payments
        </button>

        <div className="payment-details-error">
          <h2>Unable to load payment details.</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  /* =========================
     PAYMENT DETAILS
     ========================= */

  return (
  <div className="payment-detail-page">

    {/* Page Header */}
    <div className="payment-detail-page-header">

      <div>
        <div className="payment-detail-eyebrow">
          FINANCIAL OPERATIONS
        </div>

        <h1>Payment Details</h1>

        <p>
          View payment transaction and settlement information.
        </p>
      </div>

    </div>

    {/* Back Button */}
    <button
      className="payment-detail-back"
      onClick={() => navigate("/payments", { replace: true })}
    >
      ← Back to Payments
    </button>

    {/* Transaction Card */}
    <div className="payment-details-card">

      <h2>Transaction Information</h2>

      <div className="payment-info-grid">

        <div className="payment-info-card">
          <span className="payment-info-label">
            TRANSACTION REFERENCE
          </span>

          <strong className="payment-info-value">
            {payment.transaction_reference || "—"}
          </strong>
        </div>

        <div className="payment-info-card">
          <span className="payment-info-label">
            ALLOCATION
          </span>

          <strong className="payment-info-value">
            {payment.allocation_id
              ? `Allocation #${payment.allocation_id}`
              : "—"}
          </strong>
        </div>

        <div className="payment-info-card">
          <span className="payment-info-label">
            DONOR
          </span>

          <strong className="payment-info-value">
            {payment.donor_id
              ? `Donor #${payment.donor_id}`
              : "—"}
          </strong>
        </div>

        <div className="payment-info-card payment-amount">
          <span className="payment-info-label">
            PAYMENT AMOUNT
          </span>

          <strong className="payment-info-value">
            ₹{Number(payment.amount || 0).toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="payment-info-card">
          <span className="payment-info-label">
            PAYMENT STATUS
          </span>

          <strong className="payment-info-value">
            <span className="payment-status">
              {payment.payment_status || "—"}
            </span>
          </strong>
        </div>

        <div className="payment-info-card">
          <span className="payment-info-label">
            DESTINATION REFERENCE
          </span>

          <strong className="payment-info-value">
            {payment.destination_reference || "—"}
          </strong>
        </div>

        <div className="payment-info-card">
          <span className="payment-info-label">
            CREATED AT
          </span>

          <strong className="payment-info-value">
            {payment.created_at
              ? new Date(payment.created_at).toLocaleString()
              : "—"}
          </strong>
        </div>

        <div className="payment-info-card">
          <span className="payment-info-label">
            COMPLETED AT
          </span>

          <strong className="payment-info-value">
            {payment.completed_at
              ? new Date(payment.completed_at).toLocaleString()
              : "—"}
          </strong>
        </div>

      </div>

    </div>

  </div>
);
}
function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const token =
        sessionStorage.getItem("medbridge_token");

      if (!token) {
        if (mounted) {
          setUser(null);
          setCheckingSession(false);
        }

        return;
      }

      try {
        const currentUser =
          await getCurrentUser();

        if (!mounted) {
          return;
        }

        setUser({
          user_id: currentUser.user_id,
          full_name: currentUser.full_name,
          email: currentUser.email,
          role: currentUser.role,
          status: currentUser.status,
        });

      } catch (error) {
        console.error(
          "Session restoration failed:",
          error
        );

        sessionStorage.removeItem(
          "medbridge_token"
        );

        sessionStorage.removeItem(
          "medbridge_user"
        );

        if (mounted) {
          setUser(null);
        }

      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);


 function handleLogin(loggedInUser) {
  setUser({
    user_id: loggedInUser.user_id,
    full_name: loggedInUser.full_name,
    email: loggedInUser.email,
    role: loggedInUser.role,
    status: loggedInUser.status,
  });
}


  function handleLogout() {
  sessionStorage.removeItem("medbridge_token");
  sessionStorage.removeItem("medbridge_user");

  setUser(null);

  navigate("/login", {
    replace: true,
  });
}


  if (checkingSession) {
    return (
      <div className="loading-screen">

        <div className="brand-mark">
          <HeartPulse size={25} />
        </div>

        <span>
          Connecting to MedBridge...
        </span>

      </div>
    );
  }


  return (
    <Routes>

      {/* ROOT */}

      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to="/dashboard"
              replace
            />
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />


      {/* LOGIN */}

      <Route
  path="/login"
  element={
    user ? (
      <Navigate
        to="/dashboard"
        replace
      />
    ) : (
      <LoginPage
        onLogin={handleLogin}
      />
    )
  }
/>


      {/* DASHBOARD */}

      <Route
        path="/dashboard"
        element={
          user ? (
            <Dashboard
              user={user}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />
            {/* MEDICAL CASES */}
      
      <Route
  path="/medical-cases"
  element={
    user ? (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        initialPage="Medical Cases"
      />
    ) : (
      <Navigate
        to="/login"
        replace
      />
    )
  }
/>
<Route
  path="/medical-cases/:caseReference"
  element={
    user ? (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        initialPage="Medical Cases"
      />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>
      {/* PATIENTS */}

<Route
  path="/patients"
  element={
    user ? (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        initialPage="Patients"
      />
    ) : (
      <Navigate
        to="/login"
        replace
      />
    )
  }
/>
<Route
  path="/patients/:patientId"
  element={
    user ? (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        initialPage="Patients"
      />
    ) : (
      <Navigate
        to="/login"
        replace
      />
    )
  }
/>
<Route
  path="/patients/:patientReference/create-case"
  element={
    user ? (
      <CreateMedicalCasePage />
    ) : (
      <Navigate
        to="/login"
        replace
      />
    )
  }
/>
<Route
  path="/patients/:patientReference/verification"
  element={<PatientVerification />}
/>
{/* DONORS */}

<Route
  path="/donors"
  element={
    user ? (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        initialPage="Donors"
      />
    ) : (
      <Navigate
        to="/login"
        replace
      />
    )
  }
/>
<Route
  path="/risk-evaluation"
  element={
    user ? (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        initialPage="Risk Evaluation"
      />
    ) : (
      <Navigate
        to="/login"
        replace
      />
    )
  }
/>

<Route
  path="/donors/:donorReference"
  element={
    user ? (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        initialPage="Donors"
      />
    ) : (
      <Navigate
        to="/login"
        replace
      />
    )
  }
/>
{/* FUNDING */}



{/* FUNDING */}

<Route
  path="/funding"
  element={
    user ? (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        initialPage="Funding"
      />
    ) : (
      <Navigate
        to="/login"
        replace
      />
    )
  }
/>

<Route
  path="/funding/:fundingId"
  element={
    user ? (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        initialPage="Funding"
      />
    ) : (
      <Navigate
        to="/login"
        replace
      />
    )
  }
/>
{/* DOCTOR FUNDING STATUS */}

<Route
  path="/funding-status"
  element={
    user ? (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        initialPage="Funding"
      />
    ) : (
      <Navigate
        to="/login"
        replace
      />
    )
  }
/>
<Route
  path="/payments"
  element={
    user ? (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        initialPage="Payments"
      />
    ) : (
      <Navigate
        to="/login"
        replace
      />
    )
  }
/>
{/* AUDIT & SECURITY */}


<Route
  path="/payments/:transactionReference"
  element={
    user ? (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        initialPage="Payments"
      />
    ) : (
      <Navigate
        to="/login"
        replace
      />
    )
  }
/>

{/* AUDIT & SECURITY */}

<Route
  path="/audit-security"
  element={
    user ? (
      <AuditSecurityPage
        user={user}
        onLogout={handleLogout}
      />
    ) : (
      <Navigate
        to="/login"
        replace
      />
    )
  }
/>
      {/* UNKNOWN ROUTES */}

      <Route
        path="*"
        element={
          <Navigate
            to={
              user
                ? "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;
