import React from "react";

export default function VendorDashboard({
  vendor,
  onOpenCanvass,
  onOpenAwardedPo,
  onLogout,
}) {
  const vendorSources = getVendorSources(vendor);

  const vendorName =
    getVendorValue(vendorSources, "vendorName", "vendor_name", "VEND_NAME", "name") ||
    "Approved Vendor";

  const vendorCode =
    getVendorValue(
      vendorSources,
      "vendorCode",
      "vendor_code",
      "vendCode",
      "vend_code",
      "VEND_CODE"
    ) || "-";

  const vendorEmail =
    getVendorValue(
      vendorSources,
      "vendorEmail",
      "vendor_email",
      "email",
      "VEND_EMAIL"
    ) || "-";

  const contactPerson =
    getVendorValue(
      vendorSources,
      "contactPerson",
      "contact_person",
      "contactName",
      "contact_name",
      "contact",
      "VEND_CONTACT",
      "VEND_CONTACT_PERSON",
      "CONTACT_PERSON",
      "CONTACT_NAME"
    ) || "-";

  const contactNo =
    getVendorValue(
      vendorSources,
      "contactNo",
      "contact_no",
      "contactNumber",
      "contact_number",
      "phone",
      "phoneNo",
      "phone_no",
      "mobileNo",
      "mobile_no",
      "telNo",
      "tel_no",
      "VEND_MOBILENO",
      "VEND_TELNO",
      "VEND_PHONE",
      "CONTACT_NO",
      "CONTACT_NUMBER",
      "PHONE_NO",
      "MOBILE_NO",
      "TEL_NO"
    ) || "-";

  const address =
    getVendorValue(
      vendorSources,
      "address",
      "address1",
      "address_1",
      "addr1",
      "addr_1",
      "vendorAddress",
      "vendor_address",
      "vendorAddress1",
      "vendor_address1",
      "vendor_address_1",
      "VEND_ADDRESS",
      "VEND_ADDR",
      "VEND_ADDR1",
      "ADDRESS",
      "ADDRESS1",
      "ADDR1"
    ) || "-";

  const initials = getInitials(vendorName);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f2f57] text-sm font-black text-white shadow-sm">
              {initials}
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Vendor Dashboard
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Logged in as <span className="font-black text-slate-700">{vendorName}</span>
              </p>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              <LogoutIcon />
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] space-y-5 px-4 py-5 md:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-[#0f2f57] shadow-sm ring-1 ring-slate-200">
          <div className="relative p-5 text-white md:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(125,211,252,.30),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(59,130,246,.24),transparent_28%)]" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                {/* <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-sky-100">
                  Approved Vendor Access
                </div> */}

                <h2 className="break-words text-2xl font-black tracking-tight md:text-3xl">
                  Welcome, {vendorName}
                </h2>

                <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-sky-100">
                  Manage your quotations, canvass submissions, and awarded purchase orders from one workspace.
                </p>
              </div>

              {/* <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[430px]">
                <HeroMetric label="Vendor Code" value={vendorCode} />
                <HeroMetric label="Account Status" value="Approved" success />
              </div> */}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-sky-700">
                    Vendor Information
                  </p>
                  <h2 className="mt-1 break-words text-2xl font-black text-slate-900">
                    {vendorName}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Vendor Code: <span className="font-black text-slate-700">{vendorCode}</span>
                  </p>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Approved
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
              <InfoBox label="Email" value={vendorEmail} icon={<MailIcon />} />
              <InfoBox label="Contact Person" value={contactPerson} icon={<UserIcon />} />
              <InfoBox label="Contact No." value={contactNo} icon={<PhoneIcon />} />
              <InfoBox label="Address" value={address} icon={<MapIcon />} />
            </div>
          </div>

          <aside className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-blue-900 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <InfoIcon />
            </div>
            <h3 className="mt-4 text-base font-black">Vendor Portal Reminder</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-blue-800">
              Submit quotations before the requested deadline and review all item details carefully before sending your offer.
            </p>
          </aside>
        </section>

        <section>
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-700">
                Quick Actions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a workspace to continue.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DashboardTile
              title="Vendor Canvass Sheet"
              description="Create and submit quotation offers with item details, pricing, delivery dates, and remarks."
              actionLabel="Open Canvass Sheet"
              onClick={onOpenCanvass}
              icon={<DocumentIcon />}
              tone="blue"
            />

            <DashboardTile
              title="Awarded PO"
              description="View purchase orders awarded to your vendor account and monitor approved transactions."
              actionLabel="Open Awarded PO"
              onClick={onOpenAwardedPo}
              icon={<AwardIcon />}
              tone="emerald"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function getVendorSources(vendor = {}) {
  const directSources = [
    vendor,
    vendor?.vendorInfo,
    vendor?.vendor_info,
    vendor?.vendor,
    vendor?.vendorData,
    vendor?.vendor_data,
    vendor?.vendorMaster,
    vendor?.vendor_master,
    vendor?.supplier,
    vendor?.supplierInfo,
    vendor?.supplier_info,
    vendor?.data,
    vendor?.data?.vendor,
    vendor?.data?.vendorInfo,
    vendor?.data?.vendor_info,
    vendor?.data?.vendorData,
    vendor?.data?.vendor_data,
    vendor?.data?.vendorMaster,
    vendor?.data?.vendor_master,
    vendor?.data?.supplier,
    vendor?.data?.supplierInfo,
    vendor?.data?.supplier_info,
  ].filter(Boolean);

  return Array.from(new Set([...directSources, ...collectNestedObjects(vendor)]));
}

function getVendorValue(sources, ...keys) {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];

      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
  }

  return "";
}

function collectNestedObjects(value, depth = 0, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value) || depth > 2) {
    return [];
  }

  seen.add(value);

  return Object.values(value).reduce((objects, item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return objects;
    }

    return [...objects, item, ...collectNestedObjects(item, depth + 1, seen)];
  }, []);
}

function getInitials(name = "") {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "V";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function HeroMetric({ label, value, success }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <p className="text-[10px] font-black uppercase tracking-wider text-sky-100">
        {label}
      </p>
      <p className={`mt-2 break-words text-xl font-black ${success ? "text-emerald-200" : "text-white"}`}>
        {value || "-"}
      </p>
    </div>
  );
}

function InfoBox({ label, value, icon }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-sm">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}

function DashboardTile({ title, description, actionLabel, onClick, icon, tone = "blue" }) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200 group-hover:bg-emerald-100"
      : "bg-sky-50 text-sky-700 ring-sky-200 group-hover:bg-sky-100";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-200"
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 transition ${toneClass}`}>
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-lg font-black text-slate-900">{title}</p>
          <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
          Open Workspace
        </span>
        <span className="inline-flex items-center gap-2 rounded-xl bg-[#0f2f57] px-4 py-2 text-sm font-black text-white transition group-hover:bg-[#143f72]">
          {actionLabel}
          <ArrowIcon />
        </span>
      </div>
    </button>
  );
}

function MailIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4V6Zm0 0 8 7 8-7" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 17v-5m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}

function AwardIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 14-1 7 4-2 4 2-1-7" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
    </svg>
  );
}
