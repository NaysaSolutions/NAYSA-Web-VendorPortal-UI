import React, { useEffect, useMemo, useState } from "react";
import VendorLogin from "./VendorLogin.jsx";
import VendorPreRegistration from "./VendorPreRegistration.jsx";
import VendorTemporaryAccountRegistration from "./VendorTemporaryAccountRegistration.jsx";
import VendorRegistration from "./VendorRegistration.jsx";
import VendorAccreditation from "./VendorAccreditation.jsx";
import VendorApprovedAccess from "./VendorApprovedAccess.jsx";
import VendorCanvass from "./VendorCanvass.jsx";
import VendorCanvassTable from "./VendorCanvassTable.jsx";
import VendorDashboard from "./VendorDashboard.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const VENDOR_PORTAL_URL = (
  import.meta.env.VITE_VENDOR_PORTAL_URL || window.location.origin
).replace(/\/$/, "");

const initialVendorInfo = {
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

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function generateRegNo() {
  const ymd = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = Math.floor(1000 + Math.random() * 9000);

  return `VPR-${ymd}-${random}`;
}

function createAccessKey() {
  const part1 = Math.random().toString(36).slice(2, 6).toUpperCase();
  const part2 = Math.random().toString(36).slice(2, 6).toUpperCase();
  const part3 = Math.floor(1000 + Math.random() * 9000);

  return `AK-${part1}-${part2}-${part3}`;
}

function getRegNoFromVendorUrl() {
  const parts = window.location.pathname.split("/").filter(Boolean);

  const index = parts.findIndex(
    (part) => String(part).toLowerCase() === "vendor-registration"
  );

  if (index === -1) return "";

  return decodeURIComponent(parts[index + 1] || "")
    .trim()
    .toUpperCase();
}

function getApprovedVendorCodeFromUrl() {
  const parts = window.location.pathname.split("/").filter(Boolean);

  const index = parts.findIndex(
    (part) => String(part).toLowerCase() === "vendor-approved-access"
  );

  if (index === -1) return "";

  return decodeURIComponent(parts[index + 1] || "")
    .trim()
    .toUpperCase();
}

function clearVendorRegistrationUrl() {
  const regNo = getRegNoFromVendorUrl();
  const approvedVendorCode = getApprovedVendorCodeFromUrl();

  if (regNo || approvedVendorCode) {
    window.history.pushState({}, "", "/");
  }
}

function normalizeDocuments(rawDocs) {
  if (!Array.isArray(rawDocs)) return [];

  return rawDocs
    .map((doc) => ({
      id:
        doc.id ||
        doc.document_id ||
        doc.documentId ||
        doc.DOCUMENT_ID ||
        doc.code ||
        doc.doc_code ||
        doc.DOC_CODE,
      code: String(
        doc.code || doc.doc_code || doc.docCode || doc.DOC_CODE || ""
      ).toUpperCase(),
      name: doc.name || doc.doc_name || doc.docName || doc.DOC_NAME || "",
      description: doc.description || doc.DESCRIPTION || "",
      required:
        doc.required === true ||
        doc.required === 1 ||
        doc.defaultRequired === true ||
        doc.default_required === true ||
        String(
          doc.required ||
            doc.REQUIRED ||
            doc.defaultRequired ||
            doc.default_required ||
            ""
        ).toUpperCase() === "Y",
    }))
    .filter((doc) => doc.code || doc.name);
}

function normalizeUploadedDocuments(rawUploads) {
  if (!rawUploads) return {};

  if (Array.isArray(rawUploads)) {
    return rawUploads.reduce((acc, upload) => {
      const code = String(
        upload.docCode ||
          upload.doc_code ||
          upload.code ||
          upload.DOC_CODE ||
          ""
      ).toUpperCase();

      if (!code) return acc;

      acc[code] = {
        ...upload,
        docCode: code,
        docName: upload.docName || upload.doc_name || upload.name || "",
        originalFileName:
          upload.originalFileName ||
          upload.original_file_name ||
          upload.fileName ||
          upload.file_name ||
          upload.storedFileName ||
          "",
        fileName:
          upload.fileName ||
          upload.file_name ||
          upload.originalFileName ||
          upload.original_file_name ||
          upload.storedFileName ||
          "",
        storedFileName:
          upload.storedFileName ||
          upload.stored_file_name ||
          upload.file_name ||
          "",
        fileUrl:
          upload.fileUrl ||
          upload.file_url ||
          upload.publicUrl ||
          upload.public_url ||
          upload.path ||
          upload.filePath ||
          "",
        uploadedAt:
          upload.uploadedAt ||
          upload.uploaded_at ||
          upload.created_at ||
          upload.UPLOADED_DATE ||
          "",
      };

      return acc;
    }, {});
  }

  return Object.entries(rawUploads).reduce((acc, [key, upload]) => {
    const code = String(
      upload?.docCode || upload?.doc_code || upload?.code || key || ""
    ).toUpperCase();

    if (!code) return acc;

    acc[code] = {
      ...upload,
      docCode: code,
      docName: upload?.docName || upload?.doc_name || upload?.name || "",
      originalFileName:
        upload?.originalFileName ||
        upload?.original_file_name ||
        upload?.fileName ||
        upload?.file_name ||
        upload?.storedFileName ||
        "",
      fileName:
        upload?.fileName ||
        upload?.file_name ||
        upload?.originalFileName ||
        upload?.original_file_name ||
        upload?.storedFileName ||
        "",
      storedFileName:
        upload?.storedFileName ||
        upload?.stored_file_name ||
        upload?.file_name ||
        "",
      fileUrl:
        upload?.fileUrl ||
        upload?.file_url ||
        upload?.publicUrl ||
        upload?.public_url ||
        upload?.path ||
        upload?.filePath ||
        "",
      uploadedAt:
        upload?.uploadedAt ||
        upload?.uploaded_at ||
        upload?.created_at ||
        upload?.UPLOADED_DATE ||
        "",
    };

    return acc;
  }, {});
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function normalizeApplicationFromApi(rawData, fallback = {}) {
  const data = rawData?.data || rawData || {};

  const app =
    data.application ||
    data.pre_registration ||
    data.preRegistration ||
    data.vendor ||
    data ||
    {};

  const vendorInfo =
    app.vendor_info ||
    app.vendorInfo ||
    app.vendor_master ||
    app.vendorMaster ||
    data.vendor_info ||
    data.vendorInfo ||
    data.vendor_master ||
    data.vendorMaster ||
    {};

  const vendorUser = data.vendor_user || data.vendorUser || data.user || {};

  const regNo = String(
    app.reg_no ||
      app.regNo ||
      app.REG_NO ||
      data.reg_no ||
      data.regNo ||
      data.REG_NO ||
      fallback.regNo ||
      ""
  ).toUpperCase();

  const id =
    app.id ||
    app.vendId ||
    app.VEND_ID ||
    app.vendor_pre_registration_id ||
    data.id ||
    data.vendId ||
    data.VEND_ID ||
    data.vendor_pre_registration_id ||
    data.vendorPreRegistrationId ||
    fallback.id ||
    regNo ||
    createId();

  const vendorName =
    app.vendor_name ||
    app.vendorName ||
    app.VEND_NAME ||
    data.vendor_name ||
    data.vendorName ||
    data.VEND_NAME ||
    vendorUser.vendor_name ||
    vendorUser.vendorName ||
    fallback.vendorName ||
    "";

  const vendorEmail =
    app.vendor_email ||
    app.vendorEmail ||
    app.VEND_EMAIL ||
    data.vendor_email ||
    data.vendorEmail ||
    data.VEND_EMAIL ||
    vendorUser.vendor_email ||
    vendorUser.vendorEmail ||
    fallback.vendorEmail ||
    "";

  const contactPerson =
    app.contact_person ||
    app.contactPerson ||
    app.VEND_CONTACT ||
    data.contact_person ||
    data.contactPerson ||
    data.VEND_CONTACT ||
    fallback.contactPerson ||
    "";

  const contactNo =
    app.contact_no ||
    app.contactNo ||
    app.VEND_MOBILENO ||
    data.contact_no ||
    data.contactNo ||
    data.VEND_MOBILENO ||
    fallback.contactNo ||
    "";

  const status =
    app.status ||
    app.reg_status ||
    app.regStatus ||
    app.REG_STATUS ||
    data.status ||
    data.reg_status ||
    data.regStatus ||
    data.REG_STATUS ||
    fallback.status ||
    "PRE-REGISTERED";

  const requiredDocuments = normalizeDocuments(
    app.required_documents ||
      app.requiredDocuments ||
      data.required_documents ||
      data.requiredDocuments ||
      fallback.requiredDocuments ||
      []
  );

  const fallbackVendorInfo = fallback.vendorInfo || {};

  const businessName =
    firstValue(
      app.business_name,
      app.businessName,
      app.trade_name,
      app.tradeName,
      app.BUSINESS_NAME,
      vendorInfo.business_name,
      vendorInfo.businessName,
      vendorInfo.trade_name,
      vendorInfo.tradeName,
      vendorInfo.BUSINESS_NAME,
      data.business_name,
      data.businessName,
      data.trade_name,
      data.tradeName,
      data.BUSINESS_NAME,
      fallbackVendorInfo.businessName
    ) || "";

  const tinNo =
    firstValue(
      app.tin_no,
      app.tinNo,
      app.tin,
      app.TIN,
      app.VEND_TIN,
      vendorInfo.tin_no,
      vendorInfo.tinNo,
      vendorInfo.tin,
      vendorInfo.TIN,
      vendorInfo.VEND_TIN,
      data.tin_no,
      data.tinNo,
      data.tin,
      data.TIN,
      data.VEND_TIN,
      fallbackVendorInfo.tinNo
    ) || "";

  const taxClass =
    firstValue(
      app.tax_class,
      app.taxClass,
      app.TAX_CLASS,
      vendorInfo.tax_class,
      vendorInfo.taxClass,
      vendorInfo.TAX_CLASS,
      data.tax_class,
      data.taxClass,
      data.TAX_CLASS,
      fallbackVendorInfo.taxClass
    ) || "Corporation";

  const taxType =
    firstValue(
      app.tax_type,
      app.taxType,
      app.vat_code,
      app.vatCode,
      app.VAT_CODE,
      vendorInfo.tax_type,
      vendorInfo.taxType,
      vendorInfo.vat_code,
      vendorInfo.vatCode,
      vendorInfo.VAT_CODE,
      data.tax_type,
      data.taxType,
      data.vat_code,
      data.vatCode,
      data.VAT_CODE,
      fallbackVendorInfo.taxType
    ) || "VAT";

  const address =
    firstValue(
      app.address,
      app.address1,
      app.addr1,
      app.VEND_ADDR,
      app.VEND_ADDR1,
      vendorInfo.address,
      vendorInfo.address1,
      vendorInfo.addr1,
      vendorInfo.VEND_ADDR,
      vendorInfo.VEND_ADDR1,
      data.address,
      data.address1,
      data.addr1,
      data.VEND_ADDR,
      data.VEND_ADDR1,
      fallbackVendorInfo.address
    ) || "";

  const zipCode =
    firstValue(
      app.zip_code,
      app.zipCode,
      app.zip,
      app.VEND_ZIP,
      app.VEND_ZIPCODE,
      vendorInfo.zip_code,
      vendorInfo.zipCode,
      vendorInfo.zip,
      vendorInfo.VEND_ZIP,
      vendorInfo.VEND_ZIPCODE,
      data.zip_code,
      data.zipCode,
      data.zip,
      data.VEND_ZIP,
      data.VEND_ZIPCODE,
      fallbackVendorInfo.zipCode
    ) || "";

  const paymentTerms =
    firstValue(
      app.payment_terms,
      app.paymentTerms,
      app.payterm_code,
      app.paytermCode,
      app.PAYTERM_CODE,
      vendorInfo.payment_terms,
      vendorInfo.paymentTerms,
      vendorInfo.payterm_code,
      vendorInfo.paytermCode,
      vendorInfo.PAYTERM_CODE,
      data.payment_terms,
      data.paymentTerms,
      data.payterm_code,
      data.paytermCode,
      data.PAYTERM_CODE,
      fallbackVendorInfo.paymentTerms
    ) || "";

  const uploadedDocuments = normalizeUploadedDocuments(
    app.uploadedDocuments ||
      app.uploaded_documents ||
      app.uploads ||
      data.uploadedDocuments ||
      data.uploaded_documents ||
      data.uploads ||
      fallback.uploadedDocuments ||
      fallback.uploads ||
      {}
  );

  const vendorCode =
    app.vendor_code ||
    app.vendorCode ||
    app.vendCode ||
    app.VEND_CODE ||
    data.vendor_code ||
    data.vendorCode ||
    data.vendCode ||
    data.VEND_CODE ||
    fallback.vendorCode ||
    "";

  return {
    id,
    vendId: app.vendId || app.VEND_ID || data.vendId || data.VEND_ID || id,
    regNo,
    vendorName,
    vendorEmail,
    contactPerson,
    contactNo,

    supplierType:
      app.supplier_type ||
      app.supplierType ||
      app.SUPPLIER_TYPE ||
      data.supplier_type ||
      data.supplierType ||
      data.SUPPLIER_TYPE ||
      fallback.supplierType ||
      "Local Supplier",

    remarks:
      app.remarks ||
      app.REMARKS ||
      data.remarks ||
      data.REMARKS ||
      fallback.remarks ||
      "",

    registrationLink:
      app.registration_link ||
      app.registrationLink ||
      app.REGISTRATION_LINK ||
      data.registration_link ||
      data.registrationLink ||
      data.REGISTRATION_LINK ||
      fallback.registrationLink ||
      "",

    approvedAccessLink:
      app.approved_access_link ||
      app.approvedAccessLink ||
      data.approved_access_link ||
      data.approvedAccessLink ||
      fallback.approvedAccessLink ||
      "",

    emailSent:
      app.email_sent === true ||
      app.email_sent === 1 ||
      app.emailSent === true ||
      app.EMAIL_SENT === "Y" ||
      data.email_sent === true ||
      data.email_sent === 1 ||
      data.emailSent === true ||
      data.EMAIL_SENT === "Y" ||
      fallback.emailSent ||
      false,

    vendorUserId:
      vendorUser.user_id ||
      vendorUser.userId ||
      data.user_id ||
      data.userId ||
      data.vendor_user_id ||
      data.vendorUserId ||
      fallback.vendorUserId ||
      "",

    status,

    createdAt:
      app.created_at ||
      app.createdAt ||
      app.REGISTERED_DATE ||
      data.created_at ||
      data.createdAt ||
      data.REGISTERED_DATE ||
      fallback.createdAt ||
      new Date().toLocaleString(),

    submittedAt:
      app.submitted_at ||
      app.submittedAt ||
      data.submitted_at ||
      data.submittedAt ||
      fallback.submittedAt ||
      "",

    reviewedAt:
      app.reviewed_at ||
      app.reviewedAt ||
      data.reviewed_at ||
      data.reviewedAt ||
      fallback.reviewedAt ||
      "",

    accreditationRemarks:
      app.accreditation_remarks ||
      app.accreditationRemarks ||
      app.REMARKS ||
      data.accreditation_remarks ||
      data.accreditationRemarks ||
      data.remarks ||
      fallback.accreditationRemarks ||
      "",

    vendorMasterCreated:
      app.vendor_master_created === true ||
      app.vendor_master_created === 1 ||
      app.vendorMasterCreated === true ||
      data.vendor_master_created === true ||
      data.vendor_master_created === 1 ||
      data.vendorMasterCreated === true ||
      fallback.vendorMasterCreated ||
      false,

    vendorCode,

    procurementAllowed:
      app.procurement_allowed === true ||
      app.procurement_allowed === 1 ||
      app.procurementAllowed === true ||
      data.procurement_allowed === true ||
      data.procurement_allowed === 1 ||
      data.procurementAllowed === true ||
      fallback.procurementAllowed ||
      false,

    requiredDocuments,

    vendorInfo: {
      ...initialVendorInfo,
      ...fallbackVendorInfo,
      vendorName: vendorName || fallbackVendorInfo.vendorName || "",
      businessName,
      tinNo,
      taxType,
      taxClass,
      address,
      zipCode,
      contactPerson: contactPerson || fallbackVendorInfo.contactPerson || "",
      contactNo: contactNo || fallbackVendorInfo.contactNo || "",
      email: vendorEmail || fallbackVendorInfo.email || "",
      paymentTerms,
    },

    uploadedDocuments,
    uploads: uploadedDocuments,
    emailLogs: fallback.emailLogs || [],
  };
}

export default function VendorOnboarding() {
  const [currentView, setCurrentView] = useState("login");
  const [internalTab, setInternalTab] = useState("preRegistration");
  const [currentUser, setCurrentUser] = useState(null);
  const [approvedVendor, setApprovedVendor] = useState(null);
const [selectedCanvass, setSelectedCanvass] = useState(null);

const [selectedVendorApplicationId, setSelectedVendorApplicationId] =
  useState(null);

  const [routeRegNo, setRouteRegNo] = useState(() => getRegNoFromVendorUrl());

  const [routeApprovedVendorCode, setRouteApprovedVendorCode] = useState(() =>
    getApprovedVendorCodeFromUrl()
  );

  const [loginForm, setLoginForm] = useState({
    userId: "",
    password: "",
  });

  const [loginError, setLoginError] = useState("");
  const [loginNotice, setLoginNotice] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [documentMaster, setDocumentMaster] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const [vendorApplications, setVendorApplications] = useState([]);

  const latestVendorAccess = useMemo(() => {
    return vendorApplications.find((app) => app.registrationLink) || null;
  }, [vendorApplications]);

  const accreditationApplications = useMemo(() => {
    return vendorApplications.filter((app) => {
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
  }, [vendorApplications]);

  const pendingAccreditationCount = useMemo(() => {
    return accreditationApplications.filter((app) =>
      ["FOR REVIEW", "PENDING APPROVAL", "FOR ACCREDITATION"].includes(
        String(app.status || "").toUpperCase()
      )
    ).length;
  }, [accreditationApplications]);

  const preRegisteredCount = useMemo(() => {
    return vendorApplications.filter(
      (app) => String(app.status || "").toUpperCase() === "PRE-REGISTERED"
    ).length;
  }, [vendorApplications]);

  const approvedVendorCount = useMemo(() => {
    return vendorApplications.filter((app) =>
      ["APPROVED", "ACCOUNT REGISTERED"].includes(
        String(app.status || "").toUpperCase()
      )
    ).length;
  }, [vendorApplications]);

  const returnedVendorCount = useMemo(() => {
    return vendorApplications.filter((app) =>
      ["RETURNED", "RETURNED FOR CORRECTION", "REJECTED"].includes(
        String(app.status || "").toUpperCase()
      )
    ).length;
  }, [vendorApplications]);

  const upsertVendorApplication = (application) => {
    if (!application) return;

    setVendorApplications((prev) => {
      const exists = prev.some(
        (app) =>
          String(app.id) === String(application.id) ||
          String(app.regNo).toUpperCase() ===
            String(application.regNo).toUpperCase()
      );

      if (exists) {
        return prev.map((app) =>
          String(app.id) === String(application.id) ||
          String(app.regNo).toUpperCase() ===
            String(application.regNo).toUpperCase()
            ? { ...app, ...application }
            : app
        );
      }

      return [application, ...prev];
    });
  };

  const fetchAccreditationDocuments = async () => {
    setDocumentsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/vendor-portal/accreditation-documents`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        setDocumentMaster([]);
        return;
      }

      setDocumentMaster(normalizeDocuments(result.data || []));
    } catch (error) {
      console.error("Fetch accreditation documents error:", error);
      setDocumentMaster([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const fetchVendorApplications = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/vendor-portal/applications`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) return;

      const records = Array.isArray(result.data) ? result.data : [];
      const normalized = records.map((item) => normalizeApplicationFromApi(item));

      setVendorApplications(normalized);
    } catch (error) {
      console.warn("Vendor applications API is not available yet.", error);
    }
  };

  useEffect(() => {
    fetchAccreditationDocuments();
    fetchVendorApplications();
  }, []);

  useEffect(() => {
    const approvedVendorCode = getApprovedVendorCodeFromUrl();

    if (approvedVendorCode) {
      setRouteApprovedVendorCode(approvedVendorCode);
      setCurrentUser(null);
      setLoginError("");
      setLoginNotice("");
      setCurrentView("approvedVendorAccess");
      return;
    }

    const regNo = getRegNoFromVendorUrl();

    if (!regNo) return;

    const tempApplication = normalizeApplicationFromApi(
      {
        regNo,
        status: "PRE-REGISTERED",
      },
      {
        id: regNo,
        regNo,
        status: "PRE-REGISTERED",
      }
    );

    upsertVendorApplication(tempApplication);

    setRouteRegNo(regNo);
    setCurrentUser(null);
    setLoginError("");
    setLoginNotice("");
    setSelectedVendorApplicationId(regNo);
    setCurrentView("vendorAccountSetup");
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const approvedVendorCode = getApprovedVendorCodeFromUrl();

      if (approvedVendorCode) {
        setRouteApprovedVendorCode(approvedVendorCode);
        setRouteRegNo("");
        setCurrentView("approvedVendorAccess");
        return;
      }

      const regNo = getRegNoFromVendorUrl();

      if (!regNo) {
        setRouteRegNo("");
        setRouteApprovedVendorCode("");
        setCurrentView("login");
        return;
      }

      setRouteRegNo(regNo);
      setRouteApprovedVendorCode("");
      setSelectedVendorApplicationId(regNo);
      setCurrentView("vendorAccountSetup");
    };

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const loginAuthorizedUser = async (userId, password) => {
    const response = await fetch(`${API_BASE_URL}/api/authorized-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        user_code: userId,
        password,
      }),
    });

    const result = await response.json().catch(() => ({}));

    return {
      ok: response.ok && result.success,
      status: response.status,
      result,
      message: result.message,
    };
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    setLoginError("");
    setLoginNotice("");

    const userId = loginForm.userId.trim();
    const password = loginForm.password;

    if (!userId || !password) {
      setLoginError("User ID and Password are required.");
      return;
    }

    setLoginLoading(true);

    try {
      const authorizedLogin = await loginAuthorizedUser(userId, password);

      if (authorizedLogin.ok) {
        const loggedUser = authorizedLogin.result.data || {};
        const role = String(loggedUser.role || "AUTHORIZED_USER").toUpperCase();

        if (
          role === "VENDOR" ||
          loggedUser.vendor_pre_registration_id ||
          loggedUser.vendorPreRegistrationId ||
          loggedUser.reg_no ||
          loggedUser.regNo
        ) {
          const matchedApplication = vendorApplications.find(
            (app) =>
              String(app.vendorUserId || "").toUpperCase() ===
                String(
                  loggedUser.user_id || loggedUser.userId || userId
                ).toUpperCase() ||
              String(app.regNo || "").toUpperCase() ===
                String(
                  loggedUser.reg_no || loggedUser.regNo || userId
                ).toUpperCase()
          );

          const vendorApplication = normalizeApplicationFromApi(
            authorizedLogin.result,
            {
              ...(matchedApplication || {}),
              id:
                loggedUser.vendor_pre_registration_id ||
                loggedUser.vendorPreRegistrationId ||
                matchedApplication?.id ||
                loggedUser.reg_no ||
                loggedUser.regNo ||
                userId,
              regNo:
                loggedUser.reg_no ||
                loggedUser.regNo ||
                matchedApplication?.regNo ||
                userId,
              vendorName:
                loggedUser.vendor_name ||
                loggedUser.vendorName ||
                loggedUser.user_name ||
                matchedApplication?.vendorName ||
                "Vendor",
              vendorUserId: loggedUser.user_id || loggedUser.userId || userId,
            }
          );

          clearVendorRegistrationUrl();
          upsertVendorApplication(vendorApplication);

          setCurrentUser({
            type: "vendor",
            role: "VENDOR",
            user_code: vendorApplication.regNo || userId,
            user_name:
              vendorApplication.vendorName ||
              loggedUser.user_name ||
              loggedUser.user_code ||
              "Vendor",
            vendorApplicationId: vendorApplication.id,
          });

          setLoginForm({ userId: "", password: "" });
          setRouteRegNo(vendorApplication.regNo || "");
          setRouteApprovedVendorCode("");
          setSelectedVendorApplicationId(vendorApplication.id);
          setCurrentView("vendorRegistration");

          await fetchVendorApplications();

          return;
        }

        clearVendorRegistrationUrl();

        setCurrentUser({
          type: "internal",
          role,
          user_code: loggedUser.user_code,
          user_name: loggedUser.user_name || loggedUser.user_code,
          email: loggedUser.email || "",
          user_type: loggedUser.user_type || "",
          branch_code: loggedUser.branch_code || loggedUser.branchCode || "HO",
        });

        setLoginForm({ userId: "", password: "" });
        setRouteRegNo("");
        setRouteApprovedVendorCode("");
        setInternalTab("preRegistration");
        setCurrentView("internalPortal");

        await fetchVendorApplications();

        return;
      }

      setLoginError(authorizedLogin.message || "Invalid user ID or password.");
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(
        "Unable to connect to the server. Please check if Laravel API is running and CORS is configured."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearVendorRegistrationUrl();

    setCurrentUser(null);
    setApprovedVendor(null);
    setSelectedVendorApplicationId(null);
    setRouteRegNo("");
    setRouteApprovedVendorCode("");
    setLoginForm({ userId: "", password: "" });
    setLoginError("");
    setLoginNotice("");
    setInternalTab("preRegistration");
    setCurrentView("login");
  };

  const handleCreatePreRegistration = async (preReg) => {
    const regNo = generateRegNo();
    const accessKey = createAccessKey();

    const registrationLink = `${VENDOR_PORTAL_URL}/vendor-registration/${encodeURIComponent(
      regNo
    )}`;

    const selectedDocuments = normalizeDocuments(preReg.requiredDocuments || []);

    const baseApplication = {
      id: createId(),
      regNo,
      vendorName: preReg.vendorName,
      vendorEmail: preReg.vendorEmail,
      contactPerson: preReg.contactPerson,
      contactNo: preReg.contactNo,
      supplierType: preReg.supplierType,
      remarks: preReg.remarks,
      requiredDocuments: selectedDocuments,
      registrationLink,
      approvedAccessLink: "",
      emailSent: false,
      vendorUserId: "",
      status: "PRE-REGISTERED",
      createdAt: new Date().toLocaleString(),
      submittedAt: "",
      reviewedAt: "",
      accreditationRemarks: "",
      vendorMasterCreated: false,
      vendorCode: "",
      procurementAllowed: false,
      vendorInfo: {
        ...initialVendorInfo,
        vendorName: preReg.vendorName,
        contactPerson: preReg.contactPerson,
        contactNo: preReg.contactNo,
        email: preReg.vendorEmail,
      },
      uploads: {},
      uploadedDocuments: {},
      emailLogs: [],
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/vendor-portal/send-registration-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            vendor_email: preReg.vendorEmail,
            vendor_name: preReg.vendorName,
            contact_person: preReg.contactPerson,
            contact_no: preReg.contactNo,
            supplier_type: preReg.supplierType,
            remarks: preReg.remarks,
            reg_no: regNo,
            registration_link: registrationLink,
            access_key: accessKey,
            branch_code: currentUser?.branch_code || "HO",
            registered_by: currentUser?.user_code || "SYSTEM",
            required_documents: selectedDocuments.map((doc) => ({
              id: doc.id,
              code: doc.code,
              name: doc.name,
            })),
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        alert(
          `${result.message || "Unable to send registration email."}\n\n${
            result.error || ""
          }`
        );

        return null;
      }

      const savedApplication = normalizeApplicationFromApi(result, {
        ...baseApplication,
        id: result.data?.id || result.data?.vendId || baseApplication.id,
        emailSent: true,
        emailLogs: [
          {
            id: `${Date.now()}-access`,
            date: new Date().toLocaleString(),
            type: "Registration Access",
            to: preReg.vendorEmail,
            subject: `Vendor Portal Registration - ${regNo}`,
            body: `Registration link and access key were sent to ${preReg.vendorEmail}.`,
          },
        ],
      });

      upsertVendorApplication(savedApplication);
      await fetchVendorApplications();

      return savedApplication;
    } catch (error) {
      console.error("Email sending error:", error);
      alert(
        "Unable to connect to email API. Please check Laravel server and SMTP settings."
      );

      return null;
    }
  };

  const handleOpenRegistrationLink = (applicationId) => {
    const app = vendorApplications.find(
      (item) =>
        String(item.id) === String(applicationId) ||
        String(item.regNo).toUpperCase() === String(applicationId).toUpperCase()
    );

    const regNo = String(app?.regNo || applicationId || "")
      .trim()
      .toUpperCase();

    if (regNo) {
      window.history.pushState(
        {},
        "",
        `/vendor-registration/${encodeURIComponent(regNo)}`
      );

      setRouteRegNo(regNo);
      setRouteApprovedVendorCode("");
    }

    setCurrentUser(null);
    setLoginError("");
    setLoginNotice("");
    setSelectedVendorApplicationId(app?.id || regNo);
    setCurrentView("vendorAccountSetup");
  };

  const handleTemporaryVendorLogin = async ({ regNo, accessKey }) => {
    const cleanRegNo = String(regNo || "").trim().toUpperCase();
    const cleanAccessKey = String(accessKey || "").trim().toUpperCase();

    if (!cleanRegNo || !cleanAccessKey) {
      return {
        success: false,
        message: "Registration No. and Access Key are required.",
      };
    }

    setLoginLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/vendor-portal/temporary-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            reg_no: cleanRegNo,
            access_key: cleanAccessKey,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        return {
          success: false,
          message: result.message || "Invalid Registration No. or Access Key.",
        };
      }

      const verifiedApplication = normalizeApplicationFromApi(result, {
        regNo: cleanRegNo,
        status: "PRE-REGISTERED",
      });

      upsertVendorApplication(verifiedApplication);

      setCurrentUser({
        type: "vendor",
        role: "VENDOR",
        user_code: cleanRegNo,
        user_name: verifiedApplication.vendorName || "Vendor",
        vendorApplicationId: verifiedApplication.id,
      });

      setSelectedVendorApplicationId(verifiedApplication.id);
      setRouteRegNo(cleanRegNo);
      setRouteApprovedVendorCode("");
      setCurrentView("vendorRegistration");

      return {
        success: true,
        data: verifiedApplication,
      };
    } catch (error) {
      console.error("Temporary vendor login error:", error);

      return {
        success: false,
        message: "Unable to verify vendor access. Please check Laravel API.",
      };
    } finally {
      setLoginLoading(false);
    }
  };

  const handleApprovedVendorAccess = async ({ vendorCode, accessKey }) => {
    const cleanVendorCode = String(vendorCode || "").trim().toUpperCase();
    const cleanAccessKey = String(accessKey || "").trim().toUpperCase();

    if (!cleanVendorCode || !cleanAccessKey) {
      return {
        success: false,
        message: "Vendor Code and Access Key are required.",
      };
    }

    setLoginLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/vendor-portal/approved-vendor-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            vendor_code: cleanVendorCode,
            access_key: cleanAccessKey,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        return {
          success: false,
          message: result.message || "Invalid Vendor Code or Access Key.",
        };
      }

      const vendor = {
        ...(result.data || {}),
        vendorCode:
          result.data?.vendorCode ||
          result.data?.vendor_code ||
          cleanVendorCode,
      };

      setApprovedVendor(vendor);
      setCurrentUser({
        type: "approvedVendor",
        role: "APPROVED_VENDOR",
        user_code: vendor.vendorCode,
        user_name:
          vendor.vendorName ||
          vendor.vendor_name ||
          vendor.vendorCode ||
          cleanVendorCode,
        vendorCode: vendor.vendorCode,
      });
      setRouteApprovedVendorCode(vendor.vendorCode);
      setCurrentView("vendorDashboard");

      return {
        success: true,
        data: vendor,
      };
    } catch (error) {
      console.error("Approved vendor access error:", error);

      return {
        success: false,
        message:
          "Unable to verify approved vendor access. Please check Laravel API.",
      };
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVendorRegistrationSubmit = async (
    applicationId,
    vendorInfo,
    uploads
  ) => {
    const app = vendorApplications.find(
      (item) =>
        String(item.id) === String(applicationId) ||
        String(item.regNo).toUpperCase() === String(applicationId).toUpperCase()
    );

    const regNo = app?.regNo || currentUser?.user_code || routeRegNo || "";

    const formData = new FormData();

    formData.append("vendor_pre_registration_id", applicationId);
    formData.append("reg_no", regNo);

    Object.entries(vendorInfo || {}).forEach(([key, value]) => {
      formData.append(`vendor_info[${key}]`, value ?? "");
    });

    Object.entries(uploads || {}).forEach(([docCode, upload]) => {
      if (upload?.file instanceof File) {
        formData.append(`documents[${docCode}]`, upload.file);
        formData.append(`document_names[${docCode}]`, upload.docName || "");
      }
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/vendor-portal/vendor-registration/submit`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formData,
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        alert(result.message || "Unable to submit vendor registration.");
        return false;
      }

      const uploadedDocuments = normalizeUploadedDocuments(
        result.data?.uploadedDocuments ||
          result.data?.uploaded_documents ||
          result.data?.uploads ||
          {}
      );

      const updatedApplication = normalizeApplicationFromApi(result, {
        ...(app || {}),
        id: applicationId,
        regNo,
        vendorName: vendorInfo.vendorName,
        vendorEmail: vendorInfo.email,
        contactPerson: vendorInfo.contactPerson,
        contactNo: vendorInfo.contactNo,
        vendorInfo,
        uploads: uploadedDocuments,
        uploadedDocuments,
        status: "FOR ACCREDITATION",
        submittedAt: new Date().toLocaleString(),
        procurementAllowed: false,
        emailLogs: [
          {
            id: `${Date.now()}-submit`,
            date: new Date().toLocaleString(),
            type: "Submission Notice",
            to: "Accreditation Approver",
            subject: `Vendor Application for Review - ${regNo}`,
            body: `${vendorInfo.vendorName} submitted registration details and documents for accreditation review.`,
          },
          ...(app?.emailLogs || []),
        ],
      });

      upsertVendorApplication({
        ...updatedApplication,
        status: "FOR ACCREDITATION",
        submittedAt: new Date().toLocaleString(),
        uploads: uploadedDocuments,
        uploadedDocuments,
      });

      await fetchVendorApplications();

      setLoginNotice("Vendor registration submitted for accreditation review.");

      return true;
    } catch (error) {
      console.error("Vendor registration submit error:", error);
      alert("Unable to connect to vendor registration API.");

      return false;
    }
  };

  const handleAccreditationAction = async (applicationId, action, remarks) => {
    const app = vendorApplications.find(
      (item) =>
        String(item.id) === String(applicationId) ||
        String(item.regNo).toUpperCase() === String(applicationId).toUpperCase()
    );

    const payload = {
      vendor_pre_registration_id: applicationId,
      reg_no: app?.regNo || applicationId,
      action,
      remarks,
      reviewed_by: currentUser?.user_code || "SYSTEM",
    };

    console.log("VENDOR ACCREDITATION PAYLOAD:", payload);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/vendor-portal/accreditation/action`,
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
        alert(
          `${result.message || "Unable to save accreditation action."}\n\n${
            result.error || ""
          }`
        );

        return false;
      }

      const data = result.data || {};
      const now = new Date().toLocaleString();
      const cleanRemarks = String(remarks || "").trim();

      setVendorApplications((prev) =>
        prev.map((item) => {
          const isTarget =
            String(item.id) === String(applicationId) ||
            String(item.regNo).toUpperCase() ===
              String(app?.regNo || applicationId).toUpperCase();

          if (!isTarget) return item;

          let status = data.status || item.status;
          let vendorMasterCreated = item.vendorMasterCreated || false;
          let vendorCode =
            data.vendor_code ||
            data.vendorCode ||
            item.vendorCode ||
            item.vendCode ||
            "";
          let procurementAllowed = item.procurementAllowed || false;
          let logType = "Accreditation Feedback";
          let subject = "";
          let body = cleanRemarks;
          let approvedAccessLink =
            data.approved_access_link ||
            data.approvedAccessLink ||
            item.approvedAccessLink ||
            "";

          if (action === "approve") {
            status = data.status || "APPROVED";

            vendorMasterCreated =
              data.vendor_master_created ??
              data.vendorMasterCreated ??
              true;

            procurementAllowed =
              data.procurement_allowed ?? data.procurementAllowed ?? true;

            logType = "Approval Notice";
            subject = `Vendor Accreditation Approved - ${item.regNo}`;

            body = `Your accreditation has been approved.

Vendor Code: ${vendorCode || "-"}
Vendor Name: ${item.vendorInfo?.vendorName || item.vendorName || "-"}
Approved Access Link: ${approvedAccessLink || "-"}`;
          }

          if (action === "reject") {
            status = data.status || "REJECTED";
            vendorMasterCreated = false;
            procurementAllowed = false;
            subject = `Vendor Accreditation Rejected - ${item.regNo}`;
            body = cleanRemarks;
            approvedAccessLink = "";
          }

          if (action === "return") {
            status = data.status || "RETURNED FOR CORRECTION";
            vendorMasterCreated = false;
            procurementAllowed = false;
            logType = "Correction Request";
            subject = `Vendor Registration Returned for Correction - ${item.regNo}`;
            body = cleanRemarks;
            approvedAccessLink = "";
          }

          return {
            ...item,
            status,
            reviewedAt: data.reviewedAt || now,
            accreditationRemarks:
              cleanRemarks ||
              data.remarks ||
              (action === "approve"
                ? "Approved for vendor accreditation."
                : item.accreditationRemarks || ""),
            vendorMasterCreated,
            vendorCode,
            approvedAccessLink,
            procurementAllowed,
            emailLogs: [
              {
                id: `${Date.now()}-${action}`,
                date: now,
                type: logType,
                to: item.vendorInfo?.email || item.vendorEmail,
                subject,
                body,
              },
              ...(item.emailLogs || []),
            ],
          };
        })
      );

      await fetchVendorApplications();

      if (action === "approve") {
        const approvalEmailSent =
          data.approval_email_sent ?? data.approvalEmailSent ?? null;

        const approvalEmailMessage =
          data.approvalEmailMessage ||
          data.approval_email_message ||
          "";

        if (approvalEmailSent === false) {
          alert(
            approvalEmailMessage ||
              "Vendor was approved, but the approval email failed to send."
          );
        }
      }

      return true;
    } catch (error) {
      console.error("Accreditation action API error:", error);
      alert("Unable to connect to accreditation API.");

      return false;
    }
  };

  if (currentView === "login") {
    return (
      <VendorLogin
        form={loginForm}
        setForm={setLoginForm}
        onSubmit={handleLoginSubmit}
        error={loginError}
        notice={loginNotice}
        loading={loginLoading}
        latestVendorAccess={latestVendorAccess}
      />
    );
  }

  if (currentView === "internalPortal") {
    const displayUser = currentUser?.user_name || currentUser?.user_code || "User";
    const displayRole = currentUser?.role || "AUTHORIZED_USER";
    const displayBranch = currentUser?.branch_code || "HO";

    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                {/* <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0f2f57] text-base font-black text-white shadow-lg shadow-slate-300">
                  NAYSA
                </div> */}

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-black tracking-tight text-slate-950">
                      Supplier Onboarding Portal
                    </h1>

                    {/* <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-sky-700">
                      Internal
                    </span> */}
                  </div>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Manage supplier registration, accreditation review, and vendor access in one workspace.
                  </p>

                  {/* <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {displayUser}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {displayRole}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Branch: {displayBranch}
                    </span>
                  </div> */}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <PortalTabButton
                  active={internalTab === "preRegistration"}
                  title="Pre-registration"
                  subtitle={`${preRegisteredCount} waiting access`}
                  onClick={() => setInternalTab("preRegistration")}
                />

                <PortalTabButton
                  active={internalTab === "accreditation"}
                  title="Accreditation"
                  subtitle={`${pendingAccreditationCount} pending review`}
                  badge={pendingAccreditationCount}
                  onClick={() => setInternalTab("accreditation")}
                />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <PortalStatCard
                label="Total Applications"
                value={vendorApplications.length}
                hint="All registration records"
              />
              <PortalStatCard
                label="Pre-registered"
                value={preRegisteredCount}
                hint="Access link generated"
              />
              <PortalStatCard
                label="Pending Review"
                value={pendingAccreditationCount}
                hint="Needs accreditation action"
              />
              <PortalStatCard
                label="Approved"
                value={approvedVendorCount}
                hint={`${returnedVendorCount} returned/rejected`}
              />
            </div> */}
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1680px] px-4 pb-8 pt-5 md:px-6 lg:px-8">
          <div className="mb-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {/* <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-sky-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
              {/* <div> */}
                {/* <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                  Current Workspace
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-900">
                  {internalTab === "preRegistration"
                    ? "Vendor Pre-registration"
                    : "Accreditation Approval"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {internalTab === "preRegistration"
                    ? "Create vendor access, choose required documents, and open registration links."
                    : "Review submitted vendor profiles and approve, reject, or return for correction."}
                </p>
              </div> */} 

              {/* <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={fetchVendorApplications}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Refresh Records
                </button>

                <button
                  type="button"
                  onClick={fetchAccreditationDocuments}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Refresh Documents
                </button>
              </div> */}
            {/* </div> */}

            <div className="[&>div]:min-h-0 [&>div]:bg-transparent [&_main]:max-w-none [&_main]:px-5 [&_main]:py-5 md:[&_main]:px-5 lg:[&_main]:px-5">
              {internalTab === "preRegistration" && (
                <VendorPreRegistration
                  currentUser={currentUser}
                  applications={vendorApplications}
                  requiredDocuments={documentMaster}
                  documentsLoading={documentsLoading}
                  onRefreshDocuments={fetchAccreditationDocuments}
                  onCreate={handleCreatePreRegistration}
                  onOpenRegistrationLink={handleOpenRegistrationLink}
                  onLogout={handleLogout}
                />
              )}

              {internalTab === "accreditation" && (
                <VendorAccreditation
                  currentUser={currentUser}
                  applications={accreditationApplications}
                  requiredDocuments={documentMaster}
                  onAction={handleAccreditationAction}
                  onLogout={handleLogout}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "approvedVendorAccess") {
    return (
      <VendorApprovedAccess
        vendorCode={routeApprovedVendorCode}
        loading={loginLoading}
        onSubmit={handleApprovedVendorAccess}
        onBackToLogin={handleLogout}
      />
    );
  }

  if (currentView === "vendorDashboard") {
    return (
      <VendorDashboard
        vendor={approvedVendor}
        onOpenCanvass={() => setCurrentView("vendorCanvassTable")}
        onOpenAwardedPo={() => alert("Awarded PO is not yet available.")}
        onLogout={handleLogout}
      />
    );
  }

  if (currentView === "vendorCanvassTable") {
  return (
    <VendorCanvassTable
      vendor={approvedVendor}
      onRowClick={(selectedCanvass) => {
        setSelectedCanvass(selectedCanvass);
        setCurrentView("vendorCanvass");
      }}
      onBackToDashboard={() => setCurrentView("vendorDashboard")}
      onLogout={handleLogout}
    />
  );
}

  if (currentView === "vendorCanvass") {
  return (
    <VendorCanvass
      vendor={approvedVendor}
      selectedCanvass={selectedCanvass}
      onBackToDashboard={() => setCurrentView("vendorCanvassTable")}
      onLogout={handleLogout}
    />
  );
}

  if (currentView === "vendorAccountSetup") {
    const application =
      vendorApplications.find(
        (app) =>
          String(app.id) === String(selectedVendorApplicationId) ||
          String(app.regNo).toUpperCase() ===
            String(selectedVendorApplicationId).toUpperCase() ||
          String(app.regNo).toUpperCase() === String(routeRegNo).toUpperCase()
      ) ||
      (routeRegNo
        ? {
            id: routeRegNo,
            regNo: routeRegNo,
            status: "PRE-REGISTERED",
          }
        : null);

    return (
      <VendorTemporaryAccountRegistration
        application={application}
        loading={loginLoading}
        onSubmit={handleTemporaryVendorLogin}
        onBackToLogin={handleLogout}
      />
    );
  }

  if (currentView === "vendorRegistration") {
    const vendorApplication =
      vendorApplications.find(
        (app) =>
          String(app.id) === String(currentUser?.vendorApplicationId) ||
          String(app.regNo).toUpperCase() ===
            String(currentUser?.user_code).toUpperCase() ||
          String(app.regNo).toUpperCase() === String(routeRegNo).toUpperCase()
      ) ||
      (routeRegNo
        ? {
            id: currentUser?.vendorApplicationId || routeRegNo,
            regNo: routeRegNo,
            status: "PRE-REGISTERED",
            vendorInfo: {
              ...initialVendorInfo,
            },
            requiredDocuments: [],
            uploads: {},
            uploadedDocuments: {},
          }
        : null);

    return (
      <VendorRegistration
        mode="registration"
        currentUser={currentUser}
        application={vendorApplication}
        requiredDocuments={vendorApplication?.requiredDocuments || []}
        onSubmit={handleVendorRegistrationSubmit}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}


function PortalTabButton({ active, title, subtitle, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-w-[190px] items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm transition ${
        active
          ? "border-[#0f2f57] bg-[#0f2f57] text-white shadow-slate-300"
          : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50"
      }`}
    >
      <span>
        <span className="block text-sm font-black">{title}</span>
        <span
          className={`mt-0.5 block text-[11px] font-bold ${
            active ? "text-white/75" : "text-slate-400 group-hover:text-sky-700"
          }`}
        >
          {subtitle}
        </span>
      </span>

      {badge !== undefined && (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-black ${
            active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function PortalStatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-2xl font-black tracking-tight text-slate-900">
          {value}
        </p>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
          Live
        </span>
      </div>
      <p className="mt-1 truncate text-xs font-medium text-slate-500">
        {hint}
      </p>
    </div>
  );
}

