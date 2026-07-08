import React, { useEffect, useMemo, useState } from "react";
import toast, { Toaster as HotToastToaster } from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const DEC_AMT = 2;

const initialOffer = {
  canSupplierId: "",
  canId: "",
  supplierCode: "",
  supplierName: "",
  quoteNo: "",
  quoteDate: "",
  offerDate: "",
  deliveryDate: "",
  paymentTerms: "",
  deliveryTerms: "",
  remarks: "",
};

const createItem = (lineNo = 1) => ({
  id: `${Date.now()}-${lineNo}-${Math.random()}`,
  canSupplierDt1Id: "",
  canSupplierId: "",
  canId: "",
  canDt1Id: "",
  ln: lineNo,
  type: "",
  itemCode: "",
  itemName: "",
  specs: "",
  uom: "",
  quantity: "",
  unitPrice: "",
  grossAmount: "0.00",
  discountAmount: "0.00",
  netAmount: "0.00",
  remarks: "",
  isAwardedLine: false,
});

export default function VendorCanvass({
  vendor,
  selectedCanvass = null,
  onSubmit,
  onBackToDashboard,
  onLogout,
  loading = false,
}) {
  const [activeTab, setActiveTab] = useState("offer");
  const [offer, setOffer] = useState(initialOffer);
  const [items, setItems] = useState([createItem(1)]);
  const [attachments, setAttachments] = useState([]);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [offerSubmitted, setOfferSubmitted] = useState(false);

  const decQty =
    Number(
      vendor?.companyInfo?.itemDecqtyPur ??
        vendor?.itemDecqtyPur ??
        vendor?.item_decqty_pur ??
        vendor?.ITEM_DECQTY_PUR ??
        2
    ) || 2;

  const decUPrice =
    Number(
      vendor?.companyInfo?.pur_decuprice ??
        vendor?.companyInfo?.purDecuprice ??
        vendor?.pur_decuprice ??
        vendor?.purDecuprice ??
        vendor?.PUR_DECU_PRICE ??
        2
    ) || 2;

  const loggedVendorCode =
    vendor?.vendCode ||
    vendor?.vend_code ||
    vendor?.vendorCode ||
    vendor?.vendor_code ||
    vendor?.supplierCode ||
    vendor?.supplier_code ||
    vendor?.VEND_CODE ||
    "";

  const vendorName =
    vendor?.vendorName ||
    vendor?.vendor_name ||
    offer.supplierName ||
    vendor?.name ||
    loggedVendorCode ||
    "Approved Vendor";

  const totals = useMemo(() => {
    return items.reduce(
      (sum, item) => {
        const amounts = getItemAmounts(item);

        return {
          grossAmount: sum.grossAmount + amounts.grossAmount,
          discountAmount: sum.discountAmount + amounts.discountAmount,
          netAmount: sum.netAmount + amounts.netAmount,
        };
      },
      {
        grossAmount: 0,
        discountAmount: 0,
        netAmount: 0,
      }
    );
  }, [items]);

  const updateOffer = (field, value) => {
    if (offerSubmitted) return;

    setOffer((prev) => ({
      ...prev,
      [field]: value,
    }));

    setSubmitMessage("");
    setFetchError("");
  };

  const calculateItem = (item, changedField = "") => {
    const grossAmount = parseNumber(item.quantity) * parseNumber(item.unitPrice);
    const discountAmount = Math.min(
      parseNumber(item.discountAmount),
      grossAmount
    );
    const netAmount = grossAmount - discountAmount;

    return {
      ...item,
      grossAmount: formatNumberValue(grossAmount, DEC_AMT),
      discountAmount:
        changedField === "discountAmount"
          ? formatNumberValue(discountAmount, DEC_AMT)
          : item.discountAmount,
      netAmount: formatNumberValue(netAmount, DEC_AMT),
    };
  };

  const updateItem = (id, field, value, commit = false) => {
    if (offerSubmitted) return;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        let nextValue = value;

        if (field === "type" || field === "itemCode" || field === "uom") {
          nextValue = String(value || "").toUpperCase();
        }

        const nextItem = {
          ...item,
          [field]: nextValue,
        };

        if (commit) {
          if (field === "quantity") {
            nextItem.quantity = formatNumberValue(nextValue, decQty);
          }

          if (field === "unitPrice") {
            nextItem.unitPrice = formatNumberValue(nextValue, decUPrice);
          }

          if (field === "discountAmount") {
            nextItem.discountAmount = formatNumberValue(nextValue, DEC_AMT);
          }
        }

        return calculateItem(nextItem, commit ? field : "");
      })
    );

    setSubmitMessage("");
    setFetchError("");
  };

  const focusItemCell = (field, rowIndex) => {
    const nextEl = document.getElementById(
      `vendor-canvass-${field}-${rowIndex}`
    );

    if (nextEl) {
      nextEl.focus();

      if (typeof nextEl.select === "function") {
        nextEl.select();
      }
    }
  };

  const commitNumericField = (itemId, field, value) => {
    const decimals =
      field === "quantity"
        ? decQty
        : field === "unitPrice"
        ? decUPrice
        : DEC_AMT;

    updateItem(
      itemId,
      field,
      formatNumberValue(sanitizeNumeric(value), decimals),
      true
    );
  };

  const handleItemKeyDown = (e, itemId, field, rowIndex) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (["quantity", "unitPrice", "discountAmount"].includes(field)) {
        commitNumericField(itemId, field, e.currentTarget.value);
      }

      window.setTimeout(() => {
        focusItemCell(field, rowIndex + 1);
      }, 0);

      return;
    }

    if (e.key === "Tab" && ["unitPrice", "discountAmount"].includes(field)) {
      e.preventDefault();

      commitNumericField(itemId, field, e.currentTarget.value);

      let nextField = field;
      let nextRow = rowIndex;

      if (e.shiftKey) {
        if (field === "discountAmount") {
          nextField = "unitPrice";
        } else if (field === "unitPrice") {
          nextField = "discountAmount";
          nextRow = Math.max(rowIndex - 1, 0);
        }
      } else {
        if (field === "unitPrice") {
          nextField = "discountAmount";
        } else if (field === "discountAmount") {
          nextField = "unitPrice";
          nextRow = rowIndex + 1;
        }
      }

      window.setTimeout(() => {
        focusItemCell(nextField, nextRow);
      }, 0);
    }
  };

  const fetchVendorCanvassByVendCode = async ({
    clearSubmitMessage = true,
  } = {}) => {
    if (!loggedVendorCode) {
      setFetchError("Missing vendor code from logged-in account.");
      return;
    }

    setFetching(true);
    setFetchError("");
    if (clearSubmitMessage) {
      setSubmitMessage("");
      setOfferSubmitted(false);
    }

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
  vend_code: loggedVendorCode,
  can_id: selectedCanvass?.can_id || selectedCanvass?.canId || "",
  can_supplier_id:
    selectedCanvass?.can_supplier_id || selectedCanvass?.canSupplierId || "",
})
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        setFetchError(result.message || "Unable to fetch vendor canvass.");
        setOffer(initialOffer);
        setItems([createItem(1)]);
        return;
      }

      const canvassRows = Array.isArray(result.data)
  ? result.data
  : result.data
  ? [result.data]
  : [];

