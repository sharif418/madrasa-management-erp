// Fee receipt HTML template + inline i18n + money/date formatting helpers.
// Kept in a separate module so the API route stays under 150 lines.
export type ReceiptData = {
  tenantName: string;
  tenantAddress?: string | null;
  tenantPhone?: string | null;
  currency: string;
  locale: string;
  receiptNo: string;
  status: string;
  studentName: string;
  rollNo: string | null;
  className: string | null;
  feeType: string | null;
  method: string | null;
  date: Date;
  amount: number;
  paidAmount: number;
};

const I18N: Record<string, Record<string, string>> = {
  en: {
    receipt: "Receipt No", feeReceipt: "Fee Receipt", studentName: "Student Name",
    rollNo: "Roll No", class: "Class", feeType: "Fee Type", method: "Payment Method",
    date: "Date", description: "Description", amount: "Amount", total: "Total",
    paid: "Paid", due: "Due", grandTotal: "Amount Paid", authorizedBy: "Authorized Signature",
    generatedOn: "Generated on", fee: "Fee",
  },
  bn: {
    receipt: "রসিদ নং", feeReceipt: "ফি রসিদ", studentName: "ছাত্রের নাম",
    rollNo: "রোল নং", class: "শ্রেণী", feeType: "ফি ধরন", method: "পেমেন্ট মাধ্যম",
    date: "তারিখ", description: "বিবরণ", amount: "পরিমাণ", total: "মোট",
    paid: "পরিশোধিত", due: "বকেয়া", grandTotal: "পরিশোধিত পরিমাণ", authorizedBy: "অনুমোদিত স্বাক্ষর",
    generatedOn: "তৈরি হয়েছে", fee: "ফি",
  },
  ar: {
    receipt: "رقم الإيصال", feeReceipt: "إيصال الرسوم", studentName: "اسم الطالب",
    rollNo: "الرقم", class: "الفصل", feeType: "نوع الرسوم", method: "طريقة الدفع",
    date: "التاريخ", description: "الوصف", amount: "المبلغ", total: "الإجمالي",
    paid: "مدفوع", due: "المستحق", grandTotal: "المبلغ المدفوع", authorizedBy: "توقيع معتمد",
    generatedOn: "أُنشئ في", fee: "رسوم",
  },
};

