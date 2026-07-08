import React, { useEffect, useMemo, useState } from "react";
import toast, { Toaster as HotToastToaster } from "react-hot-toast";

const initialPreReg = {
  vendorName: "",
  vendorEmail: "",
  contactPerson: "",
  contactNo: "",
  supplierType: "Local Supplier",
  remarks: "",
};

const supplierTypes = [
  "Local Supplier",
  "Foreign Supplier"
];

const getDocumentCode = (doc) =>
  String(doc?.code ?? doc?.docCode ?? doc?.DOC_CODE ?? doc?.id ?? "");

const getDocumentName = (doc) =>
  String(doc?.name ?? doc?.docName ?? doc?.DOC_NAME ?? "Untitled Document");

const isDefaultRequired = (doc) => {
  const value = doc?.required ?? doc?.isRequired ?? doc?.REQUIRED;
  return value === true || value === 1 || ["Y", "YES", "TRUE", "1"].includes(String(value).toUpperCase());
};

const getDisplayUser = (currentUser) =>
  currentUser?.userName ||
  currentUser?.USER_NAME ||
  currentUser?.name ||
  currentUser?.USERID ||
  currentUser?.userId ||
  "";

export default function VendorPreRegistration({
  currentUser,
  applications = [],
  requiredDocuments = [],
  documentsLoading = false,
  onRefreshDocuments,
  onCreate,
  onOpenRegistrationLink,
}) {
  const [preReg, setPreReg] = useState(initialPreReg);
  const [createdApplication, setCreatedApplication] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDocCodes, setSelectedDocCodes] = useState([]);
  const [documentSearch, setDocumentSearch] = useState("");

  const availableDocuments = useMemo(() => {
    return requiredDocuments;
  }, [requiredDocuments]);

  useEffect(() => {
    setSelectedDocCodes((prev) => {
      if (prev.length > 0) return prev;

      return availableDocuments
        .filter((doc) => isDefaultRequired(doc))
        .map((doc) => getDocumentCode(doc))
        .filter(Boolean);
    });
  }, [availableDocuments]);

  const selectedDocuments = useMemo(() => {
    return availableDocuments
      .filter((doc) => selectedDocCodes.includes(getDocumentCode(doc)))
      .map((doc) => ({
        ...doc,
        required: true,
      }));
  }, [availableDocuments, selectedDocCodes]);

  const filteredDocuments = useMemo(() => {
    const keyword = documentSearch.trim().toLowerCase();

    if (!keyword) return availableDocuments;

    return availableDocuments.filter((doc) => {
      const code = getDocumentCode(doc).toLowerCase();
      const name = getDocumentName(doc).toLowerCase();

      return code.includes(keyword) || name.includes(keyword);
    });
  }, [availableDocuments, documentSearch]);

  const statusSummary = useMemo(() => {
    return applications.reduce(
      (acc, app) => {
        const status = String(app.status || "DRAFT").toUpperCase();

        if (status === "PRE-REGISTERED") acc.preRegistered += 1;
        if (status === "APPROVED") acc.approved += 1;
        if (status === "FOR ACCREDITATION") acc.forAccreditation += 1;

        return acc;
      },
      {
        preRegistered: 0,
        approved: 0,
        forAccreditation: 0,
      }
    );
  }, [applications]);

  const selectedCount = selectedDocuments.length;
  const totalDocuments = availableDocuments.length;
  const selectionPercent = totalDocuments
    ? Math.round((selectedCount / totalDocuments) * 100)
    : 0;

  const currentUserName = getDisplayUser(currentUser);
  const latestApplication = createdApplication;

  const handleChange = (field, value) => {
    setCreatedApplication(null);
    setPreReg((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleDocument = (docCode) => {
    setCreatedApplication(null);

    setSelectedDocCodes((prev) => {
      if (prev.includes(docCode)) {
        return prev.filter((code) => code !== docCode);
      }

      return [...prev, docCode];
    });
  };

  const handleSelectAllDocuments = () => {
    setCreatedApplication(null);
    setSelectedDocCodes(availableDocuments.map((doc) => getDocumentCode(doc)).filter(Boolean));
  };

  const handleDefaultDocuments = () => {
    setCreatedApplication(null);

    setSelectedDocCodes(
      availableDocuments
        .filter((doc) => isDefaultRequired(doc))
        .map((doc) => getDocumentCode(doc))
        .filter(Boolean)
    );
  };

  const handleClearDocuments = () => {
    setCreatedApplication(null);
    setSelectedDocCodes([]);
  };

  const handleResetForm = () => {
    setCreatedApplication(null);
    setPreReg(initialPreReg);
    setDocumentSearch("");
    handleDefaultDocuments();
  };

  const handleCopyLink = async (link) => {
    if (!link) {
      toast.error("No registration link available.");
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      toast.success("Registration link copied.");
    } catch {
      toast.error("Unable to copy the link. Please open it and copy manually.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!preReg.vendorName.trim() || !preReg.vendorEmail.trim()) {
      toast.error("Vendor Name and Vendor Email are required.");
      return;
    }

    if (selectedDocuments.length === 0) {
      toast.error("Please select at least one accreditation document.");
      return;
    }

    setSubmitting(true);
    let saveSucceeded = false;

    try {
      const newApplication = await onCreate({
        ...preReg,
        requiredDocuments: selectedDocuments,
      });

      if (!newApplication) return;

      setCreatedApplication(newApplication);
      setPreReg(initialPreReg);
      setSelectedDocCodes(
        availableDocuments
          .filter((doc) => isDefaultRequired(doc))
          .map((doc) => getDocumentCode(doc))
          .filter(Boolean)
      );

      saveSucceeded = true;
    } finally {
      setSubmitting(false);

      if (saveSucceeded) {
        toast.success("Save successful. Pre-registration record was created.");
      }
    }
  };

  return (
    <div className="min-h-screen overflow-hidden text-slate-900">
      <HotToastToaster
        position="top-right"
        toastOptions={{
          className: "text-sm font-semibold",
          success: { duration: 2600 },
          error: { duration: 3500 },
        }}
      />

      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 px-4">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-2xl ring-1 ring-white/50">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-[#0f2f57]" />
            </div>
            <h2 className="mt-5 text-lg font-black text-slate-900">
              Saving pre-registration record...
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Please wait while the pre-registration record is being saved.
            </p>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1680px] space-y-5 px-4 py-5 md:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#0f2f57] p-6 text-white shadow-xl shadow-blue-950/10">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-16 h-32 w-32 rounded-full bg-sky-300/20 blur-2xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              {/* <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-blue-100 ring-1 ring-white/15">
                Vendor Accreditation
              </div> */}
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                Vendor Pre-registration
              </h1>
              <p className="mt-2 max-w-4xl text-sm font-medium leading-6 text-blue-100">
                Create pre-registration records, choose accreditation requirements, and track registration progress in one workspace.
              </p>
            </div>

            {/* <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[560px]">
              <HeroMetric label="Vendors" value={applications.length} />
              <HeroMetric label="Pre-reg" value={statusSummary.preRegistered} />
              <HeroMetric label="For Accred." value={statusSummary.forAccreditation} />
              <HeroMetric label="Approved" value={statusSummary.approved} />
            </div> */}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_520px] xl:items-stretch">
          <form onSubmit={handleSubmit} className="h-full">
            <div className="flex h-full flex-col overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
              <div className="border-b border-slate-100 bg-white px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <SectionTitle
                    eyebrow="Step 1"
                    title="Pre-registration Information"
                    description="Fill in the vendor details that will be used for the registration email."
                  />

                  {currentUserName && (
                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600 md:self-auto">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {currentUserName}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label="Supplier Name"
                    value={preReg.vendorName}
                    onChange={(value) => handleChange("vendorName", value)}
                    placeholder="Enter registered supplier name"
                    required
                  />

                  <Input
                    label="Supplier Email"
                    type="email"
                    value={preReg.vendorEmail}
                    onChange={(value) => handleChange("vendorEmail", value)}
                    placeholder="example@company.com"
                    required
                  />

                  <Input
                    label="Contact Person"
                    value={preReg.contactPerson}
                    onChange={(value) => handleChange("contactPerson", value)}
                    placeholder="Contact person"
                  />

                  <Input
                    label="Contact No."
                    value={preReg.contactNo}
                    onChange={(value) => handleChange("contactNo", value)}
                    placeholder="Mobile or telephone no."
                  />

                  <SelectInput
                    label="Supplier Type"
                    value={preReg.supplierType}
                    onChange={(value) => handleChange("supplierType", value)}
                    options={supplierTypes}
                  />

                  <TextArea
                    label="Remarks"
                    value={preReg.remarks}
                    onChange={(value) => handleChange("remarks", value)}
                    placeholder="Optional remarks"
                  />
                </div>

                <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    disabled={submitting}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reset
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || documentsLoading}
                    className="rounded-xl bg-[#0f2f57] px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-950/10 transition hover:-translate-y-0.5 hover:bg-[#143f72] disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {submitting ? "Saving..." : "Submit Pre-Registration"}
                  </button>
                </div>
              </div>
            </div>
          </form>

          <aside className="h-full">
            <div className="flex h-full flex-col overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
              <div className="border-b border-slate-100 bg-white px-5 pb-2 pt-4">
                <div className="flex flex-col">
                  <SectionTitle
                    eyebrow="Step 2"
                    title="Accreditation Documents"
                    description="Only selected documents will be required from this vendor."
                  />

                  {/* <div className="relative">
                    <input
                      type="text"
                      value={documentSearch}
                      onChange={(e) => setDocumentSearch(e.target.value)}
                      placeholder="Search document..."
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 pr-10 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0f2f57] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      ⌕
                    </span>
                  </div> */}

                  {/* <div className="flex flex-wrap gap-2">
                    <ActionButton onClick={onRefreshDocuments} disabled={!onRefreshDocuments || documentsLoading}>
                      Refresh
                    </ActionButton>
                    <ActionButton onClick={handleDefaultDocuments} disabled={documentsLoading}>
                      Default
                    </ActionButton>
                    <ActionButton onClick={handleSelectAllDocuments} disabled={documentsLoading || totalDocuments === 0}>
                      Select All
                    </ActionButton>
                    <ActionButton onClick={handleClearDocuments} disabled={documentsLoading || selectedCount === 0}>
                      Clear
                    </ActionButton>
                  </div> */}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto px-3 pb-3 pt-2">
                {documentsLoading ? (
                  <div className="space-y-3">
                    <DocumentSkeleton />
                    <DocumentSkeleton />
                    <DocumentSkeleton />
                  </div>
                ) : requiredDocuments.length === 0 ? (
                  <EmptyState
                    title="No document requirements found"
                    description="Please refresh or check the accreditation document setup."
                  />
                ) : filteredDocuments.length === 0 ? (
                  <EmptyState
                    title="No matching document"
                    description="Try another document code or name."
                  />
                ) : (
                  <div className="space-y-2">
                    {filteredDocuments.map((doc) => {
                      const docCode = getDocumentCode(doc);
                      const docName = getDocumentName(doc);
                      const selected = selectedDocCodes.includes(docCode);

                      return (
                        <button
                          key={doc.id || docCode}
                          type="button"
                          onClick={() => handleToggleDocument(docCode)}
                          className={`group w-full rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-sky-300 bg-sky-50 shadow-sm shadow-sky-100"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-black transition ${
                                selected
                                  ? "border-[#0f2f57] bg-[#0f2f57] text-white"
                                  : "border-slate-300 bg-white text-transparent group-hover:border-slate-400"
                              }`}
                            >
                              ✓
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-black text-slate-800">
                                {docName}
                              </span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </section>

        {latestApplication && (
          <section className="overflow-hidden rounded-[2rem] border border-blue-200 bg-blue-50 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-blue-100 bg-white/60 px-5 py-4 md:flex-row md:items-start md:justify-between">
              <SectionTitle
                eyebrow="Generated Access"
                title="Vendor registration link is ready"
                description="Registration access was saved successfully. You may open or copy the registration link."
                tone="blue"
              />

              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink(latestApplication.registrationLink)}
                  className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  Copy Link
                </button>
                <button
                  type="button"
                  onClick={() => onOpenRegistrationLink?.(latestApplication.id)}
                  className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-blue-800"
                >
                  Open Registration Link
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <InfoBox label="Registration No." value={latestApplication.regNo} />
              <InfoBox label="Vendor Email" value={latestApplication.vendorEmail} />
              <InfoBox label="Registration Link" value={latestApplication.registrationLink} wide />
              <InfoBox label="Status" value={latestApplication.status} />
              <InfoBox
                label="Required Documents"
                value={`${latestApplication.requiredDocuments?.length || 0} document(s) selected`}
              />
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <SectionTitle
              eyebrow="Records"
              title="Pre-registered Vendors"
              description="List of generated vendor registration access records."
            />

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600">
              Total: {applications.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="max-h-[420px] min-w-[1200px] overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr>
                    <TableHead>Registration No.</TableHead>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead align="center">Documents</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead align="right">Action</TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12">
                        <EmptyState
                          title="No pre-registered vendors yet"
                          description="Submitted vendor pre-registration records will appear here."
                        />
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => {
                      const canOpenLink =
                        String(app.status || "").toUpperCase() === "PRE-REGISTERED";

                      return (
                        <tr key={app.id} className="transition hover:bg-slate-50">
                          <TableCell strong>{app.regNo}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-black text-slate-800">
                                {app.vendorName || "-"}
                              </p>
                              {app.contactPerson && (
                                <p className="mt-0.5 text-xs font-semibold text-slate-400">
                                  Contact: {app.contactPerson}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{app.vendorEmail}</TableCell>
                          <TableCell align="center">
                            <span className="inline-flex min-w-10 justify-center rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                              {app.requiredDocuments?.length || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusPill status={app.status} />
                          </TableCell>
                          <TableCell>{app.createdAt || "-"}</TableCell>
                          <TableCell align="right">
                            <button
                              type="button"
                              onClick={() => {
                                if (!canOpenLink) return;
                                onOpenRegistrationLink?.(app.id);
                              }}
                              disabled={!canOpenLink}
                              className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-black text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              Open Link
                            </button>
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
      </main>
    </div>
  );
}

function HeroMetric({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
      <p className="text-[10px] font-black uppercase tracking-wider text-blue-100">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function SectionTitle({ eyebrow, title, description, tone = "slate" }) {
  const eyebrowClass = tone === "blue" ? "text-blue-600" : "text-slate-500";
  const titleClass = tone === "blue" ? "text-blue-950" : "text-slate-800";
  const descriptionClass = tone === "blue" ? "text-blue-700" : "text-slate-500";

  return (
    <div>
      <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${eyebrowClass}`}>
        {eyebrow}
      </p>
      <h2 className={`mt-1 text-base font-black ${titleClass}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-1 text-sm leading-5 ${descriptionClass}`}>
          {description}
        </p>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-black text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0f2f57] focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, options = [] }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-black text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0f2f57] focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <label className="block md:col-span-2">
      <span className="mb-1.5 block text-sm font-black text-slate-700">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0f2f57] focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function ActionButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function InfoBox({ label, value, wide }) {
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-blue-200 ${wide ? "md:col-span-2" : ""}`}>
      <p className="text-xs font-black uppercase tracking-wider text-blue-500">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-black text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm ring-1 ring-slate-200">
        —
      </div>
      <p className="mt-3 text-sm font-black text-slate-700">
        {title}
      </p>
      {description && (
        <p className="mt-1 text-sm font-medium text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

function DocumentSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 animate-pulse rounded-lg bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function TableHead({ children, align = "left" }) {
  const alignment = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <th className={`h-12 whitespace-nowrap px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500 ${alignment}`}>
      {children}
    </th>
  );
}

function TableCell({ children, strong, align = "left" }) {
  const alignment = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <td className={`h-16 whitespace-nowrap px-4 py-3 text-sm ${alignment} ${strong ? "font-black text-slate-800" : "font-semibold text-slate-600"}`}>
      {children || "-"}
    </td>
  );
}

function StatusPill({ status }) {
  const normalized = String(status || "DRAFT").toUpperCase();

  const cls =
    normalized === "APPROVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "REJECTED"
      ? "border-red-200 bg-red-50 text-red-700"
      : normalized === "RETURNED FOR CORRECTION"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : normalized === "FOR ACCREDITATION"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : normalized === "ACCOUNT REGISTERED"
      ? "border-violet-200 bg-violet-50 text-violet-700"
      : normalized === "PRE-REGISTERED"
      ? "border-sky-200 bg-sky-50 text-sky-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${cls}`}>
      {normalized}
    </span>
  );
}
