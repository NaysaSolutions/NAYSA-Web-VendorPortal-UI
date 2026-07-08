import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const STATUS_FILTERS = [
  { label: "All Status", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Returned", value: "RETURNED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Draft", value: "DRAFT" },
];

export default function VendorCanvassTable({
  vendor,
  canvassSheets = [],
  loading = false,
  error = "",
  title = "Vendor Canvass Sheets",
  onRowClick,
  onBackToDashboard,
  onLogout,
}) {
  const vendorCode = getVendorCode(vendor);
  const vendorName = getVendorName(vendor);

  const [fetchedSheets, setFetchedSheets] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    if (!vendorCode || canvassSheets.length > 0) {
      return;
    }

    let ignore = false;

    async function fetchVendorCanvassSheets() {
      setFetching(true);
      setFetchError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/vendor-portal/canvass/by-vendor-code`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              vend_code: vendorCode,
            }),
          }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to fetch vendor canvass sheets."
          );
        }

        if (!ignore) {
          setFetchedSheets(getCanvassArrayFromResponse(result.data));
        }
      } catch (fetchErrorValue) {
        console.error("Fetch vendor canvass table error:", fetchErrorValue);

        if (!ignore) {
          setFetchedSheets([]);
          setFetchError(
            fetchErrorValue.message || "Unable to connect to the server."
          );
        }
      } finally {
        if (!ignore) {
          setFetching(false);
        }
      }
    }

    fetchVendorCanvassSheets();

    return () => {
      ignore = true;
    };
  }, [canvassSheets.length, reloadKey, vendorCode]);

  const rows = useMemo(() => {
    const sourceSheets =
      canvassSheets.length > 0 ? canvassSheets : fetchedSheets;

    return normalizeCanvassSheets(sourceSheets).filter((sheet) => {
      if (!vendorCode || !sheet.vendorCode) return true;

      return String(sheet.vendorCode).toUpperCase() === vendorCode.toUpperCase();
    });
  }, [canvassSheets, fetchedSheets, vendorCode]);

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return rows.filter((sheet) => {
      const normalizedStatus = normalizeStatus(sheet.status);
      const matchesStatus =
        statusFilter === "ALL" ||
        normalizedStatus === statusFilter ||
        (statusFilter === "RETURNED" &&
          ["RETURNED", "RETURNED FOR CORRECTION"].includes(normalizedStatus));

      if (!matchesStatus) return false;
      if (!query) return true;

      const searchable = [
        sheet.branch,
        sheet.documentNo,
        sheet.documentDate,
        sheet.status,
        sheet.vendorCode,
        sheet.canId,
        sheet.canSupplierId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [rows, searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    const count = (statuses) =>
      rows.filter((sheet) => statuses.includes(normalizeStatus(sheet.status)))
        .length;

    return {
      total: rows.length,
      pending: count(["PENDING", "DRAFT"]),
      submitted: count(["SUBMITTED"]),
      approved: count(["APPROVED"]),
    };
  }, [rows]);

  const isLoading = loading || fetching;
  const displayError = error || fetchError;
  const canRefresh = Boolean(vendorCode) && canvassSheets.length === 0;

  const handleRefresh = () => {
    if (!canRefresh || fetching) return;
    setReloadKey((value) => value + 1);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f2f57] text-sm font-black uppercase text-white shadow-sm">
              {getInitials(vendorName || vendorCode || "VC")}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-tight text-slate-900">
                Vendor Canvass Sheet
              </h1>

              <p className="truncate text-xs font-medium text-slate-500">
                {vendorName || "Vendor"} · Vendor Code: {vendorCode || "-"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ArrowLeftIcon />
                Dashboard
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] space-y-5 px-4 py-5 md:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-[#0f2f57] shadow-sm ring-1 ring-slate-200">
          <div className="relative p-5 text-white md:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(125,211,252,.28),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,.22),transparent_30%)]" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                {/* <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-sky-100">
                  Vendor Portal
                </div> */}

                <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                  {title}
                </h2>

                <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-sky-100">
                  Review canvass invitations, open quotation sheets, and submit offers assigned to your vendor account.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[520px]">
                <HeroMetric label="Total" value={metrics.total} />
                <HeroMetric label="Pending" value={metrics.pending} />
                <HeroMetric label="Submitted" value={metrics.submitted} />
                <HeroMetric label="Approved" value={metrics.approved} />
              </div>
            </div>
          </div>
        </section>

        {/* <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="All Records" value={metrics.total} helper="Canvass sheets" active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")} />
          <SummaryCard label="Pending" value={metrics.pending} helper="Needs action" tone="blue" active={statusFilter === "PENDING"} onClick={() => setStatusFilter("PENDING")} />
          <SummaryCard label="Submitted" value={metrics.submitted} helper="Offers sent" tone="emerald" active={statusFilter === "SUBMITTED"} onClick={() => setStatusFilter("SUBMITTED")} />
          <SummaryCard label="Approved" value={metrics.approved} helper="Accepted records" tone="sky" active={statusFilter === "APPROVED"} onClick={() => setStatusFilter("APPROVED")} />
        </section> */}

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-sky-700">
                  Canvass List
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Available Canvass Sheets
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Showing {filteredRows.length} of {rows.length} record{rows.length === 1 ? "" : "s"}.
                </p>
              </div>

              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_190px_auto] lg:w-[720px]">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <SearchIcon />
                  </span>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search branch, canvass no., status..."
                    className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#0f2f57] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#0f2f57] focus:ring-2 focus:ring-blue-100"
                >
                  {STATUS_FILTERS.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={!canRefresh || isLoading}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {isLoading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>

            {displayError && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                <WarningIcon />
                <span>{displayError}</span>
              </div>
            )}
          </div>

          <div className="overflow-hidden">
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-[880px] border-separate border-spacing-0 text-left">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <TableHead>Branch</TableHead>
                    <TableHead>Canvass No.</TableHead>
                    <TableHead>Canvass Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-14 text-center">
                        <LoadingState label="Loading canvass sheets..." />
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-14 text-center">
                        <EmptyState
                          title="No canvass sheets found"
                          message={
                            rows.length === 0
                              ? "There are no canvass sheets assigned to this vendor yet."
                              : "No records match your current search or status filter."
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((sheet) => (
                      <tr
                        key={sheet.id}
                        onClick={() => onRowClick?.(sheet.clickPayload)}
                        className={`transition hover:bg-sky-50/50 ${
                          onRowClick ? "cursor-pointer" : ""
                        }`}
                      >
                        <TableCell strong>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs font-black text-slate-600">
                              {getInitials(sheet.branch)}
                            </div>
                            <span>{sheet.branch}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="font-black text-slate-800">
                            {sheet.documentNo}
                          </span>
                        </TableCell>

                        <TableCell>{formatDate(sheet.documentDate)}</TableCell>

                        <TableCell>
                          <StatusPill status={sheet.status} />
                        </TableCell>

                        <TableCell>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onRowClick?.(sheet.clickPayload);
                            }}
                            disabled={!onRowClick}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#0f2f57] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#143f72] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                          >
                            View Details
                            <ArrowRightIcon />
                          </button>
                        </TableCell>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function getCanvassArrayFromResponse(data) {
  if (!data) return [];

  if (Array.isArray(data)) return data;

  const list = firstValue(
    data.canvassSheets,
    data.canvass_sheets,
    data.canvasses,
    data.canvass,
    data.records,
    data.rows,
    data.list
  );

  if (Array.isArray(list)) return list;

  return [data];
}

function normalizeCanvassSheets(canvassSheets) {
  if (!Array.isArray(canvassSheets)) return [];

  return canvassSheets.map((sheet, index) => {
    const canSupplierId = firstValue(
      sheet.canSupplierId,
      sheet.can_supplier_id,
      sheet.CAN_SUPPLIER_ID
    );

    const canId = firstValue(sheet.canId, sheet.can_id, sheet.CAN_ID);

    const documentNo = firstValue(
      sheet.documentNo,
      sheet.document_no,
      sheet.docNo,
      sheet.doc_no,
      sheet.canNo,
      sheet.can_no,
      sheet.CAN_NO,
      sheet.DOC_NO
    );

    const branch = firstValue(
      sheet.branch,
      sheet.branchCode,
      sheet.branch_code,
      sheet.branchName,
      sheet.branch_name,
      sheet.BRANCH_CODE,
      sheet.BRANCH_NAME
    );

    const documentDate = firstValue(
      sheet.documentDate,
      sheet.document_date,
      sheet.docDate,
      sheet.doc_date,
      sheet.canDate,
      sheet.can_date,
      sheet.date,
      sheet.DOC_DATE,
      sheet.CAN_DATE
    );

    const status = firstValue(
      sheet.status,
      sheet.canStatus,
      sheet.can_status,
      sheet.documentStatus,
      sheet.document_status,
      sheet.STATUS
    );

    const vendorCode = firstValue(
      sheet.vendorCode,
      sheet.vendor_code,
      sheet.vendCode,
      sheet.vend_code,
      sheet.supplierCode,
      sheet.supplier_code,
      sheet.VEND_CODE,
      sheet.SUPPLIER_CODE
    );

    const clickPayload = {
      ...sheet,

      canId,
      can_id: canId,

      canSupplierId,
      can_supplier_id: canSupplierId,

      vendorCode,
      vend_code: vendorCode,

      branch,
      branch_code: branch,

      canNo: documentNo,
      can_no: documentNo,

      canDate: documentDate,
      can_date: documentDate,
    };

    return {
      id:
        firstValue(canSupplierId, canId, sheet.id, documentNo) ||
        `canvass-${index}`,

      canId,
      canSupplierId,

      branch: branch || "-",
      documentNo: documentNo || "-",
      documentDate: documentDate || "",
      status: status || "Pending",
      vendorCode: vendorCode || "",

      raw: sheet,
      clickPayload,
    };
  });
}

function getVendorCode(vendor = {}) {
  return (
    firstValue(
      vendor.vendorCode,
      vendor.vendor_code,
      vendor.vendCode,
      vendor.vend_code,
      vendor.supplierCode,
      vendor.supplier_code,
      vendor.VEND_CODE,
      vendor.SUPPLIER_CODE,
      vendor.vendorInfo?.vendorCode,
      vendor.vendorInfo?.vendor_code,
      vendor.vendorInfo?.VEND_CODE
    ) || ""
  );
}

function getVendorName(vendor = {}) {
  return (
    firstValue(
      vendor.vendorName,
      vendor.vendor_name,
      vendor.vendName,
      vendor.vend_name,
      vendor.supplierName,
      vendor.supplier_name,
      vendor.name,
      vendor.VEND_NAME,
      vendor.SUPPLIER_NAME,
      vendor.vendorInfo?.vendorName,
      vendor.vendorInfo?.vendor_name,
      vendor.vendorInfo?.VEND_NAME
    ) || "Vendor"
  );
}

function firstValue(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== ""
  );
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function TableHead({ children }) {
  return (
    <th className="whitespace-nowrap border-b border-slate-200 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children, strong = false }) {
  return (
    <td
      className={`px-5 py-4 align-middle text-sm ${
        strong ? "font-black text-slate-800" : "font-semibold text-slate-600"
      }`}
    >
      {children || "-"}
    </td>
  );
}

function StatusPill({ status }) {
  const normalized = normalizeStatus(status);
  const display = toTitleCase(normalized.replaceAll("_", " "));

  const cls =
    normalized === "APPROVED" || normalized === "SUBMITTED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "REJECTED" || normalized === "CANCELLED"
      ? "border-red-200 bg-red-50 text-red-700"
      : normalized === "RETURNED" || normalized === "RETURNED FOR CORRECTION"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : normalized === "DRAFT"
      ? "border-slate-200 bg-slate-50 text-slate-700"
      : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${cls}`}
    >
      {display}
    </span>
  );
}

function HeroMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
      <p className="text-[10px] font-black uppercase tracking-wider text-sky-100">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function SummaryCard({ label, value, helper, tone = "slate", active, onClick }) {
  const toneMap = {
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-[#0f2f57] ring-2 ring-blue-100" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">{helper}</p>
        </div>

        <span className={`rounded-2xl border px-2.5 py-1 text-xs font-black ${toneMap[tone]}`}>
          View
        </span>
      </div>

      <p className="mt-4 text-3xl font-black text-slate-800">{value}</p>
    </button>
  );
}

function LoadingState({ label }) {
  return (
    <div className="mx-auto flex w-fit items-center justify-center gap-3 rounded-2xl bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-700" />
      <span>{label}</span>
    </div>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
        <FolderIcon />
      </div>
      <p className="mt-4 text-base font-black text-slate-700">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
    </div>
  );
}

function normalizeStatus(status) {
  const normalized = String(status || "Pending").trim().toUpperCase();

  if (normalized === "D") return "PENDING";
  if (normalized === "F") return "SUBMITTED";
  if (normalized === "C") return "APPROVED";

  return normalized;
}

function toTitleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getInitials(value) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "VC";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.1-5.4a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A2.5 2.5 0 0 1 5.5 5h4l2 2h7A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 4.3 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18 9 12l6-6" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
    </svg>
  );
}
