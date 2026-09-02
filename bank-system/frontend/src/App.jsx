import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8001";
const DONOR_PAGE_SIZE = 10;
const FUNDING_PAGE_SIZE = 10;

const tableHeader = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "2px solid #ddd"
};

const tableCell = {
  padding: "12px",
  borderBottom: "1px solid #eee"
};

function App() {
  const [transactions, setTransactions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [loading, setLoading] = useState(true);
  const [donorsLoading, setDonorsLoading] = useState(false);

  const [activePage, setActivePage] = useState("dashboard");

  const [donors, setDonors] = useState([]);
  const [donorTotal, setDonorTotal] = useState(0);
  const [donorPage, setDonorPage] = useState(1);
  const [donorTotalPages, setDonorTotalPages] = useState(1);
  const [donorSearch, setDonorSearch] = useState("");
  const [donorStatus, setDonorStatus] = useState("ALL");
  const [selectedDonor, setSelectedDonor] = useState(null);

  const [donorError, setDonorError] = useState("");

  const [fundingContributions, setFundingContributions] = useState([]);
const [contributionsLoading, setContributionsLoading] = useState(false);

const [fundingAllocations, setFundingAllocations] = useState([]);
const [allocationLoading, setAllocationLoading] = useState(false);
const [allocationMessage, setAllocationMessage] = useState("");
const [allocationError, setAllocationError] = useState("");

const [settlementLoading, setSettlementLoading] = useState(false);
const [settlementMessage, setSettlementMessage] = useState("");
const [settlementError, setSettlementError] = useState("");
  // -----------------------------
  // Funding requests
  // Server-side pagination/search
  // -----------------------------
  const [fundingRequests, setFundingRequests] = useState([]);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [fundingError, setFundingError] = useState("");
  const [fundingTotal, setFundingTotal] = useState(0);
  const [fundingPage, setFundingPage] = useState(1);
  const [fundingTotalPages, setFundingTotalPages] = useState(1);
  const [fundingSearch, setFundingSearch] = useState("");
  const [fundingStatus, setFundingStatus] = useState("ALL");
  const [selectedFunding, setSelectedFunding] = useState(null);
  const [fundingStats, setFundingStats] = useState({
    total: 0,
    pending: 0,
    allocated: 0,
    settled: 0
  });


  const [donorStats, setDonorStats] = useState({
    total_donors: 0,
    active_consent: 0,
    pending_consent: 0,
    declined_consent: 0
  });

  // -----------------------------
  // Browser back-button handling
  // -----------------------------
  useEffect(() => {
    const handlePopState = () => {
      setSelectedDonor(null);
      setSelectedFunding(null);

      const hash = window.location.hash;

      if (hash === "#donors") {
        setActivePage("donors");
      } else if (hash === "#funding") {
        setActivePage("funding");
      } else if (hash === "#transactions") {
        setActivePage("transactions");
      } else if (hash === "#audit") {
        setActivePage("audit");
      } else {
        setActivePage("dashboard");
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // -----------------------------
  // Bank data
  // -----------------------------
  async function loadBankData() {
    try {
      setLoading(true);

      const [transactionsResponse, auditResponse] = await Promise.all([
        fetch(`${API_URL}/bank/transactions`),
        fetch(`${API_URL}/bank/audit`)
      ]);

      if (!transactionsResponse.ok || !auditResponse.ok) {
        throw new Error("Unable to load bank data.");
      }

      const transactionData = await transactionsResponse.json();
      const auditData = await auditResponse.json();

      setTransactions(transactionData.transactions || []);
      setAuditLogs(auditData.audit_logs || []);
    } catch (error) {
      console.error("Failed to load Bank data:", error);
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // Donor statistics
  // -----------------------------
  async function loadDonorStatistics() {
    try {
      const response = await fetch(`${API_URL}/bank/donors/statistics`);

      if (!response.ok) {
        throw new Error("Unable to load donor statistics.");
      }

      const data = await response.json();

      if (data.success) {
        setDonorStats({
          total_donors: data.total_donors || 0,
          active_consent: data.active_consent || 0,
          pending_consent: data.pending_consent || 0,
          declined_consent: data.declined_consent || 0
        });
      }
    } catch (error) {
      console.error("Failed to load donor statistics:", error);
    }
  }

  // -----------------------------
  // Donors
  //
  // IMPORTANT:
  // Filtering/searching happens on the SERVER.
  // We never download all 16,253 donors into React.
  // -----------------------------
  async function loadDonors(
    page = 1,
    status = donorStatus,
    search = donorSearch
  ) {
    setDonorsLoading(true);
    setDonorError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(DONOR_PAGE_SIZE)
      });

      if (status !== "ALL") {
        params.set("consent_status", status);
      }

      const cleanSearch = search.trim();

      if (cleanSearch) {
        params.set("search", cleanSearch);
      }

      const response = await fetch(
        `${API_URL}/bank/donors?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.detail || "Unable to load donors."
        );
      }

      setDonors(data.donors || []);
      setDonorTotal(data.total_count || 0);
      setDonorPage(data.page || page);
      setDonorTotalPages(data.total_pages || 1);
    } catch (error) {
      console.error("Failed to load donors:", error);
      setDonorError(error.message || "Unable to load donors.");
      setDonors([]);
      setDonorTotal(0);
      setDonorTotalPages(1);
    } finally {
      setDonorsLoading(false);
    }
  }

  // -----------------------------
  // Open Donors page
  // -----------------------------
  function openDonorsPage() {
    window.history.pushState(
      { page: "donors" },
      "",
      "#donors"
    );

    setActivePage("donors");
    setSelectedDonor(null);
    setDonorStatus("ALL");
    setDonorSearch("");
    setDonorPage(1);

    loadDonors(1, "ALL", "");
    loadDonorStatistics();
  }

  function changeDonorStatus(status) {
    setDonorStatus(status);
    setDonorPage(1);
    setSelectedDonor(null);
    loadDonors(1, status, donorSearch);
  }

  function searchDonors(value) {
    setDonorSearch(value);
    setDonorPage(1);

    // Search is sent to the backend instead of filtering only
    // the 20 records currently displayed.
    loadDonors(1, donorStatus, value);
  }

  function goToDonorPage(page) {
    if (
      page < 1 ||
      page > donorTotalPages ||
      page === donorPage
    ) {
      return;
    }

    loadDonors(page, donorStatus, donorSearch);
  }

  function refreshDonors() {
    setSelectedDonor(null);
    loadDonors(donorPage, donorStatus, donorSearch);
    loadDonorStatistics();
  }

  function goBackToDonorList() {
    setSelectedDonor(null);
  }


  // -----------------------------
  // Funding statistics
  // -----------------------------
  async function loadFundingStatistics() {
    try {
      const response = await fetch(
        `${API_URL}/bank/funding-requests/statistics`
      );

      if (!response.ok) {
        throw new Error("Unable to load funding statistics.");
      }

      const data = await response.json();

      if (data.success) {
        setFundingStats({
          total: data.total || 0,
          pending: data.pending || 0,
          allocated: data.allocated || 0,
          settled: data.settled || 0
        });
      }
    } catch (error) {
      console.error(
        "Failed to load funding statistics:",
        error
      );
    }
  }

  // -----------------------------
  // Funding requests
  // Server-side pagination/search
  // -----------------------------
  async function loadFundingRequests(
    page = 1,
    status = fundingStatus,
    search = fundingSearch
  ) {
    setFundingLoading(true);
    setFundingError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(FUNDING_PAGE_SIZE)
      });

      if (status !== "ALL") {
        params.set("status", status);
      }

      const cleanSearch = search.trim();

      if (cleanSearch) {
        params.set("search", cleanSearch);
      }

      const response = await fetch(
  `http://127.0.0.1:8001/bank/funding-requests?${params.toString()}`
);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.detail || "Unable to load funding requests."
        );
      }

      setFundingRequests(data.funding_requests || []);
      setFundingTotal(data.total_count || 0);
      setFundingPage(data.page || page);
      setFundingTotalPages(data.total_pages || 1);
    } catch (error) {
      console.error(
        "Failed to load funding requests:",
        error
      );

      setFundingError(
        error.message || "Unable to load funding requests."
      );

      setFundingRequests([]);
      setFundingTotal(0);
      setFundingTotalPages(1);
    } finally {
      setFundingLoading(false);
    }
  }
// -----------------------------
  // loadFundingContributions
  // -----------------------------
  const loadFundingContributions = async (fundingId) => {
  try {
    setContributionsLoading(true);

    const response = await fetch(
      `http://127.0.0.1:8001/bank/funding-requests/${fundingId}/contributions`
    );

    if (!response.ok) {
      throw new Error("Failed to load contributions");
    }

    const data = await response.json();

    setFundingContributions(data.contributions || []);
  } catch (error) {
    console.error("Error loading contributions:", error);
    setFundingContributions([]);
  } finally {
    setContributionsLoading(false);
  }
};
  // -----------------------------
// Allocate funding
// -----------------------------
const allocateFunding = async (fundingId) => {
  if (!fundingId) {
    return;
  }

  setAllocationLoading(true);
  setAllocationMessage("");
  setAllocationError("");
  setFundingAllocations([]);

  try {
    const response = await fetch(
      `${API_URL}/bank/funding-requests/${fundingId}/allocate`,
      {
        method: "POST"
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      const detail =
        typeof data.detail === "string"
          ? data.detail
          : data.detail?.message ||
            "Unable to allocate funding.";

      throw new Error(detail);
    }

    const fundingRequest =
      data.funding_request || {};

    setSelectedFunding((current) => ({
      ...(current || {}),
      ...fundingRequest,
      funding_id: fundingId
    }));

    setFundingAllocations(
      Array.isArray(data.allocations)
        ? data.allocations
        : []
    );

    setAllocationMessage(
      `${data.message || "Funding allocated successfully."} ` +
      `${data.donor_count || 0} donor(s) contributed.`
    );

    // Refresh funding counters
    await loadFundingStatistics();

    // Refresh the funding list
    await loadFundingRequests(
      fundingPage,
      fundingStatus,
      fundingSearch
    );

  } catch (error) {
    console.error(
      "Funding allocation failed:",
      error
    );

    setAllocationError(
      error.message ||
      "Unable to allocate funding."
    );
  } finally {
    setAllocationLoading(false);
  }
};
// -----------------------------
// Settle funding
// -----------------------------
const settleFunding = async (fundingId) => {
  if (!fundingId || settlementLoading) {
    return;
  }

  setSettlementLoading(true);
  setSettlementMessage("");
  setSettlementError("");

  try {
    const response = await fetch(
      `${API_URL}/bank/funding-requests/${fundingId}/settle`,
      {
        method: "POST"
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      const detail =
        typeof data.detail === "string"
          ? data.detail
          : data.detail?.message ||
            "Unable to settle funding.";

      throw new Error(detail);
    }

    const fundingRequest =
      data.funding_request || {};

    setSelectedFunding((current) => ({
      ...(current || {}),
      ...fundingRequest,
      funding_id: fundingId
    }));

    setSettlementMessage(
      data.message ||
      "Funding settled successfully."
    );

    // Refresh donor contributions.
    await loadFundingContributions(fundingId);

    // Refresh funding counters.
    await loadFundingStatistics();

    // Refresh funding list.
    await loadFundingRequests(
      fundingPage,
      fundingStatus,
      fundingSearch
    );

    // Refresh bank transactions and audit logs.
    await loadBankData();

  } catch (error) {
    console.error(
      "Funding settlement failed:",
      error
    );

    setSettlementError(
      error.message ||
      "Unable to settle funding."
    );
  } finally {
    setSettlementLoading(false);
  }
};
  function openFundingPage() {
  window.history.pushState(
    { page: "funding" },
    "",
    "#funding"
  );

  setActivePage("funding");
  setSelectedFunding(null);
setFundingAllocations([]);
setAllocationMessage("");
setAllocationError("");
setFundingStatus("ALL");
  setFundingSearch("");
  setFundingPage(1);

  loadFundingRequests(1, "ALL", "");
  loadFundingStatistics();
}
  function changeFundingStatus(status) {
    setFundingStatus(status);
setFundingPage(1);
setSelectedFunding(null);
setFundingAllocations([]);
setAllocationMessage("");
setAllocationError("");

    loadFundingRequests(
      1,
      status,
      fundingSearch
    );
  }

  function searchFunding(value) {
    setFundingSearch(value);
    setFundingPage(1);

    loadFundingRequests(
      1,
      fundingStatus,
      value
    );
  }

  function goToFundingPage(page) {
    if (
      page < 1 ||
      page > fundingTotalPages ||
      page === fundingPage
    ) {
      return;
    }

    loadFundingRequests(
      page,
      fundingStatus,
      fundingSearch
    );
  }

  function refreshFunding() {
    setSelectedFunding(null);

    loadFundingRequests(
      fundingPage,
      fundingStatus,
      fundingSearch
    );

    loadFundingStatistics();
  }

  function goBackToFundingList() {
  setSelectedFunding(null);
  setFundingAllocations([]);
  setAllocationMessage("");
  setAllocationError("");
}

  useEffect(() => {
    loadBankData();
  }, []);

  // -----------------------------
// Transaction grouping
// -----------------------------
// Donor-level transactions are kept in the database,
// but are displayed inside their parent settlement.
// The main Transactions page shows one row per settlement.

const isDonorTransaction = (transaction) => {
  return (
    transaction.transaction_type === "DONOR_TO_MEDBRIDGE" ||
    String(
      transaction.transaction_reference || ""
    ).startsWith("BANK-DONOR-")
  );
};

const settlementTransactions = transactions.filter(
  (transaction) => !isDonorTransaction(transaction)
);

// Group transactions by MedBridge settlement reference.
// This prevents multiple records belonging to the same
// funding settlement from appearing as separate rows.
const groupedSettlementMap = new Map();

settlementTransactions.forEach((transaction) => {
  const key =
    transaction.medbridge_transaction_reference ||
    transaction.transaction_reference;

  if (!groupedSettlementMap.has(key)) {
    groupedSettlementMap.set(key, transaction);
  }
});

const summaryTransactions = Array.from(
  groupedSettlementMap.values()
);

const totalSettled = summaryTransactions
  .filter(
    (transaction) =>
      transaction.transaction_status === "SETTLED"
  )
  .reduce(
    (total, transaction) =>
      total + Number(transaction.amount || 0),
    0
  );

  return (
    <div className="bank-app">
      <aside className="sidebar">
        <div className="bank-brand">
          <div className="bank-logo">🏦</div>

          <div>
            <h1>MedBridge Bank</h1>
            <span>Banking Platform</span>
          </div>
        </div>

        <nav>
          <button
            className={`nav-item ${
              activePage === "dashboard" ? "active" : ""
            }`}
            onClick={() => {
              window.history.pushState(
                { page: "dashboard" },
                "",
                "#dashboard"
              );
              setSelectedDonor(null);
              setSelectedFunding(null);
              setActivePage("dashboard");
            }}
          >
            Dashboard
          </button>

          <button
            className={`nav-item ${
              activePage === "transactions" ? "active" : ""
            }`}
            onClick={() => {
              window.history.pushState(
                { page: "transactions" },
                "",
                "#transactions"
              );
              setSelectedDonor(null);
              setSelectedFunding(null);
              setActivePage("transactions");
            }}
          >
            Transactions
          </button>

          <button
            className={`nav-item ${
              activePage === "donors" ? "active" : ""
            }`}
            onClick={openDonorsPage}
          >
            Donors
          </button>

          <button
            className={`nav-item ${
              activePage === "funding" ? "active" : ""
            }`}
            onClick={openFundingPage}
          >
            Funding
          </button>

          <button
            className={`nav-item ${
              activePage === "audit" ? "active" : ""
            }`}
            onClick={() => {
              window.history.pushState(
                { page: "audit" },
                "",
                "#audit"
              );
              setSelectedDonor(null);
              setSelectedFunding(null);
              setActivePage("audit");
            }}
          >
            Audit & Security
          </button>
        </nav>

        <div className="bank-status">
          <span className="status-dot"></span>

          <div>
            <strong>Bank Online</strong>
            <small>Security controls active</small>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">MedBridge Bank</span>
            <h2>Bank Dashboard</h2>
          </div>

          <div className="admin">
            <div className="admin-avatar">M</div>

            <div>
              <strong>Bank Admin</strong>
              <small>ADMIN</small>
            </div>
          </div>
        </header>

        <section className="dashboard">

          {/* =========================
              TRANSACTIONS
          ========================= */}
          {activePage === "transactions" ? (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h3>All Bank Transactions</h3>
                  <p>
                    Complete transaction history from the MedBridge Bank system
                  </p>
                </div>

                <button
                  className="refresh-button"
                  onClick={loadBankData}
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="empty-state">
                  Loading transactions...
                </div>
              ) : transactions.length === 0 ? (
                <div className="empty-state">
                  No transactions found.
                </div>
              ) : selectedTransaction ? (
  <div style={{ padding: "28px" }}>

    <button
      className="refresh-button"
      onClick={() =>
        setSelectedTransaction(null)
      }
      style={{
        marginBottom: "25px"
      }}
    >
      ← Back to Transactions
    </button>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px"
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: "24px"
          }}
        >
          Medical Funding Settlement
        </h2>

        <p
          style={{
            marginTop: "6px",
            color: "#8996aa",
            fontSize: "13px"
          }}
        >
          {selectedTransaction.transaction_reference}
        </p>
      </div>

      <span className="settled">
        {selectedTransaction.transaction_status}
      </span>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(3, minmax(0, 1fr))",
        gap: "16px",
        marginBottom: "25px"
      }}
    >
      <div className="funding-info-card">
        <span className="funding-info-label">
          Settlement Amount
        </span>

        <strong className="funding-info-value">
          ₹
          {Number(
            selectedTransaction.amount || 0
          ).toLocaleString("en-IN")}
        </strong>
      </div>

      <div className="funding-info-card">
        <span className="funding-info-label">
          Destination
        </span>

        <strong className="funding-info-value">
          {selectedTransaction.hospital_account_reference}
        </strong>
      </div>

      <div className="funding-info-card">
        <span className="funding-info-label">
          Donors
        </span>

        <strong className="funding-info-value">
          {
  transactions.filter(
    (item) =>
      isDonorTransaction(item) &&
      item.medbridge_transaction_reference ===
        selectedTransaction.medbridge_transaction_reference
  ).length
}
        </strong>
      </div>
    </div>

    <section className="contributions-section">

      <div className="contributions-header">
        <div>
          <h3>
            Donor Transactions
          </h3>

          <p>
            Individual donor contributions supporting this funding settlement
          </p>
        </div>

        <div className="contributions-total">
          ₹
          {transactions.filter(
  (item) =>
    item.transaction_type ===
      "DONOR_TO_MEDBRIDGE" &&
    item.medbridge_transaction_reference ===
      selectedTransaction.medbridge_transaction_reference
)
            .reduce(
              (total, item) =>
                total + Number(item.amount || 0),
              0
            )
            .toLocaleString("en-IN")}
        </div>
      </div>

      <div className="contributions-table-wrapper">

        <table className="contributions-table">

          <thead>
            <tr>
              <th>Transaction</th>
              <th>Donor Account</th>
              <th>Destination</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {transactions
  .filter(
    (item) =>
      isDonorTransaction(item) &&
      item.medbridge_transaction_reference ===
        selectedTransaction.medbridge_transaction_reference
  )
              .map((donorTransaction) => (
                <tr
                  key={
                    donorTransaction.transaction_reference
                  }
                >
                  <td>
                    <strong>
                      {
                        donorTransaction.transaction_reference
                      }
                    </strong>
                  </td>

                  <td>
                    {
                      donorTransaction.source_account_reference ||
                      "Donor Account"
                    }
                  </td>

                  <td>
                    {
                      donorTransaction.hospital_account_reference
                    }
                  </td>

                  <td>
                    <strong>
                      ₹
                      {Number(
                        donorTransaction.amount || 0
                      ).toLocaleString("en-IN")}
                    </strong>
                  </td>

                  <td>
                    {donorTransaction.transaction_type}
                  </td>

                  <td>
                    <span className="settled">
                      {
                        donorTransaction.transaction_status
                      }
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>

        </table>

      </div>
    </section>

  </div>
) : (
                
                <div className="transaction-list">
  {summaryTransactions.map((transaction) => {
    const donorTransactions = transactions.filter(
      (item) =>
        isDonorTransaction(item) &&
        item.medbridge_transaction_reference ===
          transaction.medbridge_transaction_reference
    );

    const donorTotal = donorTransactions.reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0
    );

    return (
      <div
        className="transaction-row"
        key={transaction.transaction_reference}
        onClick={() =>
          setSelectedTransaction(transaction)
        }
        style={{
          cursor: "pointer"
        }}
      >
        <div className="transaction-icon">
          ₹
        </div>

        <div className="transaction-info">
          <strong>
            {transaction.transaction_reference}
          </strong>

          <span>
            MedBridge:{" "}
            {transaction.medbridge_transaction_reference}
          </span>

          <span>
            Medical Funding Settlement
          </span>
        </div>

        <div className="transaction-account">
          <strong>
            {transaction.hospital_account_reference}
          </strong>

          <span>
            {donorTransactions.length} donor(s)
          </span>
        </div>

        <div className="transaction-amount">
          <strong>
            ₹
            {Number(
              transaction.amount || 0
            ).toLocaleString("en-IN")}
          </strong>

          <span className="settled">
            {transaction.transaction_status}
          </span>

          {donorTransactions.length > 0 && (
            <span
              style={{
                display: "block",
                marginTop: "6px",
                color: "#087f73",
                fontSize: "10px",
                fontWeight: 700
              }}
            >
              View {donorTransactions.length} donors →
            </span>
          )}
        </div>
      </div>
    );
  })}
</div>
              )}
            </section>

          /* =========================
             DONORS
          ========================= */
          ) : activePage === "donors" ? (
            <section className="panel">

              <div className="panel-header">
                <div>
                  <h3>Donor Management</h3>
                  <p>
                    Search and review donor accounts and consent status
                  </p>
                </div>

                <button
                  className="refresh-button"
                  onClick={refreshDonors}
                  disabled={donorsLoading}
                >
                  {donorsLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {selectedDonor ? (
                /* =========================
                   DONOR PROFILE
                ========================= */
                <div style={{ padding: "28px" }}>
                  <button
                    className="refresh-button"
                    onClick={goBackToDonorList}
                    style={{ marginBottom: "25px" }}
                  >
                    ← Back to Donors
                  </button>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "25px"
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "24px",
                          color: "#172b4d",
                          fontWeight: 700,
                          opacity: 1
                        }}
                      >
                        {selectedDonor.full_name}
                      </h2>

                      <p
                        style={{
                          marginTop: "6px",
                          color: "#61708a",
                          fontSize: "13px",
                          opacity: 1
                        }}
                      >
                        {selectedDonor.donor_reference}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center"
                      }}
                    >
                      <span className="settled">
                        {selectedDonor.consent_status || "UNKNOWN"}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap: "16px"
                    }}
                  >
                    <div
                      style={{
                        background: "#f7f9fc",
                        borderRadius: "12px",
                        padding: "20px"
                      }}
                    >
                      <small style={{ color: "#8996aa" }}>
                        Donor ID
                      </small>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "8px",
                          fontSize: "18px"
                        }}
                      >
                        {selectedDonor.donor_id}
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#f7f9fc",
                        borderRadius: "12px",
                        padding: "20px"
                      }}
                    >
                      <small style={{ color: "#8996aa" }}>
                        Bank ID
                      </small>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "8px",
                          fontSize: "18px"
                        }}
                      >
                        {selectedDonor.bank_id}
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#f7f9fc",
                        borderRadius: "12px",
                        padding: "20px"
                      }}
                    >
                      <small style={{ color: "#8996aa" }}>
                        Donor Reference
                      </small>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "8px",
                          fontSize: "15px"
                        }}
                      >
                        {selectedDonor.donor_reference}
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#f7f9fc",
                        borderRadius: "12px",
                        padding: "20px"
                      }}
                    >
                      <small style={{ color: "#8996aa" }}>
                        Account Reference
                      </small>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "8px",
                          fontSize: "15px"
                        }}
                      >
                        {selectedDonor.account_reference}
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#f7f9fc",
                        borderRadius: "12px",
                        padding: "20px"
                      }}
                    >
                      <small style={{ color: "#8996aa" }}>
                        Account Status
                      </small>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "8px",
                          color:
                            selectedDonor.account_status ===
                            "ACTIVE"
                              ? "#087f73"
                              : "#b45309"
                        }}
                      >
                        {selectedDonor.account_status}
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#f7f9fc",
                        borderRadius: "12px",
                        padding: "20px"
                      }}
                    >
                      <small style={{ color: "#8996aa" }}>
                        Consent Status
                      </small>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "8px"
                        }}
                      >
                        {selectedDonor.consent_status || "N/A"}
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#f7f9fc",
                        borderRadius: "12px",
                        padding: "20px"
                      }}
                    >
                      <small style={{ color: "#8996aa" }}>
                        Consent Reference
                      </small>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "8px",
                          fontSize: "14px"
                        }}
                      >
                        {selectedDonor.consent_reference || "N/A"}
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#f7f9fc",
                        borderRadius: "12px",
                        padding: "20px"
                      }}
                    >
                      <small style={{ color: "#8996aa" }}>
                        Consent Scope
                      </small>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "8px",
                          fontSize: "14px"
                        }}
                      >
                        {selectedDonor.consent_scope || "N/A"}
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#f7f9fc",
                        borderRadius: "12px",
                        padding: "20px"
                      }}
                    >
                      <small style={{ color: "#8996aa" }}>
                        Maximum Contribution
                      </small>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "8px",
                          fontSize: "15px"
                        }}
                      >
                        ₹
                        {Number(
                          selectedDonor.maximum_contribution || 0
                        ).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#f7f9fc",
                        borderRadius: "12px",
                        padding: "20px"
                      }}
                    >
                      <small style={{ color: "#8996aa" }}>
                        Created At
                      </small>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "8px",
                          fontSize: "14px"
                        }}
                      >
                        {selectedDonor.created_at
                          ? new Date(
                              selectedDonor.created_at
                            ).toLocaleString("en-IN")
                          : "N/A"}
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#f7f9fc",
                        borderRadius: "12px",
                        padding: "20px"
                      }}
                    >
                      <small style={{ color: "#8996aa" }}>
                        Consented At
                      </small>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "8px",
                          fontSize: "14px"
                        }}
                      >
                        {selectedDonor.consented_at
                          ? new Date(
                              selectedDonor.consented_at
                            ).toLocaleString("en-IN")
                          : "N/A"}
                      </strong>
                    </div>
                  </div>
                </div>

              ) : (
                <>
                  {/* SEARCH */}
                  <div
                    style={{
                      padding: "22px 25px",
                      borderBottom:
                        "1px solid #edf0f4"
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search donor ID, reference or name..."
                      value={donorSearch}
                      onChange={(e) =>
                        searchDonors(e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "13px 15px",
                        border: "1px solid #dfe6ee",
                        borderRadius: "10px",
                        fontSize: "14px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  {/* STATISTICS */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(4, minmax(0, 1fr))",
                      gap: "14px",
                      padding: "20px 25px",
                      borderBottom:
                        "1px solid #edf0f4"
                    }}
                  >
                    <StatusCard
                      title="All Donors"
                      value={donorStats.total_donors}
                      active={donorStatus === "ALL"}
                      onClick={() =>
                        changeDonorStatus("ALL")
                      }
                    />

                    <StatusCard
                      title="Active Consent"
                      value={donorStats.active_consent}
                      active={donorStatus === "ACTIVE"}
                      onClick={() =>
                        changeDonorStatus("ACTIVE")
                      }
                    />

                    <StatusCard
                      title="Pending Consent"
                      value={donorStats.pending_consent}
                      active={donorStatus === "PENDING"}
                      onClick={() =>
                        changeDonorStatus("PENDING")
                      }
                    />

                    <StatusCard
                      title="Declined Consent"
                      value={donorStats.declined_consent}
                      active={donorStatus === "DECLINED"}
                      onClick={() =>
                        changeDonorStatus("DECLINED")
                      }
                    />
                  </div>

                  {/* CURRENT RESULT COUNT */}
                  <div
                    style={{
                      padding: "14px 25px",
                      color: "#7c899b",
                      fontSize: "13px",
                      borderBottom:
                        "1px solid #edf0f4"
                    }}
                  >
                    Showing{" "}
                    <strong style={{ color: "#243b5a" }}>
                      {donors.length}
                    </strong>{" "}
                    of{" "}
                    <strong style={{ color: "#243b5a" }}>
                      {donorTotal.toLocaleString("en-IN")}
                    </strong>{" "}
                    matching donors
                  </div>

                  {/* ERROR */}
                  {donorError && (
                    <div
                      style={{
                        margin: "20px 25px",
                        padding: "14px",
                        borderRadius: "10px",
                        background: "#fff1f1",
                        color: "#b42318",
                        border: "1px solid #ffd0d0"
                      }}
                    >
                      {donorError}
                    </div>
                  )}

                  {/* DONOR LIST */}
                  {donorsLoading ? (
                    <div className="empty-state">
                      Loading donors...
                    </div>
                  ) : donors.length === 0 ? (
                    <div className="empty-state">
                      No donors found for this search/status.
                    </div>
                  ) : (
                    <div>
                      {donors.map((donor) => (
                        <button
                          key={donor.donor_id}
                          onClick={() =>
                            setSelectedDonor(donor)
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
                              "1.5fr 2fr 1fr auto",
                            gap: "18px",
                            alignItems: "center"
                          }}
                        >
                          <div>
                            <strong
                              style={{
                                fontSize: "13px"
                              }}
                            >
                              {donor.donor_reference}
                            </strong>

                            <span
                              style={{
                                display: "block",
                                marginTop: "4px",
                                color: "#929dad",
                                fontSize: "10px"
                              }}
                            >
                              ID #{donor.donor_id}
                            </span>
                          </div>

                          <div>
                            <strong
                              style={{
                                fontSize: "13px"
                              }}
                            >
                              {donor.full_name}
                            </strong>
                          </div>

                          <div>
                            <span className="settled">
                              {donor.consent_status ||
                                donor.account_status ||
                                "UNKNOWN"}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: "20px",
                              color: "#087f73"
                            }}
                          >
                            →
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* PAGINATION */}
                  {!donorsLoading &&
                    donorTotalPages > 1 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "12px",
                          padding: "20px",
                          borderTop:
                            "1px solid #edf0f4"
                        }}
                      >
                        <button
                          className="refresh-button"
                          disabled={donorPage <= 1}
                          onClick={() =>
                            goToDonorPage(
                              donorPage - 1
                            )
                          }
                        >
                          ← Previous
                        </button>

                        <span
                          style={{
                            color: "#68778d",
                            fontSize: "13px"
                          }}
                        >
                          Page{" "}
                          <strong>
                            {donorPage}
                          </strong>{" "}
                          of{" "}
                          <strong>
                            {donorTotalPages}
                          </strong>
                        </span>

                        <button
                          className="refresh-button"
                          disabled={
                            donorPage >=
                            donorTotalPages
                          }
                          onClick={() =>
                            goToDonorPage(
                              donorPage + 1
                            )
                          }
                        >
                          Next →
                        </button>
                      </div>
                    )}
                </>
              )}
            </section>

          /* =========================
             FUNDING
          ========================= */
          ) : activePage === "funding" ? (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h3>Funding Management</h3>
                  <p>
                    Search and review hospital funding requests
                  </p>
                </div>

                <button
                  className="refresh-button"
                  onClick={refreshFunding}
                  disabled={fundingLoading}
                >
                  {fundingLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {selectedFunding ? (
                <div style={{ padding: "28px" }}>
                  <button
                    className="refresh-button"
                    onClick={goBackToFundingList}
                    style={{ marginBottom: "25px" }}
                  >
                    ← Back to Funding
                  </button>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "25px"
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "24px"
                        }}
                      >
                        {selectedFunding.funding_reference}
                      </h2>

                      <p
                        style={{
                          marginTop: "6px",
                          color: "#8996aa",
                          fontSize: "13px"
                        }}
                      >
                        Funding Request #{selectedFunding.funding_id}
                      </p>
                    </div>

                    <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "12px"
  }}
