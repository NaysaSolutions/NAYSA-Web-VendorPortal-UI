import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const STATUS_FILTERS = [
  { label: "All", value: "ALL" },
  { label: "For Review", value: "FOR REVIEW" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Returned", value: "RETURNED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function VendorAccreditation({
  currentUser,
  applications = [],
  requiredDocuments = [],
  onAction,
}) {
  const [selectedApplicationId, setSelectedApplicationId] = useState(
    applications?.[0]?.id || ""
  );

  const [actionModal, setActionModal] = useState({
    open: false,
    action: "",
    title: "",
  });

  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const accreditationApplications = useMemo(() => {
    return applications.filter((app) => {
      const status = String(app.status || "").toUpperCase();

      return [
        "FOR REVIEW",
        "PENDING APPROVAL",
        "FOR ACCREDITATION",
        "RETURNED",
        "RETURNED FOR CORRECTION",
        "APPROVED",
        "REJECTED",
      ].includes(status);
    });
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return accreditationApplications.filter((app) => {
      const status = String(app.status || "").toUpperCase();
      const matchesStatus =
        statusFilter === "ALL" ||
        status === statusFilter ||
        (statusFilter === "PENDING" &&
          ["PENDING APPROVAL", "FOR ACCREDITATION"].includes(status)) ||
        (statusFilter === "RETURNED" &&
          ["RETURNED", "RETURNED FOR CORRECTION"].includes(status));

      if (!matchesStatus) return false;
      if (!query) return true;

      const searchable = [
        app.regNo,
        app.vendorCode,
        app.vendorName,
        app.vendorEmail,
        app.businessName,
        app.contactPerson,
        app.vendorInfo?.vendorName,
        app.vendorInfo?.businessName,
        app.vendorInfo?.email,
        app.vendorInfo?.contactPerson,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [accreditationApplications, searchTerm, statusFilter]);

  useEffect(() => {
    if (filteredApplications.length === 0) {
      setSelectedApplicationId("");
      return;
    }

    const selectedStillExists = filteredApplications.some(
      (app) => String(app.id) === String(selectedApplicationId)
    );

    if (!selectedStillExists) {
      setSelectedApplicationId(filteredApplications[0].id);
    }
  }, [filteredApplications, selectedApplicationId]);

  const selectedApplication = useMemo(() => {
    return (
      filteredApplications.find(
        (app) => String(app.id) === String(selectedApplicationId)
      ) ||
      filteredApplications[0] ||
      null
    );
  }, [filteredApplications, selectedApplicationId]);

  const selectedVendorInfo = selectedApplication?.vendorInfo || {};
  const selectedVendorDetails = {
    tinNo: getFieldValue(
      selectedVendorInfo,
      selectedApplication,
      "tinNo",
      "tin_no",
      "tin",
      "TIN",
      "VEND_TIN"
    ),
    zipCode: getFieldValue(
      selectedVendorInfo,
      selectedApplication,
      "zipCode",
      "zip_code",
      "zip",
      "VEND_ZIP",
      "VEND_ZIPCODE"
    ),
    address: getFieldValue(
      selectedVendorInfo,
      selectedApplication,
      "address",
      "address1",
      "addr1",
      "VEND_ADDR",
      "VEND_ADDR1"
    ),
    paymentTerms: getFieldValue(
      selectedVendorInfo,
      selectedApplication,
      "paymentTerms",
      "payment_terms",
      "paytermCode",
      "payterm_code",
      "PAYTERM_CODE"
    ),
  };

  const selectedRequiredDocuments =
    selectedApplication?.requiredDocuments?.length > 0
      ? selectedApplication.requiredDocuments
      : requiredDocuments;

  const uploadedDocumentCount = useMemo(() => {
    if (!selectedApplication) return 0;

    return selectedRequiredDocuments.filter((doc) =>
      getUploadedDocument(selectedApplication, doc.code)
    ).length;
  }, [selectedApplication, selectedRequiredDocuments]);

  const requiredDocumentCount = selectedRequiredDocuments.filter(
    (doc) => doc.required
  ).length;

  const missingRequiredCount = selectedRequiredDocuments.filter(
    (doc) => doc.required && !getUploadedDocument(selectedApplication, doc.code)
  ).length;

  const selectedStatus = String(selectedApplication?.status || "").toUpperCase();
  const isApproved = selectedStatus === "APPROVED";
  const isRejected = selectedStatus === "REJECTED";

  const countByStatuses = (statuses) =>
    accreditationApplications.filter((app) =>
      statuses.includes(String(app.status || "").toUpperCase())
    ).length;

  const forReviewCount = countByStatuses(["FOR REVIEW"]);
  const pendingCount = countByStatuses(["PENDING APPROVAL", "FOR ACCREDITATION"]);
  const approvedCount = countByStatuses(["APPROVED"]);
  const returnedCount = countByStatuses(["RETURNED", "RETURNED FOR CORRECTION"]);
  const rejectedCount = countByStatuses(["REJECTED"]);

  const openActionModal = (action) => {
    const actionText = {
      approve: "Approve Accreditation",
      reject: "Reject Accreditation",
      return: "Return for Correction",
    };

    setActionModal({
      open: true,
      action,
      title: actionText[action] || "Accreditation Action",
    });

    setRemarks("");
  };

  const closeActionModal = () => {
    if (submitting) return;

    setActionModal({
      open: false,
      action: "",
      title: "",
    });

    setRemarks("");
  };

  const handleSubmitAction = async () => {
    if (!selectedApplication) return;

    if (!remarks.trim()) {
      alert("Remarks are required before submitting a decision.");
      return;
    }

    setSubmitting(true);

    try {
      const success = await onAction?.(
        selectedApplication.id,
        actionModal.action,
        remarks
      );

      if (success !== false) {
        closeActionModal();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-slate-100 text-slate-700">
      <main className="mx-auto w-full max-w-[1500px] space-y-5 px-3 py-4 sm:px-4 lg:px-6">
        <section className="overflow-hidden rounded-3xl bg-[#0f2f57] shadow-sm ring-1 ring-slate-200">
          <div className="relative p-5 text-white md:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(125,211,252,.26),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(59,130,246,.22),transparent_28%)]" />

            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                {/* <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-sky-100">
                  Vendor Accreditation
                </div> */}

                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Vendor Accreditation
                </h1>

                <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-sky-100">
                  Review submitted vendor details, verify uploaded accreditation documents, and submit approval decisions.
                </p>
              </div>

              {/* <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[430px]">
                <MiniMetric label="Total" value={accreditationApplications.length} />
                <MiniMetric label="Pending" value={forReviewCount + pendingCount} />
                <MiniMetric label="Approved" value={approvedCount} />
              </div> */}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="For Review"
            value={forReviewCount}
            helper="New submissions"
            tone="sky"
            active={statusFilter === "FOR REVIEW"}
            onClick={() => setStatusFilter("FOR REVIEW")}
          />
          <SummaryCard
            label="Pending Approval"
            value={pendingCount}
            helper="Waiting decision"
            tone="blue"
            active={statusFilter === "PENDING"}
            onClick={() => setStatusFilter("PENDING")}
          />
          <SummaryCard
            label="Approved"
            value={approvedCount}
            helper="Vendor created"
            tone="emerald"
            active={statusFilter === "APPROVED"}
            onClick={() => setStatusFilter("APPROVED")}
          />
          <SummaryCard
            label="Returned"
            value={returnedCount}
            helper="Needs correction"
            tone="amber"
            active={statusFilter === "RETURNED"}
            onClick={() => setStatusFilter("RETURNED")}
          />
          <SummaryCard
            label="Rejected"
            value={rejectedCount}
            helper="Not accepted"
            tone="red"
            active={statusFilter === "REJECTED"}
            onClick={() => setStatusFilter("REJECTED")}
          />
        </section>

        <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="min-w-0 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                    Vendor Applications
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Select a vendor to review.
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {filteredApplications.length}/{accreditationApplications.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <SearchIcon />
                  </span>
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search vendor, reg no., email..."
                    className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#0f2f57] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Status Filter
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#0f2f57] focus:ring-2 focus:ring-blue-100"
                  >
                    {STATUS_FILTERS.map((filter) => (
                      <option key={filter.value} value={filter.value}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="max-h-[800px] space-y-2 overflow-auto bg-slate-50/70 p-3">
              {filteredApplications.length === 0 ? (
                <EmptyState
                  title="No applications found"
                  message="No vendor accreditation records match the current search or filter."
                />
              ) : (
                filteredApplications.map((app) => {
                  const selected =
                    String(app.id) === String(selectedApplication?.id);

                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedApplicationId(app.id)}
                      className={`group w-full rounded-2xl border p-3 text-left transition ${
                        selected
                          ? "border-sky-300 bg-sky-50 shadow-sm ring-2 ring-sky-100"
                          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-700">
                            {app.vendorInfo?.vendorName || app.vendorName || "-"}
                          </p>

                          <p className="mt-1 truncate text-xs font-bold text-slate-500">
                            {app.regNo || "No Registration No."}
                          </p>
                        </div>

                        <StatusPill status={app.status} small />
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-slate-500">
                        <ListMeta
                          label="Business"
                          value={app.vendorInfo?.businessName || app.businessName || "-"}
                        />
                        <ListMeta
                          label="Email"
                          value={app.vendorInfo?.email || app.vendorEmail || "-"}
                        />
                        <ListMeta
                          label="Contact"
                          value={app.vendorInfo?.contactPerson || app.contactPerson || "-"}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            {!selectedApplication ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <FolderIcon />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-700">
                  Select a vendor application
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Choose an application from the list to review vendor information and uploaded documents.
                </p>
              </div>
            ) : (
              <>
                <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                  <div className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <StatusPill status={selectedApplication.status} />
                          {selectedApplication.vendorCode && (
                            <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                              Vendor Code: {selectedApplication.vendorCode}
                            </span>
                          )}
                        </div>

                        <h2 className="truncate text-2xl font-bold text-slate-800">
                          {selectedVendorInfo.vendorName ||
                            selectedApplication.vendorName ||
                            "-"}
                        </h2>

                        <p className="mt-1 text-sm font-medium text-slate-500">
                          Registration No.:{" "}
                          <span className="font-semibold text-slate-600">
                            {selectedApplication.regNo || "-"}
                          </span>
                        </p>
                      </div>

                      {/* <div className="grid grid-cols-3 gap-2 sm:w-[390px]">
                        <ReviewMetric label="Documents" value={`${uploadedDocumentCount}/${selectedRequiredDocuments.length}`} />
                        <ReviewMetric label="Required" value={requiredDocumentCount} />
                        <ReviewMetric label="Missing" value={missingRequiredCount} danger={missingRequiredCount > 0} />
                      </div> */}
                    </div>
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-4 p-5 lg:grid-cols-2">
                    <SectionCard title="Company Information" description="Vendor master details for accreditation review.">
                      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
                        <DetailBox
                          label="Vendor Name"
                          value={
                            selectedVendorInfo.vendorName ||
                            selectedApplication.vendorName
                          }
                        />

                        <DetailBox
                          label="Business Name"
                          value={
                            selectedVendorInfo.businessName ||
                            selectedApplication.businessName
                          }
                        />

                        <DetailBox
                          label="Tax Identification No."
                          value={selectedVendorDetails.tinNo}
                        />

                        <DetailBox
                          label="Tax Class"
                          value={selectedVendorInfo.taxClass}
                        />

                        <DetailBox
                          label="Tax Type"
                          value={selectedVendorInfo.taxType}
                        />

                        <DetailBox
                          label="Zip Code"
                          value={selectedVendorDetails.zipCode}
                        />

                        <DetailBox
                          label="Address"
                          value={selectedVendorDetails.address}
                          wide
                        />

                        <DetailBox
                          label="Payment Terms"
                          value={selectedVendorDetails.paymentTerms}
                        />
                      </div>
                    </SectionCard>

                    <SectionCard title="Contact Details" description="Primary contact information submitted by the vendor.">
                      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
                        <DetailBox
                          label="Contact Person"
                          value={
                            selectedVendorInfo.contactPerson ||
                            selectedApplication.contactPerson
                          }
                        />

                        <DetailBox
                          label="Contact No."
                          value={
                            selectedVendorInfo.contactNo ||
                            selectedApplication.contactNo
                          }
                        />

                        <DetailBox
                          label="Email Address"
                          value={
                            selectedVendorInfo.email ||
                            selectedApplication.vendorEmail
                          }
                          wide
                        />
                      </div>

                      <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                        Review all vendor details and documents before approving. Approval may create or update the vendor master record.
                      </div>
                    </SectionCard>
                  </div>
                </section>

                <section className="min-w-0 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                  <div className="border-b border-slate-200 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                          Uploaded Accreditation Documents
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Verify required documents uploaded by the vendor.
                        </p>
                      </div>

                      <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
                        Uploaded: {uploadedDocumentCount}/{selectedRequiredDocuments.length}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden">
                    <div className="max-w-full overflow-x-auto">
                      <table className="min-w-[840px] divide-y divide-slate-200 text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50">
                          <tr>
                            <TableHead>Document</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>File Name</TableHead>
                            <TableHead>Uploaded Date</TableHead>
                            <TableHead>Action</TableHead>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                          {selectedRequiredDocuments.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-10 text-center text-sm text-slate-500"
                              >
                                No required documents found.
                              </td>
                            </tr>
                          ) : (
                            selectedRequiredDocuments.map((doc) => {
                              const upload = getUploadedDocument(
                                selectedApplication,
                                doc.code
                              );

                              const fileUrl = getDocumentUrl(upload);

                              return (
                                <tr key={doc.code} className="hover:bg-slate-50/80">
                                  <TableCell strong>
                                    <div className="min-w-0">
                                      <p className="truncate font-semibold text-slate-700">
                                        {doc.name}
                                      </p>
                                      {doc.description && (
                                        <p className="mt-1 max-w-[280px] truncate text-xs font-medium text-slate-500">
                                          {doc.description}
                                        </p>
                                      )}
                                    </div>
                                  </TableCell>

                                  <TableCell>{doc.code}</TableCell>

                                  <TableCell>
                                    {upload ? (
                                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                        Uploaded
                                      </span>
                                    ) : doc.required ? (
                                      <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                                        Missing
                                      </span>
                                    ) : (
                                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                                        Optional
                                      </span>
                                    )}
                                  </TableCell>

                                  <TableCell>
                                    <span className="block max-w-[260px] truncate font-medium text-slate-600">
                                      {upload?.originalFileName ||
                                        upload?.fileName ||
                                        upload?.storedFileName ||
                                        "-"}
                                    </span>
                                  </TableCell>

                                  <TableCell>
                                    {formatDate(upload?.uploadedAt)}
                                  </TableCell>

                                  <TableCell>
                                    {fileUrl ? (
                                      <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-700 transition hover:bg-sky-100"
                                      >
                                        View File
                                      </a>
                                    ) : (
                                      <span className="text-xs font-medium text-slate-400">
                                        No file
                                      </span>
                                    )}
                                  </TableCell>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                {selectedApplication.accreditationRemarks && (
                  <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                        <MessageIcon />
                      </div>
                      <div>
                        <h3 className="font-black">Previous Remarks</h3>

                        <p className="mt-2 text-sm leading-6">
                          {selectedApplication.accreditationRemarks}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {(isApproved || isRejected) && (
                  <section
                    className={`rounded-3xl border p-5 shadow-sm ${
                      isApproved
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-red-200 bg-red-50 text-red-900"
                    }`}
                  >
                    <h3 className="font-black">
                      {isApproved
                        ? "Application Approved"
                        : "Application Rejected"}
                    </h3>

                    <p className="mt-2 text-sm leading-6">
                      {isApproved
                        ? `Vendor Master ${
                            selectedApplication.vendorCode
                              ? `Code ${selectedApplication.vendorCode}`
                              : "record"
                          } has been created or updated.`
                        : "This vendor registration has been rejected."}
                    </p>
                  </section>
                )}

                <section className="sticky bottom-4 z-20 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-200/70 backdrop-blur">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                        Accreditation Decision
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Add evaluation remarks before approving, rejecting, or returning the application.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openActionModal("return")}
                        disabled={isApproved || submitting}
                        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Return for Correction
                      </button>

                      <button
                        type="button"
                        onClick={() => openActionModal("reject")}
                        disabled={isApproved || submitting}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => openActionModal("approve")}
                        disabled={isApproved || submitting}
                        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        Approve Accreditation
                      </button>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        </section>
      </main>

      {actionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div
              className={`p-5 text-white ${
                actionModal.action === "approve"
                  ? "bg-emerald-700"
                  : actionModal.action === "reject"
                  ? "bg-red-700"
                  : "bg-amber-600"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-white/80">
                    Accreditation Action
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    {actionModal.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeActionModal}
                  disabled={submitting}
                  className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold text-white hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Vendor
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {selectedVendorInfo.vendorName ||
                    selectedApplication?.vendorName ||
                    "-"}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Registration No.: {selectedApplication?.regNo || "-"}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Action by: {currentUser?.user_name || currentUser?.user_code || "User"}
                </p>
              </div>

              <label className="mt-5 block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Evaluation Remarks <span className="text-red-500">*</span>
                </span>

                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={6}
                  disabled={submitting}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#0f2f57] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="Enter evaluation remarks..."
                />
              </label>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeActionModal}
                  disabled={submitting}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmitAction}
                  disabled={submitting}
                  className="rounded-xl bg-[#0f2f57] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#143f72] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitting ? "Saving..." : "Submit Decision"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {submitting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#0f2f57]" />
            <h2 className="mt-4 text-base font-black text-slate-900">
              Submitting decision
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Saving the accreditation decision. Please wait.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function getFieldValue(primary = {}, secondary = {}, ...keys) {
  const nestedSources = [
    primary,
    primary.vendor_info,
    primary.vendorInfo,
    secondary,
    secondary.vendor_info,
    secondary.vendorInfo,
    secondary.vendor_master,
    secondary.vendorMaster,
  ].filter(Boolean);

  for (const source of nestedSources) {
    for (const key of keys) {
      const value = source[key];

      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
  }

  return "";
}

function getUploadedDocument(application, docCode) {
  if (!application || !docCode) return null;

  const normalizedCode = String(docCode).toUpperCase();

  const uploads =
    application.uploadedDocuments ||
    application.uploaded_documents ||
    application.uploads ||
    application.documents ||
    {};

  if (Array.isArray(uploads)) {
    return (
      uploads.find(
        (item) =>
          String(
            item.docCode || item.doc_code || item.code || item.DOC_CODE || ""
          ).toUpperCase() === normalizedCode
      ) || null
    );
  }

  return (
    uploads[docCode] ||
    uploads[normalizedCode] ||
    uploads[String(docCode).toLowerCase()] ||
    null
  );
}

function getDocumentUrl(upload) {
  if (!upload) return "";

  const rawUrl =
    upload.publicUrl ||
    upload.public_url ||
    upload.fileUrl ||
    upload.file_url ||
    upload.url ||
    upload.path ||
    upload.filePath ||
    "";

  if (!rawUrl) return "";

  if (
    rawUrl.startsWith("http://") ||
    rawUrl.startsWith("https://") ||
    rawUrl.startsWith("blob:")
  ) {
    return rawUrl;
  }

  if (rawUrl.startsWith("/")) {
    return `${API_BASE_URL}${rawUrl}`;
  }

  return `${API_BASE_URL}/${rawUrl}`;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
      <p className="text-[10px] font-black uppercase tracking-wider text-sky-100">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function SummaryCard({ label, value, helper, tone = "slate", active, onClick }) {
  const toneMap = {
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
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
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">{helper}</p>
        </div>

        <span className={`rounded-2xl border px-2.5 py-1 text-xs font-black ${toneMap[tone]}`}>
          View
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold text-slate-700">{value}</p>
    </button>
  );
}

function ReviewMetric({ label, value, danger }) {
  return (
    <div
      className={`rounded-2xl border p-3 text-center ${
        danger
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-75">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
          {title}
        </h3>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ListMeta({ label, value }) {
  return (
    <p className="truncate">
      <span className="font-semibold text-slate-500">{label}:</span> {value}
    </p>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <FolderIcon />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-600">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{message}</p>
    </div>
  );
}

function DetailBox({ label, value, wide }) {
  return (
    <div
      className={`min-w-0 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 ${
        wide ? "lg:col-span-2" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-700">
        {value || "-"}
      </p>
    </div>
  );
}

function TableHead({ children }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children, strong }) {
  return (
    <td
      className={`px-4 py-3 align-middle text-sm ${
        strong ? "font-semibold text-slate-700" : "text-slate-600"
      }`}
    >
      {children}
    </td>
  );
}

function StatusPill({ status, small = false }) {
  const normalized = String(status || "DRAFT").toUpperCase();
  const displayStatus =
    normalized === "FOR REVIEW"
      ? "For Review"
      : normalized === "PENDING APPROVAL"
      ? "Pending Approval"
      : normalized === "FOR ACCREDITATION"
      ? "Pending Approval"
      : normalized === "APPROVED"
      ? "Approved"
      : normalized === "RETURNED"
      ? "Returned"
      : normalized === "RETURNED FOR CORRECTION"
      ? "Returned"
      : normalized === "REJECTED"
      ? "Rejected"
      : normalized;

  const cls =
    normalized === "APPROVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "REJECTED"
      ? "border-red-200 bg-red-50 text-red-700"
      : normalized === "RETURNED" || normalized === "RETURNED FOR CORRECTION"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : normalized === "PENDING APPROVAL" || normalized === "FOR ACCREDITATION"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : normalized === "FOR REVIEW"
      ? "border-sky-200 bg-sky-50 text-sky-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={`inline-flex shrink-0 rounded-full border font-black tracking-wider ${cls} ${
        small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      }`}
    >
      {displayStatus}
    </span>
  );
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

function MessageIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m8-2a9 9 0 1 1-4.33-7.7L21 3v5h-5" />
    </svg>
  );
}