function tr(locale: string, key: string): string {
  return (I18N[locale] && I18N[locale][key]) || I18N.en[key] || key;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function fmtDate(d: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(
      locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-GB",
      { year: "numeric", month: "long", day: "numeric" }
    ).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function fmtMoney(n: number, locale: string, currency: string): string {
  try {
    return new Intl.NumberFormat(
      locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US",
      { maximumFractionDigits: 0 }
    ).format(n || 0) + " " + (currency || "BDT");
  } catch {
    return String(n);
  }
}

export function renderReceiptHtml(d: ReceiptData): string {
  const rtl = d.locale === "ar";
  const due = Math.max(0, d.amount - d.paidAmount);
  const statusLabel: Record<string, string> = {
    paid: "Paid", partial: "Partial", pending: "Pending", overdue: "Overdue",
  };
  const fontFamily = rtl ? "'Amiri', serif" : "'Inter', system-ui, sans-serif";
  const align = rtl ? "right" : "left";
  const opposite = rtl ? "left" : "right";

  return `<!DOCTYPE html>
<html lang="${esc(d.locale)}" dir="${rtl ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8" />
<title>${esc(d.tenantName)} — ${tr(d.locale, "feeReceipt")} ${d.receiptNo}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { font-family: ${fontFamily}; margin: 0; padding: 24px; color: #0f172a; background: #fff; }
  .sheet { max-width: 800px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #10b981; }
  .brand { display: flex; gap: 12px; align-items: center; }
  .logo { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #10b981, #14b8a6); color: #fff; font-size: 22px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .brand h1 { margin: 0; font-size: 18px; font-weight: 700; }
  .brand p { margin: 2px 0 0; font-size: 12px; color: #64748b; }
  .receipt-meta { text-align: ${opposite}; font-size: 12px; color: #475569; }
  .receipt-meta .no { font-size: 14px; font-weight: 700; color: #0f172a; }
  .title { text-align: center; margin: 24px 0 20px; }
  .title h2 { margin: 0; font-size: 20px; color: #047857; letter-spacing: 0.5px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin: 20px 0; }
  .field { display: flex; flex-direction: column; }
  .field .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .field .value { font-size: 14px; font-weight: 500; color: #0f172a; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { padding: 10px 12px; text-align: ${align}; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
  th { background: #f0fdf4; color: #047857; font-weight: 600; }
  .totals { margin-top: 16px; margin-${opposite}: auto; width: 280px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .totals .row.paid { color: #047857; font-weight: 600; }
  .totals .row.due { color: ${due > 0 ? "#b91c1c" : "#475569"}; font-weight: 600; }
  .totals .row.grand { border-top: 2px solid #10b981; padding-top: 8px; margin-top: 4px; font-size: 15px; }
  .status-badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .status-paid { background: #d1fae5; color: #047857; }
  .status-partial { background: #fef3c7; color: #b45309; }
  .status-pending, .status-overdue { background: #fee2e2; color: #b91c1c; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
  .signature { margin-top: 32px; text-align: ${opposite}; }
  .signature .line { margin-top: 32px; border-top: 1px solid #475569; width: 180px; margin-${opposite}: auto; margin-${align}: 0; padding-top: 6px; font-size: 12px; color: #475569; }
  @media print {
    body { padding: 0; }
    .sheet { border: 0; box-shadow: none; max-width: 100%; padding: 0; }
    @page { size: A4; margin: 16mm; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        <div class="logo">M</div>
        <div>
          <h1>${esc(d.tenantName)}</h1>
          <p>${[d.tenantAddress, d.tenantPhone].filter(Boolean).map(esc).join(" · ")}</p>
        </div>
      </div>
      <div class="receipt-meta">
        <div class="no">${tr(d.locale, "receipt")}: #${esc(d.receiptNo)}</div>
        <div>${esc(fmtDate(d.date, d.locale))}</div>
        <div style="margin-top: 6px;">
          <span class="status-badge status-${esc(d.status)}">${esc(statusLabel[d.status] || d.status)}</span>
        </div>
      </div>
    </div>
    <div class="title"><h2>— ${tr(d.locale, "feeReceipt")} —</h2></div>
    <div class="grid">
      <div class="field"><span class="label">${tr(d.locale, "studentName")}</span><span class="value">${esc(d.studentName)}</span></div>
      <div class="field"><span class="label">${tr(d.locale, "rollNo")}</span><span class="value">${esc(d.rollNo || "—")}</span></div>
      <div class="field"><span class="label">${tr(d.locale, "class")}</span><span class="value">${esc(d.className || "—")}</span></div>
      <div class="field"><span class="label">${tr(d.locale, "feeType")}</span><span class="value">${esc(d.feeType || "—")}</span></div>
      <div class="field"><span class="label">${tr(d.locale, "method")}</span><span class="value">${esc(d.method || "—")}</span></div>
      <div class="field"><span class="label">${tr(d.locale, "date")}</span><span class="value">${esc(fmtDate(d.date, d.locale))}</span></div>
    </div>
    <table>
      <thead><tr><th>${tr(d.locale, "description")}</th><th style="text-align: ${opposite};">${tr(d.locale, "amount")}</th></tr></thead>
      <tbody><tr><td>${esc(d.feeType || tr(d.locale, "fee"))}</td><td style="text-align: ${opposite};">${esc(fmtMoney(d.amount, d.locale, d.currency))}</td></tr></tbody>
    </table>
    <div class="totals">
      <div class="row"><span>${tr(d.locale, "total")}</span><span>${esc(fmtMoney(d.amount, d.locale, d.currency))}</span></div>
      <div class="row paid"><span>${tr(d.locale, "paid")}</span><span>${esc(fmtMoney(d.paidAmount, d.locale, d.currency))}</span></div>
      <div class="row due"><span>${tr(d.locale, "due")}</span><span>${esc(fmtMoney(due, d.locale, d.currency))}</span></div>
      <div class="row grand"><span>${tr(d.locale, "grandTotal")}</span><span>${esc(fmtMoney(d.paidAmount, d.locale, d.currency))}</span></div>
    </div>
    <div class="signature"><div class="line">${tr(d.locale, "authorizedBy")}</div></div>
    <div class="footer">
      <span>${tr(d.locale, "generatedOn")}: ${esc(fmtDate(new Date(), d.locale))}</span>
      <span>${esc(d.receiptNo)}</span>
    </div>
  </div>
  <script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 400); });</script>
</body>
</html>`;
}