>
  <span className="settled">
    {selectedFunding.status}
  </span>

  {selectedFunding.status === "PENDING" && (
    <button
      className="refresh-button"
      onClick={() =>
        allocateFunding(
          selectedFunding.funding_id
        )
      }
      disabled={allocationLoading}
      style={{
        background: "#087f73",
        color: "#fff",
        border: "none",
        minWidth: "150px"
      }}
    >
      {allocationLoading
        ? "Allocating..."
        : "Allocate Funding"}
    </button>
  )}
    {selectedFunding.status === "ALLOCATED" && (
    <button
      className="refresh-button"
      onClick={() =>
        settleFunding(
          selectedFunding.funding_id
        )
      }
      disabled={settlementLoading}
      style={{
        background: "#087f73",
        color: "#ffffff",
        borderColor: "#087f73"
      }}
    >
      {settlementLoading
        ? "Settling..."
        : "Settle Funding"}
    </button>
  )}
</div>
                  </div>

                 <div className="funding-info-grid">
                    <FundingInfo
                      label="Funding Reference"
                      value={selectedFunding.funding_reference}
                    />

                    <FundingInfo
                      label="Case Reference"
                      value={selectedFunding.case_reference}
                    />

                    <FundingInfo
                      label="Patient Reference"
                      value={selectedFunding.patient_reference}
                    />

                    <FundingInfo
                      label="Hospital ID"
                      value={selectedFunding.hospital_id}
                    />

                    <FundingInfo
                      label="Hospital Account"
                      value={
                        selectedFunding.hospital_account_reference
                      }
                    />

                    <FundingInfo
                      label="MedBridge Transaction"
                      value={
                        selectedFunding.medbridge_transaction_reference
                      }
                    />

                    <FundingInfo
                      label="Requested Amount"
                      value={`₹${Number(
                        selectedFunding.requested_amount || 0
                      ).toLocaleString("en-IN")}`}
                    />

                    <FundingInfo
                      label="Allocated Amount"
                      value={`₹${Number(
                        selectedFunding.allocated_amount || 0
                      ).toLocaleString("en-IN")}`}
                    />

                    <FundingInfo
                      label="Settled Amount"
                      value={`₹${Number(
                        selectedFunding.settled_amount || 0
                      ).toLocaleString("en-IN")}`}
                    />

                    <FundingInfo
                      label="Created At"
                      value={
                        selectedFunding.created_at
                          ? new Date(
                              selectedFunding.created_at
                            ).toLocaleString("en-IN")
                          : "N/A"
                      }
                    />

                    <FundingInfo
                      label="Completed At"
                      value={
                        selectedFunding.completed_at
                          ? new Date(
                              selectedFunding.completed_at
                            ).toLocaleString("en-IN")
                          : "Not completed"
                      }
                    />
                    
                  </div>
                  {fundingAllocations.length > 0 && (
  <div
    style={{
      marginTop: "25px",
      marginBottom: "30px",
      border: "1px solid #e4eaf1",
      borderRadius: "12px",
      overflow: "hidden"
    }}
  >
    <div
      style={{
        padding: "18px 20px",
        borderBottom: "1px solid #e4eaf1",
        background: "#f7f9fc"
      }}
    >
      <h3
        style={{
          margin: 0,
          color: "#172b4d",
          fontSize: "17px"
        }}
      >
        Donor Allocations
      </h3>

      <p
        style={{
          margin: "6px 0 0",
          color: "#8996aa",
          fontSize: "13px"
        }}
      >
        Funds reserved from eligible donors for this request
      </p>
    </div>

    <div
      style={{
        padding: "18px 20px",
        overflowX: "auto"
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px"
        }}
      >
        <thead>
          <tr>
            <th style={tableHeader}>
              Donor
            </th>

            <th style={tableHeader}>
              Account
            </th>

            <th style={tableHeader}>
              Consent
            </th>

            <th style={tableHeader}>
              Allocated
            </th>

            <th style={tableHeader}>
              Reserved
            </th>

            <th style={tableHeader}>
              Available
            </th>
          </tr>
        </thead>

        <tbody>
          {fundingAllocations.map(
            (allocation, index) => (
              <tr
                key={
                  allocation.allocation_reference ||
                  index
                }
              >
                <td style={tableCell}>
                  <strong>
                    {allocation.donor_reference}
                  </strong>
                </td>

                <td style={tableCell}>
                  {allocation.account_reference}
                </td>

                <td style={tableCell}>
                  {allocation.consent_reference}
                </td>

                <td style={tableCell}>
                  <strong>
                    ₹
                    {Number(
                      allocation.allocated_amount || 0
                    ).toLocaleString("en-IN")}
                  </strong>
                </td>

                <td style={tableCell}>
                  ₹
                  {Number(
                    allocation.reserved_balance || 0
                  ).toLocaleString("en-IN")}
                </td>

                <td style={tableCell}>
                  ₹
                  {Number(
                    allocation.available_balance || 0
                  ).toLocaleString("en-IN")}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>

    <div
      style={{
        padding: "16px 20px",
        borderTop: "1px solid #e4eaf1",
        background: "#fafcfd",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
      <strong>
        Total Reserved
      </strong>

      <strong
        style={{
          color: "#087f73",
          fontSize: "18px"
        }}
      >
        ₹
        {fundingAllocations
          .reduce(
            (total, allocation) =>
              total +
              Number(
                allocation.allocated_amount || 0
              ),
            0
          )
          .toLocaleString("en-IN")}
      </strong>
    </div>
  </div>
)}
                  {allocationMessage && (
  <div
    style={{
      marginBottom: "20px",
      padding: "15px 18px",
      borderRadius: "10px",
      background: "#e9f8f4",
      color: "#087f73",
      border: "1px solid #bfe7dc",
      fontSize: "14px",
      fontWeight: 600
    }}
  >
    {allocationMessage}
  </div>
)}

{allocationError && (
  <div
    style={{
      marginBottom: "20px",
      padding: "15px 18px",
      borderRadius: "10px",
      background: "#fff1f1",
      color: "#b42318",
      border: "1px solid #ffd0d0",
      fontSize: "14px",
      fontWeight: 600
    }}
  >
    {allocationError}
  </div>
)}
{settlementMessage && (
  <div
    style={{
      marginBottom: "20px",
      padding: "15px 18px",
      borderRadius: "10px",
      background: "#e9f8f4",
      color: "#087f73",
      border: "1px solid #bfe7dc",
      fontSize: "14px",
      fontWeight: 600
    }}
  >
    {settlementMessage}
  </div>
)}

{settlementError && (
  <div
    style={{
      marginBottom: "20px",
      padding: "15px 18px",
      borderRadius: "10px",
      background: "#fff1f1",
      color: "#b42318",
      border: "1px solid #ffd0d0",
      fontSize: "14px",
      fontWeight: 600
    }}
  >
    {settlementError}
  </div>
)}
                  <div className="contributions-section">

  <div className="contributions-header">
    <div>
      <h3>Donor Contributions</h3>
      <p>
        Donor funding allocated to this hospital request
      </p>
    </div>

    <div className="contributions-total">
      ₹
      {fundingContributions
        .reduce(
          (total, contribution) =>
            total + Number(contribution.amount || 0),
          0
        )
        .toLocaleString("en-IN")}
    </div>
  </div>

  {contributionsLoading ? (
    <div className="contributions-loading">
      Loading donor contributions...
    </div>
  ) : fundingContributions.length === 0 ? (
    <div className="contributions-empty">
      No donor contributions found for this funding request.
    </div>
  ) : (
    <div className="contributions-table-wrapper">
      <table className="contributions-table">
        <thead>
          <tr>
            <th>Donor</th>
            <th>Donor Reference</th>
            <th>Consent</th>
            <th>Amount</th>
            <th>Transaction</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {fundingContributions.map((contribution) => (
            <tr key={contribution.contribution_id}>

              <td>
                <strong>
                  {contribution.donor_name}
                </strong>
              </td>

              <td>
                {contribution.donor_reference}
              </td>

              <td>
                {contribution.consent_reference}
              </td>

              <td className="contribution-amount">
                ₹
                {Number(
                  contribution.amount || 0
                ).toLocaleString("en-IN")}
              </td>

              <td>
                {contribution.transaction_reference || "—"}
              </td>

              <td>
                <span className="settled">
                  {contribution.status}
                </span>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}

</div>
                </div>
               
                
              ) : (
                <>
                
                  <div
                    style={{
                      padding: "22px 25px",
                      borderBottom:
                        "1px solid #edf0f4"
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search funding reference, case, patient or hospital..."
                      value={fundingSearch}
                      onChange={(e) =>
                        searchFunding(e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "13px 15px",
                        border: "1px solid #dfe6ee",
                        borderRadius: "10px",
                        fontSize: "14px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(4, minmax(0, 1fr))",
                      gap: "14px",
                      padding: "20px 25px",
                      borderBottom:
                        "1px solid #edf0f4"
                    }}
                  >
                    <StatusCard
                      title="All Funding"
                      value={fundingStats.total}
                      active={fundingStatus === "ALL"}
                      onClick={() =>
                        changeFundingStatus("ALL")
                      }
                    />

                    <StatusCard
                      title="Pending"
                      value={fundingStats.pending}
                      active={fundingStatus === "PENDING"}
                      onClick={() =>
                        changeFundingStatus("PENDING")
                      }
                    />

                    <StatusCard
                      title="Allocated"
                      value={fundingStats.allocated}
                      active={fundingStatus === "ALLOCATED"}
                      onClick={() =>
                        changeFundingStatus("ALLOCATED")
                      }
                    />

                    <StatusCard
                      title="Settled"
                      value={fundingStats.settled}
                      active={fundingStatus === "SETTLED"}
                      onClick={() =>
                        changeFundingStatus("SETTLED")
                      }
                    />
                  </div>

                  <div
                    style={{
                      padding: "14px 25px",
                      color: "#7c899b",
                      fontSize: "13px",
                      borderBottom:
                        "1px solid #edf0f4"
                    }}
                  >
                    Showing{" "}
                    <strong style={{ color: "#243b5a" }}>
                      {fundingRequests.length}
                    </strong>{" "}
                    of{" "}
                    <strong style={{ color: "#243b5a" }}>
                      {fundingTotal.toLocaleString("en-IN")}
                    </strong>{" "}
                    matching funding requests
                  </div>

                  {fundingError && (
                    <div
                      style={{
                        margin: "20px 25px",
                        padding: "14px",
                        borderRadius: "10px",
                        background: "#fff1f1",
                        color: "#b42318",
                        border: "1px solid #ffd0d0"
                      }}
                    >
                      {fundingError}
                    </div>
                  )}
                  

                  {fundingLoading ? (
                    <div className="empty-state">
                      Loading funding requests...
                    </div>
                  ) : fundingRequests.length === 0 ? (
                    <div className="empty-state">
                      No funding requests found.
                    </div>
                  ) : (
                    <div>
                      {fundingRequests.map((funding) => (
                        <button
                          key={funding.funding_id}
                          onClick={() => {
  setSelectedFunding(funding);
  loadFundingContributions(funding.funding_id);
}}
                          style={{
                            width: "100%",
                            border: 0,
                            borderBottom:
                              "1px solid #edf0f4",
                            background: "#fff",
                            padding: "17px 25px",
                            cursor: "pointer",
                            textAlign: "left",
                            display: "grid",
                            gridTemplateColumns:
                              "1.7fr 1.5fr 1fr 1fr auto",
                            gap: "18px",
                            alignItems: "center"
                          }}
                        >
                          <div>
                            <strong
                              style={{ fontSize: "13px" }}
                            >
                              {funding.funding_reference}
                            </strong>

                            <span
                              style={{
                                display: "block",
                                marginTop: "4px",
                                color: "#929dad",
                                fontSize: "10px"
                              }}
                            >
                              ID #{funding.funding_id}
                            </span>
                          </div>

                          <div>
                            <strong
                              style={{ fontSize: "13px" }}
                            >
                              {funding.case_reference}
                            </strong>

                            <span
                              style={{
                                display: "block",
                                marginTop: "4px",
                                color: "#929dad",
                                fontSize: "10px"
                              }}
                            >
                              Patient:{" "}
                              {funding.patient_reference}
                            </span>
                          </div>

                          <div>
                            <strong
                              style={{ fontSize: "13px" }}
                            >
                              ₹
                              {Number(
                                funding.requested_amount || 0
                              ).toLocaleString("en-IN")}
                            </strong>

                            <span
                              style={{
                                display: "block",
                                marginTop: "4px",
                                color: "#929dad",
                                fontSize: "10px"
                              }}
                            >
                              Requested
                            </span>
                          </div>

                          <div>
                            <span className="settled">
                              {funding.status}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: "20px",
                              color: "#087f73"
                            }}
                          >
                            →
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  

                  {!fundingLoading &&
                    fundingTotalPages > 1 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "12px",
                          padding: "20px",
                          borderTop:
                            "1px solid #edf0f4"
                        }}
                      >
                        <button
                          className="refresh-button"
                          disabled={fundingPage <= 1}
                          onClick={() =>
                            goToFundingPage(
                              fundingPage - 1
                            )
                          }
                        >
                          ← Previous
                        </button>

                        <span
                          style={{
                            color: "#68778d",
                            fontSize: "13px"
                          }}
                        >
                          Page{" "}
                          <strong>{fundingPage}</strong>{" "}
                          of{" "}
                          <strong>{fundingTotalPages}</strong>
                        </span>

                        <button
                          className="refresh-button"
                          disabled={
                            fundingPage >=
                            fundingTotalPages
                          }
                          onClick={() =>
                            goToFundingPage(
                              fundingPage + 1
                            )
                          }
                        >
                          Next →
                        </button>
                      </div>
                    )}
                </>
              )}
            </section>
            

          /***********************
    AUDIT
************************/
) : activePage === "audit" ? (
  <section className="security-panel">

    {/* Audit Header */}
    <div className="audit-header">
      <div className="audit-title">
        <span className="security-icon">🔐</span>

        <div>
          <h3>Security & Audit</h3>

          <p>
            All financial transactions are recorded with audit
            trails and idempotency protection.
          </p>
        </div>
      </div>

      <div className="audit-count">
        <strong>{auditLogs.length}</strong>
        <span>Audit Events</span>
      </div>
    </div>

    {/* Audit Events */}
    <div className="audit-events">

      <div className="audit-events-header">
        <div>
          <h3>Audit Events</h3>
          <p>Recent security and transaction activity</p>
        </div>

        <button
          className="refresh-button"
          onClick={loadBankData}
        >
          Refresh
        </button>
      </div>

      {auditLogs.length === 0 ? (
        <div className="empty-state">
          No audit events found.
        </div>
      ) : (
        <div className="audit-list">

          {auditLogs.map((log, index) => (
            <div
              className="audit-row"
              key={log.id || log.audit_id || index}
            >

              <div className="audit-event-icon">
                🔐
              </div>

              <div className="audit-event-info">
                <strong>
                  {log.event_type ||
                    log.action ||
                    log.event ||
                    "Audit Event"}
                </strong>

                <span>
                  {log.description ||
                    log.message ||
                    log.details ||
                    "Security event recorded"}
                </span>
              </div>

              <div className="audit-event-reference">
                <strong>
                  {log.transaction_reference ||
                    log.reference ||
                    log.entity_reference ||
                    "—"}
                </strong>

                <span>
                  {log.created_at
                    ? new Date(
                        log.created_at
                      ).toLocaleString("en-IN")
                    : log.timestamp
                    ? new Date(
                        log.timestamp
                      ).toLocaleString("en-IN")
                    : "—"}
                </span>
              </div>

              <div className="audit-event-status">
                <span className="settled">
                  {log.status ||
                    log.result ||
                    "RECORDED"}
                </span>
              </div>

            </div>
          ))}

        </div>
      )}
    </div>

  </section>

          /* =========================
             DASHBOARD
          ========================= */
          ) : (
            <>
              <div className="welcome">
                <div>
                  <span>SECURE BANKING PORTAL</span>

                  <h3>Financial Operations</h3>

                  <p>
                    Monitor hospital funding, settlements and
                    transaction activity.
                  </p>
                </div>

                <div className="online-badge">
                  ● SYSTEM ONLINE
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <span>Total Settled Transactions</span>

                  <strong>
                    ₹
                    {totalSettled.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                  <small>
                    Successfully settled
                  </small>
                </div>

                <div className="stat-card">
                  <span>Total Funding Settlements</span>

<strong>
  {summaryTransactions.length}
</strong>

                  <small>
                    Bank transactions
                  </small>
                </div>

                <div className="stat-card">
                  <span>Audit Events</span>

                  <strong>
                    {auditLogs.length}
                  </strong>

                  <small>
                    Security records
                  </small>
                </div>

                <div className="stat-card">
                  <span>Bank Status</span>

                  <strong className="healthy">
                    ONLINE
                  </strong>

                  <small>
                    All systems operational
                  </small>
                </div>
              </div>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Recent Transactions</h3>
                    <p>
                      Latest settlement activity
                    </p>
                  </div>

                  <button
                    className="refresh-button"
                    onClick={loadBankData}
                  >
                    Refresh
                  </button>
                </div>

                {loading ? (
                  <div className="empty-state">
                    Loading transactions...
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="empty-state">
                    No transactions found.
                  </div>
                ) : (
                  
                  <div className="transaction-list">
  {summaryTransactions.map((transaction) => {
    const donorTransactions = transactions.filter(
      (item) =>
        item.transaction_type ===
          "DONOR_TO_MEDBRIDGE" &&
        item.medbridge_transaction_reference ===
          transaction.medbridge_transaction_reference
    );

    const donorTotal = donorTransactions.reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0
    );

    return (
      <div
        className="transaction-row"
        key={transaction.transaction_reference}
        onClick={() =>
          setSelectedTransaction(transaction)
        }
        style={{
          cursor: "pointer"
        }}
      >
        <div className="transaction-icon">
          ₹
        </div>

        <div className="transaction-info">
          <strong>
            {transaction.transaction_reference}
          </strong>

          <span>
            MedBridge:{" "}
            {transaction.medbridge_transaction_reference}
          </span>

          <span>
            Medical Funding Settlement
          </span>
        </div>

        <div className="transaction-account">
          <strong>
            {transaction.hospital_account_reference}
          </strong>

          <span>
            {donorTransactions.length} donor(s)
          </span>
        </div>

        <div className="transaction-amount">
          <strong>
            ₹
            {Number(
              transaction.amount || 0
            ).toLocaleString("en-IN")}
          </strong>

          <span className="settled">
            {transaction.transaction_status}
          </span>

          {donorTransactions.length > 0 && (
            <span
              style={{
                display: "block",
                marginTop: "6px",
                color: "#087f73",
                fontSize: "10px",
                fontWeight: 700
              }}
            >
              View {donorTransactions.length} donors →
            </span>
          )}
        </div>
      </div>
    );
  })}
</div>
                )}
              </section>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function FundingInfo({ label, value }) {
  return (
    <div className="funding-info-card">
      <div className="funding-info-label">
        {label}
      </div>

      <div className="funding-info-value">
        {value}
      </div>
    </div>
  );
}


function StatusCard({
  title,
  value,
  active,
  onClick
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: active
          ? "2px solid #222"
          : "1px solid #e4eaf1",
        background: active
          ? "#e7f5f3"
          : "#fff",
        color: active
          ? "#087f73"
          : "#61708a",
        borderRadius: "10px",
        padding: "15px",
        cursor: "pointer",
        textAlign: "left",
        minHeight: "82px"
      }}
    >
      <span
        style={{
          display: "block",
          fontSize: "13px"
        }}
      >
        {title}
      </span>

      <strong
        style={{
          display: "block",
          marginTop: "5px",
          fontSize: "20px"
        }}
      >
        {Number(value || 0).toLocaleString("en-IN")}
      </strong>
    </button>
  );
}

export default App;