import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getPatient,
  submitPatientVerification,
} from "./services/api";

export default function PatientVerification() {
  const navigate = useNavigate();
  const { patientReference } = useParams();

  const [patient, setPatient] = useState(null);

  const [emergencyType, setEmergencyType] = useState("");
  const [medicalCondition, setMedicalCondition] = useState("");
  const [treatmentRequired, setTreatmentRequired] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [medicalDocument, setMedicalDocument] = useState(null);

  const [loadingPatient, setLoadingPatient] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD PATIENT
  // =========================================================

  useEffect(() => {
    async function loadPatient() {
      try {
        setLoadingPatient(true);
        setError("");

        const response = await getPatient(patientReference);

        const loadedPatient =
          response?.patient || response;

        if (!loadedPatient) {
          throw new Error(
            "Patient information could not be loaded."
          );
        }

        setPatient(loadedPatient);
      } catch (err) {
        console.error(
          "Unable to load patient:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Unable to load patient information."
        );
      } finally {
        setLoadingPatient(false);
      }
    }

    if (patientReference) {
      loadPatient();
    }
  }, [patientReference]);

  // =========================================================
  // SUBMIT VERIFICATION
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    // ---------------------------------------------------------
    // BASIC VALIDATION
    // ---------------------------------------------------------

    if (!emergencyType) {
      setError(
        "Please select the emergency type."
      );
      return;
    }

    if (!medicalCondition.trim()) {
      setError(
        "Please enter the medical condition."
      );
      return;
    }

    if (!treatmentRequired.trim()) {
      setError(
        "Please enter the treatment required."
      );
      return;
    }

    if (
      !estimatedCost ||
      Number(estimatedCost) <= 0
    ) {
      setError(
        "Please enter a valid treatment cost."
      );
      return;
    }

    if (!medicalDocument) {
      setError(
        "Please upload supporting medical documentation."
      );
      return;
    }

    try {
      setSubmitting(true);

      // =======================================================
      // CREATE MULTIPART FORM
      // =======================================================

      const formData = new FormData();

formData.append(
  "full_name",
  patient?.full_name || ""
);

formData.append(
  "date_of_birth",
  patient?.date_of_birth
    ? String(patient.date_of_birth).slice(0, 10)
    : ""
);

formData.append(
  "government_id_reference",
  patient?.government_id_reference || ""
);

formData.append(
  "medical_condition",
  medicalCondition.trim()
);

formData.append(
  "treatment_required",
  treatmentRequired.trim()
);

formData.append(
  "estimated_cost",
  String(estimatedCost)
);

formData.append(
  "medical_document",
  medicalDocument
);
      // =======================================================
      // SUBMIT
      // =======================================================
      console.log("========== VERIFICATION FORMDATA ==========");

for (const [key, value] of formData.entries()) {
  console.log(
    key,
    value instanceof File
      ? {
          name: value.name,
          type: value.type,
          size: value.size,
        }
      : value
  );
}

console.log("==========================================");
      const response =
        await submitPatientVerification(
          patientReference,
          formData
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Verification submission failed."
        );
      }

      // =======================================================
      // SUCCESS
      // =======================================================

      alert(
        response.message ||
          "Patient application submitted successfully for verification."
      );

      navigate(
        `/patients/${patientReference}`,
        {
          replace: true,
        }
      );

    } catch (err) {
      console.error(
        "Patient verification failed:",
        err
      );

      // FastAPI validation errors can be arrays/objects.
      const detail =
        err?.response?.data?.detail;

      let errorMessage =
        "Unable to submit patient verification.";

      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail
          .map(
            (item) =>
              item?.msg || "Invalid input."
          )
          .join(", ");
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loadingPatient) {
    return (
      <div className="patient-verification-page">

        <button
          type="button"
          onClick={() =>
            navigate(
              `/patients/${patientReference}`
            )
          }
        >
          ← Back to Patient
        </button>

        <div className="verification-header">
          <p>PATIENT VERIFICATION</p>

          <h1>
            Patient Application
          </h1>

          <span>
            {patientReference}
          </span>
        </div>

        <div className="verification-card">
          Loading patient information...
        </div>

      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="patient-verification-page">

      {/* =====================================================
          BACK
      ===================================================== */}

      <button
        type="button"
        onClick={() =>
          navigate(
            `/patients/${patientReference}`
          )
        }
        disabled={submitting}
      >
        ← Back to Patient
      </button>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="verification-header">

        <p>PATIENT VERIFICATION</p>

        <h1>
          Patient Application
        </h1>

        <span>
          {patientReference}
        </span>

        <p>
          Complete the medical application and
          upload supporting documentation for
          verification.
        </p>

      </div>

      {/* =====================================================
          FORM
      ===================================================== */}

      <form
        className="verification-card"
        onSubmit={handleSubmit}
      >

        <h2>
          Patient Application
        </h2>

        {/* ===================================================
            IDENTITY INFORMATION
        =================================================== */}

        <div className="form-section">

          <h3>
            Identity Information
          </h3>

          <p>
            The following information was provided
            during patient registration and cannot
            be changed during medical verification.
          </p>

          <label>
            Full Name

            <input
              type="text"
              value={
                patient?.full_name || ""
              }
              readOnly
            />
          </label>

          <label>
            Date of Birth

            <input
              type="date"
              value={
                patient?.date_of_birth
                  ? String(
                      patient.date_of_birth
                    ).slice(0, 10)
                  : ""
              }
              readOnly
            />
          </label>

          <label>
            Government ID / Verification Reference

            <input
              type="text"
              value={
                patient
                  ?.government_id_reference ||
                ""
              }
              readOnly
            />
          </label>

        </div>

        {/* ===================================================
            MEDICAL INFORMATION
        =================================================== */}

        <div className="form-section">

          <h3>
            Medical Information
          </h3>

          {/* EMERGENCY TYPE */}

          <label>
            Emergency Type

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

              <option value="URGENT">
                Urgent
              </option>

              <option value="EMERGENCY">
                Emergency
              </option>

              <option value="CRITICAL">
                Critical
              </option>

              <option value="LIFE_THREATENING">
                Life Threatening
              </option>

              <option value="NON_URGENT">
                Non-Urgent
              </option>

            </select>

          </label>

          {/* MEDICAL CONDITION */}

          <label>
            Medical Condition

            <textarea
              value={medicalCondition}
              onChange={(e) =>
                setMedicalCondition(
                  e.target.value
                )
              }
              placeholder="Enter confirmed medical condition"
              required
            />

          </label>

          {/* TREATMENT */}

          <label>
            Treatment Required

            <textarea
              value={treatmentRequired}
              onChange={(e) =>
                setTreatmentRequired(
                  e.target.value
                )
              }
              placeholder="Describe the required treatment"
              required
            />

          </label>

          {/* COST */}

          <label>
            Estimated Treatment Cost

            <input
              type="number"
              min="1"
              step="1"
              value={estimatedCost}
              onChange={(e) =>
                setEstimatedCost(
                  e.target.value
                )
              }
              placeholder="Enter amount in whole rupees"
              required
            />

          </label>

        </div>

        {/* ===================================================
            SUPPORTING DOCUMENT
        =================================================== */}

        <div className="form-section">

          <h3>
            Supporting Evidence
          </h3>

          <p>
            Upload supporting medical documentation
            for verification.
          </p>

          <label>
            Medical Documentation

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                setMedicalDocument(
                  e.target.files?.[0] ||
                    null
                );
              }}
              required
            />

          </label>

          {medicalDocument && (
            <p>
              Selected:{" "}
              <strong>
                {medicalDocument.name}
              </strong>
            </p>
          )}

          <small>
            Accepted formats: PDF, JPG, JPEG
            and PNG.
          </small>

        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="verification-error">
            {error}
          </div>
        )}

        {/* ===================================================
            ACTIONS
        =================================================== */}

        <div className="verification-actions">

          <button
            type="button"
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
            disabled={submitting}
          >
            {submitting
              ? "Submitting..."
              : "Submit for Verification →"}
          </button>

        </div>

      </form>

    </div>
  );
}