const canvass = canvassRows[0] || {};

      setOffer({
        canSupplierId: canvass.canSupplierId || "",
        canId: canvass.canId || "",
        supplierCode: canvass.supplierCode || "",
        supplierName: canvass.supplierName || "",
        quoteNo: canvass.quoteNo || "",
        quoteDate: normalizeDate(canvass.quoteDate),
        offerDate: normalizeDate(canvass.offerDate),
        deliveryDate: normalizeDate(canvass.deliveryDate),
        paymentTerms: canvass.paymentTerms || "",
        deliveryTerms: canvass.deliveryTerms || "",
        remarks: canvass.remarks || "",
      });

      const detailRows = Array.isArray(canvass.detailRows)
        ? canvass.detailRows
        : [];

      setItems(
        detailRows.length > 0
          ? detailRows.map((row, index) => {
              const mappedRow = {
                id: row.canSupplierDt1Id || `${Date.now()}-${index}`,
                canSupplierDt1Id: row.canSupplierDt1Id || "",
                canSupplierId: row.canSupplierId || canvass.canSupplierId || "",
                canId: row.canId || canvass.canId || "",
                canDt1Id: row.canDt1Id || "",

                ln: row.ln || index + 1,
                type: row.type || "",
                itemCode: row.itemCode || "",
                itemName: row.itemName || "",
                specs: row.specs || "",
                uom: row.uom || "",

                quantity: formatNumberValue(row.quantity, decQty),
                unitPrice: formatNumberValue(row.unitPrice, decUPrice),
                grossAmount: formatNumberValue(row.grossAmount, DEC_AMT),
                discountAmount: formatNumberValue(row.discountAmount, DEC_AMT),
                netAmount: formatNumberValue(row.netAmount, DEC_AMT),

                isAwardedLine: Boolean(row.isAwardedLine),
                remarks: row.remarks || "",
              };

              return calculateItem(mappedRow);
            })
          : [createItem(1)]
      );
    } catch (error) {
      console.error("Fetch vendor canvass by vendor code error:", error);
      setFetchError("Unable to connect to the server.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
  fetchVendorCanvassByVendCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [
  loggedVendorCode,
  selectedCanvass?.can_id,
  selectedCanvass?.canId,
  selectedCanvass?.can_supplier_id,
  selectedCanvass?.canSupplierId,
  decQty,
  decUPrice,
]);

  const addFilesToAttachment = (files) => {
    if (offerSubmitted) return;

    const selectedFiles = Array.from(files || []);

    if (selectedFiles.length === 0) return;

    const now = new Date();

    setAttachments((prev) => [
      ...prev,
      ...selectedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        fileName: file.name,
        file,
        modifiedDate: file.lastModified ? new Date(file.lastModified) : now,
        uploadedDate: now,
      })),
    ]);
  };

  const removeAttachment = (id) => {
    if (offerSubmitted) return;

    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  };

  const viewAttachment = (attachment) => {
    if (!attachment?.file) return;

    const url = URL.createObjectURL(attachment.file);
    window.open(url, "_blank", "noopener,noreferrer");

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadAttachment = (attachment) => {
    if (!attachment?.file) return;

    const url = URL.createObjectURL(attachment.file);
    const link = document.createElement("a");

    link.href = url;
    link.download = attachment.fileName || attachment.name || "attachment";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const downloadAllAttachments = () => {
    attachments.forEach((attachment) => {
      if (attachment?.file) downloadAttachment(attachment);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (offerSubmitted) {
      return;
    }

    if (!loggedVendorCode) {
      setFetchError("Missing vendor code from logged-in account.");
      return;
    }

    if (!offer.canSupplierId) {
      setFetchError("Missing CAN Supplier ID. Please reload the canvass.");
      return;
    }

    const normalizedItems = items.map((item) => {
      const amounts = getItemAmounts(item);

      return {
        canSupplierDt1Id: item.canSupplierDt1Id,
        canSupplierId: item.canSupplierId,
        canId: item.canId,
        canDt1Id: item.canDt1Id,

        ln: item.ln,
        type: item.type,
        itemCode: item.itemCode,
        itemName: item.itemName,
        specs: item.specs,
        uom: item.uom,

        quantity: parseNumber(item.quantity),
        unitPrice: parseNumber(item.unitPrice),
        grossAmount: amounts.grossAmount,
        discountAmount: amounts.discountAmount,
        vatAmount: 0,
        netAmount: amounts.netAmount,

        remarks: item.remarks || "",
      };
    });

    const payload = {
      vend_code: loggedVendorCode,
      vendorCode: loggedVendorCode,

      can_supplier_id: offer.canSupplierId,
      canSupplierId: offer.canSupplierId,
      can_id: offer.canId,
      canId: offer.canId,

      offer: {
        ...offer,
        quoteNo: offer.quoteNo,
        quoteDate: offer.quoteDate,
        offerDate: offer.offerDate,
        deliveryDate: offer.deliveryDate,
        offerAmount: totals.grossAmount,
        discountAmount: totals.discountAmount,
        vatAmount: 0,
        netAmount: totals.netAmount,
        paymentTerms: offer.paymentTerms,
        deliveryTerms: offer.deliveryTerms,
        remarks: offer.remarks,
      },

      items: normalizedItems,

      totalGrossAmount: totals.grossAmount,
      totalDiscountAmount: totals.discountAmount,
      totalVatAmount: 0,
      totalNetAmount: totals.netAmount,
    };

    setSubmitting(true);
    setFetchError("");
    setSubmitMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/vendor-portal/canvass/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        setFetchError(result.message || "Unable to submit vendor canvass.");
        return;
      }

      const successMessage =
        result.message || "Vendor canvass submitted successfully.";

      setSubmitMessage(successMessage);
      setOfferSubmitted(true);
      toast.success(successMessage);

      onSubmit?.({
        ...payload,
        attachments,
        apiResult: result,
      });

      await fetchVendorCanvassByVendCode({ clearSubmitMessage: false });
    } catch (error) {
      console.error("Submit vendor canvass error:", error);
      setFetchError("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <HotToastToaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontSize: "13px",
            fontWeight: 700,
          },
        }}
      />

      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white text-center shadow-2xl ring-1 ring-white/40">
            <div className="bg-gradient-to-r from-[#0f2f57] to-blue-700 px-6 py-5 text-white">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
              <h2 className="mt-4 text-base font-black">Submitting offer</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-blue-100">
                Saving your canvass offer. Please wait.
              </p>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f2f57] text-sm font-black text-white shadow-sm">
              {getInitials(vendorName)}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-tight text-slate-900">
                Vendor Canvass Sheet
              </h1>
              <p className="truncate text-xs font-semibold text-slate-500">
                Logged in as {vendorName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <span aria-hidden="true">←</span>
                Dashboard
              </button>
            )}

            <button
              type="submit"
              form="vendor-canvass-form"
              disabled={loading || fetching || submitting || offerSubmitted}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f2f57] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#143f72] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:translate-y-0"
            >
              {loading || submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Submitting...
                </>
              ) : fetching ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Loading...
                </>
              ) : offerSubmitted ? (
                <>
                  <span aria-hidden="true">✓</span>
                  Offer Submitted
                </>
              ) : (
                <>
                  Submit Offer
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
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
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(125,211,252,.26),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,.24),transparent_32%)]" />

            <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-sky-100">
                  Supplier Offer Workspace
                </div>

                <h2 className="truncate text-2xl font-black tracking-tight md:text-3xl">
                  {offer.supplierName || vendorName}
                </h2>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-blue-50">
                    Vendor Code: {loggedVendorCode || "-"}
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-blue-50">
                    Supplier ID: {offer.canSupplierId || "-"}
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-blue-50">
                    Items: {items.length}
                  </span>
                  <StatusBadge submitted={offerSubmitted} fetching={fetching} />
                </div>

                <p className="mt-4 max-w-3xl text-sm font-medium leading-6 text-sky-100">
                  Encode offer details, item quotation, delivery terms, and supporting attachments before submitting your canvass offer.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <HeroMetric label="Gross Amount" value={`PHP ${formatCurrency(totals.grossAmount)}`} />
                <HeroMetric label="Discount" value={`PHP ${formatCurrency(totals.discountAmount)}`} />
                <HeroMetric label="Net Amount" value={`PHP ${formatCurrency(totals.netAmount)}`} highlight />
              </div>
            </div>
          </div>
        </section>

        {(fetchError || submitMessage || offerSubmitted) && (
          <section className="grid gap-3">
            {fetchError && <AlertBox tone="amber" message={fetchError} />}
            {submitMessage && <AlertBox tone="emerald" message={submitMessage} />}
            {offerSubmitted && (
              <AlertBox
                tone="slate"
                message="This offer has been submitted. Fields are now locked for editing."
              />
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                {/* <p className="text-xs font-black uppercase tracking-wider text-sky-700">
                  Canvass Entry
                </p> */}
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Supplier Offer Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Complete the offer information and item price fields below.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:w-[430px]">
                <SummaryCard label="Items" value={items.length} />
                <SummaryCard label="Attachments" value={attachments.length} />
                <SummaryCard label="Quoted" value={items.filter((item) => parseNumber(item.unitPrice) > 0).length} highlight />
              </div>
            </div>
          </div>

          {fetching ? (
            <div className="p-5">
              <LoadingPanel label="Loading canvass sheet..." />
            </div>
          ) : (
            <form
              id="vendor-canvass-form"
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <div className="grid grid-cols-2 gap-1 sm:inline-grid">
                  <TabButton
                    active={activeTab === "offer"}
                    onClick={() => setActiveTab("offer")}
                    icon="📄"
                  >
                    Offer Information
                  </TabButton>

                  <TabButton
                    active={activeTab === "items"}
                    onClick={() => setActiveTab("items")}
                    icon="📋"
                  >
                    Item Details
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${activeTab === "items" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                      {items.length}
                    </span>
                  </TabButton>
                </div>
              </div>

              {activeTab === "offer" && (
                <SectionCard
                  title="Offer Information"
                  description="Supplier code and name are system-filled. Encode quotation, dates, terms, and remarks."
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Input
                      label="Supplier Code"
                      value={offer.supplierCode}
                      readOnly
                    />

                    <Input
                      label="Supplier Name"
                      value={offer.supplierName}
                      readOnly
                    />

                    <Input
                      label="Quote No."
                      value={offer.quoteNo}
                      onChange={(value) => updateOffer("quoteNo", value)}
                      readOnly={offerSubmitted}
                    />

                    <Input
                      label="Quote Date"
                      type="date"
                      value={offer.quoteDate}
                      onChange={(value) => updateOffer("quoteDate", value)}
                      readOnly={offerSubmitted}
                    />

                    <Input
                      label="Offer Date"
                      type="date"
                      value={offer.offerDate}
                      onChange={(value) => updateOffer("offerDate", value)}
                      readOnly={offerSubmitted}
                    />

                    <Input
                      label="Delivery Date"
                      type="date"
                      value={offer.deliveryDate}
                      onChange={(value) => updateOffer("deliveryDate", value)}
                      readOnly={offerSubmitted}
                    />

                    <Input
                      label="Payment Terms"
                      value={offer.paymentTerms}
                      onChange={(value) => updateOffer("paymentTerms", value)}
                      readOnly={offerSubmitted}
                    />

                    <Input
                      label="Delivery Terms"
                      value={offer.deliveryTerms}
                      onChange={(value) => updateOffer("deliveryTerms", value)}
                      readOnly={offerSubmitted}
                    />

                    <Input
                      label="Total Offer Amount"
                      value={`PHP ${formatCurrency(totals.grossAmount)}`}
                      readOnly
                    />

                    <div className="hidden lg:block" />

                    <Textarea
                      label="Supplier Remarks"
                      value={offer.remarks}
                      onChange={(value) => updateOffer("remarks", value)}
                      readOnly={offerSubmitted}
                    />
                  </div>
                </SectionCard>
              )}

              {activeTab === "items" && (
                <SectionCard
                  title="Item Details"
                  description="Encode Unit Price and Discount Amount. Gross and Net Amounts are calculated automatically."
                  rightContent={
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-500">
                      {items.length} item{items.length === 1 ? "" : "s"}
                    </span>
                  }
                >
                  <div className="overflow-hidden rounded-2xl border border-[#d8e2ef] bg-white shadow-sm">
                    <div className="max-h-[560px] overflow-auto">
                      <table className="min-w-[1530px] border-separate border-spacing-0 text-xs">
                        <thead className="sticky top-0 z-20">
                          <tr className="bg-[#d9e8fa] text-slate-950">
                            <CanvassHead className="w-[60px] text-center">LN</CanvassHead>
                            <CanvassHead className="w-[90px] text-center">Type</CanvassHead>
                            <CanvassHead className="w-[150px] text-center">Item Code</CanvassHead>
                            <CanvassHead className="w-[300px] text-center">Item Name</CanvassHead>
                            <CanvassHead className="w-[300px] text-center">Specification</CanvassHead>
                            <CanvassHead className="w-[90px] text-center">UOM</CanvassHead>
                            <CanvassHead className="w-[130px] text-right">Quantity</CanvassHead>
                            <CanvassHead className="w-[130px] text-right">Unit Price</CanvassHead>
                            <CanvassHead className="w-[145px] text-right">Gross Amount</CanvassHead>
                            <CanvassHead className="w-[150px] text-right">Discount Amount</CanvassHead>
                            <CanvassHead className="w-[145px] text-right">Net Amount</CanvassHead>
                          </tr>
                        </thead>

                        <tbody className="bg-white">
                          {items.map((item, index) => {
                            const amounts = getItemAmounts(item);

                            return (
                              <tr key={item.id} className="h-10 transition hover:bg-sky-50/40">
                                <CanvassCell className="text-center font-black text-slate-500">
                                  {item.ln}
                                </CanvassCell>

                                <CanvassCell>
                                  <TableInput
                                    value={item.type}
                                    onChange={(value) => updateItem(item.id, "type", value)}
                                    center
                                    readOnly
                                  />
                                </CanvassCell>

                                <CanvassCell>
                                  <TableInput
                                    value={item.itemCode}
                                    onChange={(value) => updateItem(item.id, "itemCode", value)}
                                    readOnly
                                  />
                                </CanvassCell>

                                <CanvassCell>
                                  <TableInput
                                    value={item.itemName}
                                    onChange={(value) => updateItem(item.id, "itemName", value)}
                                    readOnly
                                  />
                                </CanvassCell>

                                <CanvassCell>
                                  <TableInput
                                    value={item.specs}
                                    onChange={(value) => updateItem(item.id, "specs", value)}
                                    readOnly
                                  />
                                </CanvassCell>

                                <CanvassCell>
                                  <TableInput
                                    value={item.uom}
                                    onChange={(value) => updateItem(item.id, "uom", value)}
                                    center
                                    readOnly
                                  />
                                </CanvassCell>

                                <CanvassCell>
                                  <TableInput
                                    id={`vendor-canvass-quantity-${index}`}
                                    type="text"
                                    value={item.quantity}
                                    onChange={(value) => updateItem(item.id, "quantity", sanitizeNumeric(value))}
                                    onBlur={(e) => commitNumericField(item.id, "quantity", e.target.value)}
                                    onKeyDown={(e) => handleItemKeyDown(e, item.id, "quantity", index)}
                                    number
                                    readOnly
                                  />
                                </CanvassCell>

                                <CanvassCell>
                                  <TableInput
                                    id={`vendor-canvass-unitPrice-${index}`}
                                    type="text"
                                    value={item.unitPrice}
                                    onChange={(value) => updateItem(item.id, "unitPrice", sanitizeNumeric(value))}
                                    onFocus={(e) => {
                                      if (parseNumber(e.target.value) === 0) {
                                        updateItem(item.id, "unitPrice", "");
                                      }
                                    }}
                                    onBlur={(e) => commitNumericField(item.id, "unitPrice", e.target.value)}
                                    onKeyDown={(e) => handleItemKeyDown(e, item.id, "unitPrice", index)}
                                    number
                                    readOnly={offerSubmitted}
                                  />
                                </CanvassCell>

                                <CanvassCell className="text-right font-semibold text-slate-700">
                                  {formatCurrency(amounts.grossAmount)}
                                </CanvassCell>

                                <CanvassCell>
                                  <TableInput
                                    id={`vendor-canvass-discountAmount-${index}`}
                                    type="text"
                                    value={item.discountAmount}
                                    onChange={(value) => updateItem(item.id, "discountAmount", sanitizeNumeric(value))}
                                    onFocus={(e) => {
                                      if (parseNumber(e.target.value) === 0) {
                                        updateItem(item.id, "discountAmount", "");
                                      }
                                    }}
                                    onBlur={(e) => commitNumericField(item.id, "discountAmount", e.target.value)}
                                    onKeyDown={(e) => handleItemKeyDown(e, item.id, "discountAmount", index)}
                                    number
                                    readOnly={offerSubmitted}
                                  />
                                </CanvassCell>

                                <CanvassCell className="text-right font-black text-slate-900">
                                  {formatCurrency(amounts.netAmount)}
                                </CanvassCell>
                              </tr>
                            );
                          })}
                        </tbody>

                        <tfoot className="sticky bottom-0 z-20 bg-[#eef3f9] font-black">
                          <tr className="h-10 bg-[#eef3f9]">
                            <td colSpan={8} className="border-b border-r border-[#d8e2ef] px-3 py-2 text-right text-slate-700">
                              Total
                            </td>
                            <td className="border-b border-r border-[#d8e2ef] px-3 py-2 text-right text-slate-900">
                              {formatCurrency(totals.grossAmount)}
                            </td>
                            <td className="border-b border-r border-[#d8e2ef] px-3 py-2 text-right text-slate-900">
                              {formatCurrency(totals.discountAmount)}
                            </td>
                            <td className="border-b border-r border-[#d8e2ef] px-3 py-2 text-right text-slate-900">
                              {formatCurrency(totals.netAmount)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </SectionCard>
              )}

              <SectionCard
                title="Supporting Attachments"
                description="Attach quotation files, supporting documents, or other references for this offer."
                rightContent={
                  <button
                    type="button"
                    onClick={() => setShowAttachmentModal(true)}
                    disabled={offerSubmitted}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    <span aria-hidden="true">📎</span>
                    Manage Files
                  </button>
                }
              >
                <div className="flex flex-wrap gap-2">
                  {attachments.length === 0 ? (
                    <div className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
                      No attachments uploaded yet.
                    </div>
                  ) : (
                    attachments.slice(0, 6).map((attachment) => (
                      <span
                        key={attachment.id}
                        className="inline-flex max-w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
                        title={attachment.fileName || attachment.name}
                      >
                        <span aria-hidden="true">📄</span>
                        <span className="max-w-[360px] truncate">
                          {attachment.fileName || attachment.name}
                        </span>
                      </span>
                    ))
                  )}
                  {attachments.length > 6 && (
                    <span className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500">
                      +{attachments.length - 6} more
                    </span>
                  )}
                </div>
              </SectionCard>

              <section className="sticky bottom-4 z-20 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-200/70 backdrop-blur">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-600">
                      Offer Summary
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Net Amount: <span className="font-black text-slate-800">PHP {formatCurrency(totals.netAmount)}</span> · Attachments: {attachments.length}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || fetching || submitting || offerSubmitted}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f2f57] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#143f72] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:translate-y-0"
                  >
                    {loading || submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Submitting...
                      </>
                    ) : offerSubmitted ? (
                      <>
                        <span aria-hidden="true">✓</span>
                        Offer Submitted
                      </>
                    ) : (
                      <>
                        Submit Offer
                        <span aria-hidden="true">→</span>
                      </>
                    )}
                  </button>
                </div>
              </section>

              {showAttachmentModal && (
                <AttachmentModal
                  attachments={attachments}
                  onClose={() => setShowAttachmentModal(false)}
                  onAddFiles={addFilesToAttachment}
                  onView={viewAttachment}
                  onDownload={downloadAttachment}
                  onDownloadAll={downloadAllAttachments}
                  onDelete={removeAttachment}
                  locked={offerSubmitted}
                />
              )}
            </form>
          )}
        </section>
      </main>
    </div>
  );
}


function getItemAmounts(item) {
  const grossAmount = getGrossAmount(item);
  const discountAmount = Math.min(parseNumber(item.discountAmount), grossAmount);
  const netAmount = grossAmount - discountAmount;

  return {
    grossAmount,
    discountAmount,
    netAmount,
  };
}

function getGrossAmount(item) {
  const quantity = parseNumber(item.quantity);
  const unitPrice = parseNumber(item.unitPrice);

  return quantity * unitPrice;
}

function sanitizeNumeric(value) {
  const raw = String(value ?? "");
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");

  return parts.length <= 1 ? cleaned : `${parts.shift()}.${parts.join("")}`;
}

function parseNumber(value) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumberValue(value, decimals = 2) {
  return new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(parseNumber(value));
}

function formatCurrency(value) {
  return formatNumberValue(value, DEC_AMT);
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function normalizeDate(value) {
  if (!value) return "";

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) return "";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function getInitials(value) {
  const words = String(value || "Vendor")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "V";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
}

function AlertBox({ tone = "slate", message }) {
  const toneClass = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    slate: "border-slate-200 bg-white text-slate-700",
  }[tone] || "border-slate-200 bg-white text-slate-700";

  const icon = tone === "emerald" ? "✓" : tone === "amber" ? "!" : "i";

  return (
    <div className={`flex items-start gap-3 rounded-3xl border px-4 py-3 text-sm font-semibold shadow-sm ${toneClass}`}>
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-black">
        {icon}
      </span>
      <p className="leading-6">{message}</p>
    </div>
  );
}

function StatusBadge({ submitted, fetching }) {
  if (fetching) {
    return (
      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-blue-50">
        Loading canvass
      </span>
    );
  }

  if (submitted) {
    return (
      <span className="rounded-full border border-emerald-300/40 bg-emerald-400/15 px-3 py-1 text-emerald-100">
        Offer submitted
      </span>
    );
  }

  return (
    <span className="rounded-full border border-amber-300/40 bg-amber-400/15 px-3 py-1 text-amber-100">
      Draft offer
    </span>
  );
}

function HeroMetric({ label, value, highlight = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 backdrop-blur ${
        highlight
          ? "border-white/30 bg-white/20 text-white"
          : "border-white/15 bg-white/10 text-blue-50"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-wider opacity-80">
        {label}
      </p>
      <p className="mt-2 truncate text-lg font-black">{value}</p>
    </div>
  );
}

function SummaryCard({ label, value, highlight = false }) {
  return (
    <div
      className={`rounded-2xl border p-3 text-center shadow-sm ${
        highlight
          ? "border-blue-200 bg-blue-50 text-blue-800"
          : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-wider opacity-75">
        {label}
      </p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function LoadingPanel({ label }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-sm font-bold text-slate-600">
      <span className="h-11 w-11 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
      <span>{label}</span>
    </div>
  );
}

function TabButton({ active, onClick, children, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
        active
          ? "bg-[#0f2f57] text-white shadow-sm"
          : "text-slate-600 hover:bg-white hover:text-slate-900"
      }`}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}

function SectionCard({ title, description, rightContent, children }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {description}
              </p>
            )}
          </div>
          {rightContent && <div className="shrink-0">{rightContent}</div>}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Input({ label, value, onChange, type = "text", readOnly = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500">
        {label}
      </span>

      <input
        type={type}
        value={value || ""}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-[#0f2f57] focus:ring-2 focus:ring-blue-100 ${
          readOnly
            ? "border-slate-200 bg-slate-100 text-slate-600"
            : "border-slate-300 bg-white text-slate-800"
        }`}
      />
    </label>
  );
}

function Textarea({ label, value, onChange, readOnly = false }) {
  return (
    <label className="block md:col-span-2 lg:col-span-4">
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500">
        {label}
      </span>

      <textarea
        value={value || ""}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={`w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-[#0f2f57] focus:ring-2 focus:ring-blue-100 ${
          readOnly
            ? "border-slate-200 bg-slate-100 text-slate-600"
            : "border-slate-300 bg-white text-slate-800"
        }`}
      />
    </label>
  );
}

function TableInput({
  id,
  value,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  type = "text",
  number = false,
  center = false,
  readOnly = false,
}) {
  return (
    <input
      id={id}
      type={type}
      value={value ?? ""}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      onBlur={onBlur}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      className={`w-full min-w-0 rounded-lg border-0 bg-transparent px-1 py-1 text-xs font-semibold text-slate-900 outline-none transition focus:bg-sky-50 focus:ring-2 focus:ring-sky-100 ${
        readOnly ? "cursor-default text-slate-600" : ""
      } ${number ? "text-right" : center ? "text-center" : "text-left"}`}
    />
  );
}

function CanvassHead({ children, className = "" }) {
  return (
    <th
      className={`border-b border-r border-[#cfdbea] px-3 py-3 text-xs font-black uppercase tracking-wide ${className}`}
    >
      {children}
    </th>
  );
}

function CanvassCell({ children, className = "" }) {
  return (
    <td
      className={`border-b border-r border-[#d8e2ef] px-3 py-2 align-middle text-xs text-slate-950 ${className}`}
    >
      {children}
    </td>
  );
}

function AttachmentModal({
  attachments,
  onClose,
  onAddFiles,
  onView,
  onDownload,
  onDownloadAll,
  onDelete,
  locked = false,
}) {
  const fileInputId = "vendor-canvass-attachment-input";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex h-[76vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-white/50">
        <div className="bg-gradient-to-r from-[#0f2f57] to-blue-700 px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-xl" aria-hidden="true">
                📎
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                  Attachments
                </p>
                <h2 className="text-lg font-black">Document Attachments</h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-2xl leading-none text-white transition hover:bg-white/25"
              aria-label="Close attachment modal"
            >
              ×
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 text-slate-700">
                  <th className="border-b border-r border-slate-200 px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                    File Name
                  </th>
                  <th className="w-[190px] border-b border-r border-slate-200 px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                    Modified Date
                  </th>
                  <th className="w-[190px] border-b border-r border-slate-200 px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                    Uploaded Date
                  </th>
                  <th className="w-[210px] border-b border-slate-200 px-4 py-3 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {attachments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-14 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl" aria-hidden="true">
                          📁
                        </div>
                        <p className="mt-3 text-sm font-black text-slate-700">
                          No attachments uploaded
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Click Add File below to include quotation documents or supporting files.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  attachments.map((attachment) => (
                    <tr key={attachment.id} className="transition hover:bg-slate-50">
                      <td className="border-b border-r border-slate-200 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500" aria-hidden="true">
                            📄
                          </span>
                          <span
                            className="max-w-[420px] truncate font-semibold text-slate-800"
                            title={attachment.fileName || attachment.name}
                          >
                            {attachment.fileName || attachment.name}
                          </span>
                        </div>
                      </td>

                      <td className="border-b border-r border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500">
                        {formatDateTime(attachment.modifiedDate)}
                      </td>

                      <td className="border-b border-r border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500">
                        {formatDateTime(attachment.uploadedDate)}
                      </td>

                      <td className="border-b border-slate-200 px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <IconButton onClick={() => onView(attachment)} title="View" tone="emerald">
                            👁
                          </IconButton>
                          <IconButton onClick={() => onDownload(attachment)} title="Download" tone="blue">
                            ⬇
                          </IconButton>
                          <IconButton
                            onClick={() => onDelete(attachment.id)}
                            title="Delete"
                            tone="red"
                            disabled={locked}
                          >
                            🗑
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-xs font-semibold text-slate-500">
            {attachments.length} file{attachments.length === 1 ? "" : "s"} attached
          </p>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <input
              id={fileInputId}
              type="file"
              multiple
              disabled={locked}
              className="hidden"
              onChange={(e) => {
                onAddFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <label
              htmlFor={fileInputId}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black text-white transition ${
                locked
                  ? "cursor-not-allowed bg-slate-300 text-slate-500"
                  : "cursor-pointer bg-[#0f2f57] hover:bg-[#143f72]"
              }`}
              onClick={(event) => {
                if (locked) {
                  event.preventDefault();
                }
              }}
            >
              <span className="text-base leading-none">+</span>
              Add File
            </label>

            <button
              type="button"
              onClick={() => attachments.forEach((attachment) => onView(attachment))}
              disabled={attachments.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              👁 View All
            </button>

            <button
              type="button"
              onClick={onDownloadAll}
              disabled={attachments.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ⬇ Download All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconButton({ children, onClick, title, tone = "slate", disabled = false }) {
  const toneClass = {
    emerald: "text-emerald-700 hover:bg-emerald-50",
    blue: "text-blue-700 hover:bg-blue-50",
    red: "text-red-700 hover:bg-red-50",
    slate: "text-slate-700 hover:bg-slate-50",
  }[tone] || "text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm transition disabled:cursor-not-allowed disabled:text-slate-300 ${toneClass}`}
      title={title}
    >
      {children}
    </button>
  );
}
