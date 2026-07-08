import React, { useMemo, useState } from "react";

const emptyVendorInfo = {
  vendorName: "",
  businessName: "",
  tinNo: "",
  taxType: "VAT",
  taxClass: "Corporation",
  address: "",
  zipCode: "",
  contactPerson: "",
  contactNo: "",
  email: "",
  paymentTerms: "",
};

export default function VendorRegistration({
  mode = "registration",
  currentUser,
  application,
  requiredDocuments = [],
  onCreateAccount,
  onBackToLogin,
  onSubmit,
  onLogout,
}) {
  if (mode === "accountSetup") {
    return (
      <VendorAccountSetup
        application={application}
        onCreateAccount={onCreateAccount}
        onBackToLogin={onBackToLogin}
      />
    );
  }

  return (
    <VendorRegistrationForm
      currentUser={currentUser}
      application={application}
      requiredDocuments={requiredDocuments}
      onSubmit={onSubmit}
      onLogout={onLogout}
    />
  );
}

function VendorAccountSetup({ application, onCreateAccount, onBackToLogin }) {
  const [form, setForm] = useState({
    accessKey: "",
    userId: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const passwordChecks = useMemo(() => {
    const password = form.password || "";

    return [
      {
        label: "At least 8 characters",
        passed: password.length >= 8,
      },
      {
        label: "Password confirmation matches",
        passed: Boolean(password) && password === form.confirmPassword,
      },
    ];
  }, [form.password, form.confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!application) {
      setError("Vendor registration record was not found.");
      return;
    }

    if (!form.accessKey.trim() || !form.userId.trim() || !form.password) {
      setError("Access Key, User ID, and Password are required.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    const result = await onCreateAccount?.({
      applicationId: application.id,
      regNo: application.regNo,
      accessKey: form.accessKey,
      userId: form.userId,
      password: form.password,
      confirmPassword: form.confirmPassword,
    });

    if (!result?.success) {
      setError(result?.message || "Unable to create vendor account.");
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden px-4 pb-20 pt-6 text-slate-900 sm:px-6 lg:px-8"
      style={{
        backgroundImage: "url('/NAYSABG.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-slate-950/45" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950/70 via-sky-950/35 to-blue-900/25" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(56,189,248,.30),transparent_28%),radial-gradient(circle_at_78%_30%,rgba(147,197,253,.18),transparent_26%),radial-gradient(circle_at_50%_90%,rgba(14,165,233,.16),transparent_32%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-8.5rem)] w-full max-w-7xl items-center justify-center">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-[1.02fr_.98fr]">
          <section className="hidden lg:block">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/15 px-6 py-2.5 text-xs font-extrabold uppercase tracking-[0.28em] text-white shadow-xl backdrop-blur-md">
              NAYSA-SOLUTIONS INCORPORATED
            </div>

            <h1 className="max-w-3xl text-4xl font-black uppercase leading-none tracking-[0.06em] text-white drop-shadow-[0_5px_18px_rgba(0,0,0,.45)] xl:text-5xl 2xl:text-6xl">
              Vendor Access Setup
            </h1>

            <p className="mt-5 max-w-2xl text-xl font-bold uppercase tracking-[0.18em] text-sky-100 drop-shadow-[0_3px_12px_rgba(0,0,0,.45)]">
              Create your temporary account securely
            </p>

            <div className="my-7 h-1 w-28 rounded-full bg-sky-400 shadow-[0_0_22px_rgba(56,189,248,.8)]" />

            <p className="max-w-2xl text-base font-medium leading-8 text-white/95 drop-shadow-[0_2px_10px_rgba(0,0,0,.55)]">
              Use the registration number and access key sent to your email to continue your vendor accreditation.
            </p>

            <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3">
              <GlassInfoCard label="Registration No." value={application?.regNo} />
              <GlassInfoCard label="Vendor Email" value={application?.vendorEmail} />
            </div>
          </section>

          <section className="flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <div className="mb-5 flex flex-col items-center text-center">
                <img
                  src="/naysa_logo.png"
                  alt="NAYSA Logo"
                  className="mb-1 w-36 drop-shadow-[0_6px_18px_rgba(0,0,0,.35)] md:w-40"
                />
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_15px_rgba(0,0,0,.5)] md:text-3xl">
                  Temporary Account Registration
                </h1>
                <p className="mt-2 text-sm font-medium text-white/85">
                  Verify your access and create your login credentials.
                </p>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] bg-white/95 p-6 shadow-2xl shadow-slate-950/35 ring-1 ring-white/70 backdrop-blur-xl md:p-7">
                <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-sky-500 via-blue-600 to-[#0f2f57]" />

                <div className="mb-5 grid grid-cols-2 gap-3 lg:hidden">
                  <InfoBox label="Registration No." value={application?.regNo} />
                  <InfoBox label="Vendor Email" value={application?.vendorEmail} />
                </div>

                <div className="mb-5 rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0f2f57] text-white shadow-sm">
                      <ShieldIcon />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        Secure Account Setup
                      </p>
                      <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                        Your access key is required before you can continue to the vendor registration form.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <Input
                    label="Access Key"
                    value={form.accessKey}
                    onChange={(v) => setForm((p) => ({ ...p, accessKey: v }))}
                    placeholder="Enter access key"
                    required
                  />

                  <Input
                    label="Temporary User ID"
                    value={form.userId}
                    onChange={(v) => setForm((p) => ({ ...p, userId: v }))}
                    placeholder="Create user ID"
                    required
                  />

                  <Input
                    label="Temporary Password"
                    type="password"
                    value={form.password}
                    onChange={(v) => setForm((p) => ({ ...p, password: v }))}
                    placeholder="Create password"
                    required
                  />

                  <Input
                    label="Confirm Password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(v) =>
                      setForm((p) => ({ ...p, confirmPassword: v }))
                    }
                    placeholder="Confirm password"
                    required
                  />

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
                      Password Check
                    </p>
                    <div className="space-y-2">
                      {passwordChecks.map((check) => (
                        <div
                          key={check.label}
                          className={`flex items-center gap-2 text-xs font-bold ${
                            check.passed ? "text-emerald-700" : "text-slate-400"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                              check.passed
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {check.passed ? <CheckIcon /> : null}
                          </span>
                          {check.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && <AlertBox tone="red" title="Unable to continue" message={error} />}

                  <button
                    type="submit"
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0369a1] to-[#1d4ed8] px-3 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    Register Account <span aria-hidden="true">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="w-full rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                  >
                    Back to Login
                  </button>
                </form>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-30 w-full">
        <div className="w-full border-t border-white/20 bg-slate-950/75 px-4 py-3 shadow-lg backdrop-blur-md">
          <p className="text-center text-xs font-semibold tracking-wide text-white sm:text-sm">
            © 2026 NAYSA-SOLUTIONS, INC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function VendorRegistrationForm({
  currentUser,
  application,
  requiredDocuments,
  onSubmit,
  onLogout,
}) {
  const [vendorInfo, setVendorInfo] = useState({
    ...emptyVendorInfo,
    ...(application?.vendorInfo || {}),
    businessName:
      application?.vendorInfo?.businessName ||
      application?.vendorInfo?.tradeName ||
      "",
    address:
      application?.vendorInfo?.address ||
      application?.vendorInfo?.address1 ||
      "",
  });

  const [uploads, setUploads] = useState(application?.uploads || {});
  const [submitting, setSubmitting] = useState(false);
  const [documentSearch, setDocumentSearch] = useState("");

  const normalizedStatus = String(application?.status || "").toUpperCase();

  const locked = [
    "FOR REVIEW",
    "PENDING APPROVAL",
    "FOR ACCREDITATION",
    "APPROVED",
    "REJECTED",
  ].includes(normalizedStatus);

  const returned =
    normalizedStatus === "RETURNED" ||
    normalizedStatus === "RETURNED FOR CORRECTION";

  const requiredFields = useMemo(
    () => [
      "vendorName",
      "businessName",
      "tinNo",
      "taxClass",
      "taxType",
      "address",
      "zipCode",
      "contactPerson",
      "contactNo",
      "email",
    ],
    []
  );

  const completedRequiredFields = useMemo(() => {
    return requiredFields.filter((field) => String(vendorInfo[field] || "").trim())
      .length;
  }, [requiredFields, vendorInfo]);

  const documentStats = useMemo(() => {
    const required = requiredDocuments.filter((doc) => doc.required);
    const uploadedRequired = required.filter((doc) => uploads[doc.code]).length;
    const uploadedAll = requiredDocuments.filter((doc) => uploads[doc.code]).length;

    return {
      total: requiredDocuments.length,
      required: required.length,
      uploadedRequired,
      uploadedAll,
    };
  }, [requiredDocuments, uploads]);

  const canSubmit = useMemo(() => {
    const infoComplete = requiredFields.every((field) =>
      String(vendorInfo[field] || "").trim()
    );

    const docsComplete = requiredDocuments
      .filter((doc) => doc.required)
      .every((doc) => uploads[doc.code]);

    return infoComplete && docsComplete;
  }, [vendorInfo, uploads, requiredDocuments, requiredFields]);

  const formProgress = useMemo(() => {
    const totalRequirements = requiredFields.length + documentStats.required;
    const completedRequirements = completedRequiredFields + documentStats.uploadedRequired;

    if (!totalRequirements) return 0;

    return Math.round((completedRequirements / totalRequirements) * 100);
  }, [completedRequiredFields, documentStats.required, documentStats.uploadedRequired, requiredFields.length]);

  const filteredDocuments = useMemo(() => {
    const search = documentSearch.trim().toLowerCase();

    if (!search) return requiredDocuments;

    return requiredDocuments.filter((doc) => {
      return [doc.name, doc.code, doc.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [documentSearch, requiredDocuments]);

  if (!application) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <WarningIcon />
          </div>
          <h1 className="text-lg font-black text-slate-900">
            Vendor application was not found.
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please open the registration link again or contact the company for assistance.
          </p>
        </div>
      </div>
    );
  }

  const updateVendorInfo = (field, value) => {
    setVendorInfo((prev) => ({ ...prev, [field]: value }));
  };

  const submitRegistration = async () => {
    if (!canSubmit) {
      alert("Please complete all required fields and upload all required documents.");
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit?.(application.id, vendorInfo, uploads);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#0f2f57]" />
            <h2 className="mt-4 text-base font-black text-slate-900">
              Submitting for accreditation
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Uploading your registration details and documents. Please wait.
            </p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0f2f57] text-white shadow-sm md:flex">
              <BuildingIcon />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  Vendor Registration
                </h1>
                <StatusPill status={application.status} />
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Logged in as {currentUser?.user_name || currentUser?.user_code || "Vendor"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600">
              Reg No: {application?.regNo || "-"}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1680px] space-y-5 px-4 py-5 md:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
          <div className="bg-gradient-to-r from-[#0f2f57] via-[#164979] to-sky-700 p-5 text-white md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-100">
                  Vendor Accreditation Form
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
                  {vendorInfo.vendorName || application.vendorName || "Complete your registration"}
                </h2>
                <p className="mt-2 max-w-4xl text-sm font-medium leading-6 text-sky-50/90">
                  Complete the required company information and upload the selected accreditation documents before submitting for review.
                </p>
              </div>

              {/* <div className="w-full rounded-2xl bg-white/12 p-4 ring-1 ring-white/20 backdrop-blur lg:max-w-xs">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-sky-100">
                  <span>Readiness</span>
                  <span>{formProgress}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${formProgress}%` }}
                  />
                </div>
                <p className="mt-3 text-xs font-medium leading-5 text-sky-50/90">
                  {canSubmit
                    ? "All required fields and documents are complete."
                    : "Some required fields or documents are still missing."}
                </p>
              </div> */}
            </div>
          </div>

          {/* <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
            <SummaryMetric
              label="Required Fields"
              value={`${completedRequiredFields}/${requiredFields.length}`}
              detail="Company and contact details"
            />
            <SummaryMetric
              label="Required Docs"
              value={`${documentStats.uploadedRequired}/${documentStats.required}`}
              detail="Uploaded requirements"
            />
            <SummaryMetric
              label="All Uploads"
              value={`${documentStats.uploadedAll}/${documentStats.total}`}
              detail="Required and optional docs"
            />
            <SummaryMetric
              label="Application Status"
              value={application.status || "PRE-REGISTERED"}
              detail={application.reviewedAt ? `Reviewed: ${application.reviewedAt}` : "Awaiting completion"}
            />
          </div> */}
        </section>

        <RegistrationTracker application={application} />

        {application.accreditationRemarks && returned && (
          <AlertBox
            tone="amber"
            title="Returned for Correction"
            message={application.accreditationRemarks}
          />
        )}

        {locked && (
          <AlertBox
            tone={normalizedStatus === "REJECTED" ? "red" : normalizedStatus === "APPROVED" ? "green" : "blue"}
            title={`Registration Status: ${application.status}`}
            message={
              ["FOR REVIEW", "PENDING APPROVAL", "FOR ACCREDITATION"].includes(
                normalizedStatus
              )
                ? "Your registration has been submitted and is now waiting for company accreditation review."
                : normalizedStatus === "APPROVED"
                ? `Your accreditation was approved. Vendor Master Code: ${application.vendorCode || "-"}.`
                : "Your registration was rejected. Please contact the company for assistance."
            }
          />
        )}

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,.65fr)]">
          <SectionCard
            eyebrow="Step 1"
            title="Company Information"
            description="Enter the vendor's official business and tax information."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Vendor Name"
                value={vendorInfo.vendorName}
                onChange={(v) => updateVendorInfo("vendorName", v)}
                placeholder="Registered vendor name"
                required
                disabled={locked}
              />

              <Input
                label="Business Name"
                value={vendorInfo.businessName}
                onChange={(v) => updateVendorInfo("businessName", v)}
                placeholder="Trade or business name"
                required
                disabled={locked}
              />

              <Input
                label="Tax Identification No."
                value={vendorInfo.tinNo}
                onChange={(v) => updateVendorInfo("tinNo", v)}
                placeholder="TIN"
                required
                disabled={locked}
              />

              <Select
                label="Tax Class"
                value={vendorInfo.taxClass}
                onChange={(v) => updateVendorInfo("taxClass", v)}
                options={["Individual", "Corporation"]}
                required
                disabled={locked}
              />

              <Select
                label="Tax Type"
                value={vendorInfo.taxType}
                onChange={(v) => updateVendorInfo("taxType", v)}
                options={["VATABLE", "NON-VAT", "VAT-EXEMPT"]}
                required
                disabled={locked}
              />

              <Input
                label="Zip Code"
                value={vendorInfo.zipCode}
                onChange={(v) => updateVendorInfo("zipCode", v)}
                placeholder="Zip code"
                required
                disabled={locked}
              />

              <Input
                label="Address"
                value={vendorInfo.address}
                onChange={(v) => updateVendorInfo("address", v)}
                placeholder="Complete business address"
                required
                disabled={locked}
                wide
              />

              <Input
                label="Payment Terms"
                value={vendorInfo.paymentTerms}
                onChange={(v) => updateVendorInfo("paymentTerms", v)}
                placeholder="Example: 30D"
                disabled={locked}
              />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Step 2"
            title="Contact Details"
            description="Provide the contact person who will receive accreditation updates."
          >
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Contact Person"
                value={vendorInfo.contactPerson}
                onChange={(v) => updateVendorInfo("contactPerson", v)}
                placeholder="Contact person"
                required
                disabled={locked}
              />

              <Input
                label="Contact No."
                value={vendorInfo.contactNo}
                onChange={(v) => updateVendorInfo("contactNo", v)}
                placeholder="Contact number"
                required
                disabled={locked}
              />

              <Input
                label="Email Address"
                type="email"
                value={vendorInfo.email}
                onChange={(v) => updateVendorInfo("email", v)}
                placeholder="Email address"
                required
                disabled={locked}
              />
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-amber-600">
                  <WarningIcon />
                </span>
                <p>
                  Vendor cannot participate in sourcing or procurement activities until accreditation is approved by the company.
                </p>
              </div>
            </div>
          </SectionCard>
        </section>

        <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 bg-slate-50/80 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Step 3
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-900">
                  Required Accreditation Documents
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Upload all required documents before submitting the application.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:min-w-[420px]">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <SearchIcon />
                  </span>
                  <input
                    value={documentSearch}
                    onChange={(e) => setDocumentSearch(e.target.value)}
                    placeholder="Search document..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#0f2f57] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <span className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-xs font-black uppercase tracking-wider text-slate-600">
                  {documentStats.uploadedRequired}/{documentStats.required} Required
                </span>
              </div>
            </div>
          </div>

          <div className="p-5">
            {requiredDocuments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
                  <FileIcon />
                </div>
                <p className="text-sm font-black text-slate-700">
                  No required documents configured.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  You may continue once all required company information is complete.
                </p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
                No documents matched your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredDocuments.map((doc) => {
                  const upload = uploads[doc.code];
                  const uploaded = Boolean(upload);

                  return (
                    <div
                      key={doc.code}
                      className={`group rounded-3xl border p-4 transition ${
                        uploaded
                          ? "border-emerald-200 bg-emerald-50/70 shadow-sm"
                          : doc.required
                          ? "border-red-100 bg-white hover:border-red-200 hover:bg-red-50/30"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                              uploaded
                                ? "bg-emerald-600 text-white"
                                : doc.required
                                ? "bg-red-50 text-red-600 ring-1 ring-red-100"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {uploaded ? <CheckIcon /> : <FileIcon />}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-800">
                              {doc.name}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              {doc.code}
                            </p>
                          </div>
                        </div>

                        <DocumentPill uploaded={uploaded} required={doc.required} />
                      </div>

                      {doc.description && (
                        <p className="mb-4 line-clamp-2 text-xs leading-5 text-slate-500">
                          {doc.description}
                        </p>
                      )}

                      <label
                        className={`flex cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 py-3 text-center text-sm font-black transition ${
                          locked
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                            : uploaded
                            ? "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
                            : "border-slate-300 bg-slate-50 text-[#0f2f57] hover:border-[#0f2f57] hover:bg-sky-50"
                        }`}
                      >
                        {uploaded ? "Replace File" : "Choose File"}
                        <input
                          type="file"
                          disabled={locked}
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setUploads((prev) => ({
                              ...prev,
                              [doc.code]: {
                                file,
                                fileName: file.name,
                                docCode: doc.code,
                                docName: doc.name,
                              },
                            }));
                          }}
                        />
                      </label>

                      {upload && (
                        <div className="mt-3 rounded-2xl bg-white px-3 py-2 ring-1 ring-emerald-100">
                          <p className="truncate text-xs font-bold text-slate-600">
                            File: {upload?.fileName || upload?.originalFileName || "-"}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="sticky bottom-4 z-20 rounded-[1.75rem] border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-200/70 backdrop-blur-xl md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  canSubmit
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                }`}
              >
                {canSubmit ? <CheckIcon /> : <WarningIcon />}
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">
                  Registration readiness
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {canSubmit
                    ? "Complete and ready for accreditation."
                    : "Incomplete required fields or missing required documents."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={submitRegistration}
              disabled={!canSubmit || locked || submitting}
              className="rounded-xl bg-[#0f2f57] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#143f72] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:translate-y-0 md:min-w-[230px]"
            >
              {submitting ? "Submitting..." : "Submit for Accreditation"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function SectionCard({ eyebrow, title, description, children }) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#0f2f57] ring-1 ring-sky-100">
          <ClipboardIcon />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  disabled,
  wide,
  placeholder,
}) {
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>

      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f2f57] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  required,
  disabled,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>

      <select
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#0f2f57] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-black text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}

function GlassInfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/12 p-4 text-white shadow-xl backdrop-blur">
      <p className="text-xs font-black uppercase tracking-wider text-sky-100">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-black text-white">
        {value || "-"}
      </p>
    </div>
  );
}

function SummaryMetric({ label, value, detail }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 truncate text-xl font-black text-slate-900">{value}</p>
      <p className="mt-1 truncate text-xs font-medium text-slate-500">{detail}</p>
    </div>
  );
}

function StatusPill({ status }) {
  const normalized = String(status || "PRE-REGISTERED").toUpperCase();

  const cls =
    normalized === "APPROVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "REJECTED"
      ? "border-red-200 bg-red-50 text-red-700"
      : normalized === "RETURNED" || normalized === "RETURNED FOR CORRECTION"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : normalized === "FOR ACCREDITATION" || normalized === "FOR REVIEW" || normalized === "PENDING APPROVAL"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-sky-200 bg-sky-50 text-sky-700";

  return (
    <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${cls}`}>
      {normalized}
    </span>
  );
}

function DocumentPill({ uploaded, required }) {
  const label = uploaded ? "Uploaded" : required ? "Required" : "Optional";

  const cls = uploaded
    ? "bg-emerald-100 text-emerald-700"
    : required
    ? "bg-red-100 text-red-700"
    : "bg-slate-200 text-slate-600";

  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${cls}`}>
      {label}
    </span>
  );
}

function AlertBox({ tone = "blue", title, message }) {
  const styles = {
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    red: "border-red-200 bg-red-50 text-red-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  };

  return (
    <div className={`rounded-[1.75rem] border p-5 shadow-sm ${styles[tone] || styles.blue}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {tone === "green" ? <CheckIcon /> : <WarningIcon />}
        </div>
        <div>
          <h3 className="font-black">{title}</h3>
          <p className="mt-2 text-sm leading-6">{message}</p>
        </div>
      </div>
    </div>
  );
}

function RegistrationTracker({ application }) {
  const normalized = String(application?.status || "PRE-REGISTERED").toUpperCase();

  const displayStatus =
    normalized === "FOR ACCREDITATION" ||
    normalized === "FOR REVIEW" ||
    normalized === "PENDING APPROVAL"
      ? "On Review"
      : normalized === "APPROVED"
      ? "Approved"
      : normalized === "RETURNED" || normalized === "RETURNED FOR CORRECTION"
      ? "Returned"
      : normalized === "REJECTED"
      ? "Rejected"
      : "Pre-registered";

  const currentIndex =
    normalized === "APPROVED"
      ? 3
      : normalized === "REJECTED" ||
        normalized === "RETURNED" ||
        normalized === "RETURNED FOR CORRECTION"
      ? 3
      : normalized === "SUBMITTED"
      ? 1
      : normalized === "FOR ACCREDITATION" ||
        normalized === "FOR REVIEW" ||
        normalized === "PENDING APPROVAL"
      ? 2
      : 0;

  const steps = [
    {
      label: "Pre-registered",
      detail: "Access created",
    },
    {
      label: "Submitted",
      detail: "Registration sent",
    },
    {
      label: "Under Review",
      detail: "Accreditation review",
    },
    {
      label: "Final Decision",
      detail: `Registration No.: ${application?.regNo || "-"}`,
    },
  ];

  const message =
    normalized === "APPROVED"
      ? "Your accreditation has been approved."
      : normalized === "REJECTED"
      ? "Your registration was rejected. Please contact the company for assistance."
      : normalized === "RETURNED" || normalized === "RETURNED FOR CORRECTION"
      ? "Your registration was returned. Review the remarks, update your details, and submit again."
      : normalized === "FOR ACCREDITATION" ||
        normalized === "FOR REVIEW" ||
        normalized === "PENDING APPROVAL"
      ? "Your registration has been submitted and is now being reviewed."
      : "Complete your registration details and submit for accreditation.";

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-black text-slate-800">
            Registration Tracker
          </h2>
          <p className="mt-1 text-sm text-slate-500">{message}</p>
        </div>

        <span className="inline-flex w-fit rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-sky-700">
          {displayStatus}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {steps.map((step, index) => {
          const active = index === currentIndex;
          const complete = index < currentIndex;
          const finalState = currentIndex === 3 && index === 3;
          return (
            <div
              key={step.label}
              className={`relative flex flex-col items-center text-center ${
                active || finalState
                  ? "text-sky-800"
                  : complete
                  ? "text-emerald-700"
                  : "text-slate-400"
              } ${
                index < steps.length - 1
                  ? `md:after:absolute md:after:left-[calc(50%+1.75rem)] md:after:top-4 md:after:h-0.5 md:after:w-[calc(100%-3.5rem)] md:after:rounded-full ${
                      index < currentIndex
                        ? "md:after:bg-emerald-500"
                        : "md:after:bg-slate-200"
                    }`
                  : ""
              }`}
            >
              <div
                className={`relative z-10 mb-2 flex h-9 w-9 items-center justify-center rounded-full border text-sm font-black ${
                  active || finalState
                    ? "border-sky-700 bg-sky-700 text-white"
                  : complete
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-300 text-slate-400"
                }`}
              >
                {complete ? (
                  <CheckIcon />
  ) : active ? (
    <span aria-hidden="true">{index + 1}</span>
  ) : (
    <span aria-hidden="true">{index + 1}</span>
  )}
              </div>

              <p className="text-sm font-black text-slate-800">{step.label}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {step.detail}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-label="Completed"
      className="h-4 w-4"
      fill="none"
      role="img"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="3"
      viewBox="0 0 24 24"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-4" />
      <path d="M9 9v.01" />
      <path d="M9 12v.01" />
      <path d="M9 15v.01" />
      <path d="M9 18v.01" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 14h6" />
      <path d="M9 18h6" />
      <path d="M9 10h6" />
    </svg>
  );
}
