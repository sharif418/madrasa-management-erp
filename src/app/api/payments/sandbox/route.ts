import { db } from "@/lib/db";

// GET — sandbox payment simulation page (replaces SSLCommerz gateway in dev)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session = searchParams.get("session") ?? "";
  const amount = searchParams.get("amount") ?? "0";
  const ref = searchParams.get("ref") ?? "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Gateway (Sandbox) — Madaris ERP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0fdf4; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .card { background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); max-width: 420px; width: 100%; overflow: hidden; }
    .header { background: linear-gradient(135deg, #059669, #0d9488); padding: 1.5rem; text-align: center; color: white; }
    .header h1 { font-size: 1.25rem; font-weight: 700; }
    .header p { font-size: 0.75rem; opacity: 0.8; margin-top: 0.25rem; }
    .body { padding: 1.5rem; }
    .amount { text-align: center; margin-bottom: 1.5rem; }
    .amount .label { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .amount .value { font-size: 2rem; font-weight: 800; color: #059669; }
    .methods { display: grid; gap: 0.75rem; }
    .method { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border: 2px solid #e5e7eb; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: white; }
    .method:hover { border-color: #059669; background: #f0fdf4; }
    .method .icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .method .info { flex: 1; }
    .method .info .name { font-weight: 600; font-size: 0.875rem; }
    .method .info .desc { font-size: 0.75rem; color: #6b7280; }
    .btn { width: 100%; padding: 0.875rem; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; margin-top: 1rem; }
    .btn-pay { background: #059669; color: white; }
    .btn-pay:hover { background: #047857; }
    .btn-cancel { background: #f3f4f6; color: #6b7280; }
    .sandbox-badge { background: #fef3c7; color: #92400e; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.625rem; font-weight: 700; text-transform: uppercase; display: inline-block; margin-top: 0.5rem; }
    .ref { font-size: 0.625rem; color: #9ca3af; text-align: center; margin-top: 1rem; font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Secure Payment</h1>
      <p>Madaris ERP Payment Gateway</p>
      <div class="sandbox-badge">Sandbox Mode</div>
    </div>
    <div class="body">
      <div class="amount">
        <div class="label">Amount to Pay</div>
        <div class="value">৳${Number(amount).toLocaleString("en-IN")}</div>
      </div>
      <div class="methods">
        <div class="method" onclick="selectMethod('bkash')">
          <div class="icon" style="background:#e2136e20;color:#e2136e">📱</div>
          <div class="info"><div class="name">bKash</div><div class="desc">Mobile Banking</div></div>
        </div>
        <div class="method" onclick="selectMethod('nagad')">
          <div class="icon" style="background:#f59e0b20;color:#f59e0b">💳</div>
          <div class="info"><div class="name">Nagad</div><div class="desc">Mobile Banking</div></div>
        </div>
        <div class="method" onclick="selectMethod('card')">
          <div class="icon" style="background:#0284c720;color:#0284c7">🏦</div>
          <div class="info"><div class="name">Card</div><div class="desc">Visa / Mastercard</div></div>
        </div>
      </div>
      <button class="btn btn-pay" id="payBtn" onclick="pay()">Pay ৳${Number(amount).toLocaleString("en-IN")}</button>
      <button class="btn btn-cancel" onclick="cancel()">Cancel Payment</button>
      <div class="ref">Session: ${session} · Ref: ${ref}</div>
    </div>
  </div>
  <script>
    let selectedMethod = 'bkash';
    function selectMethod(m) { selectedMethod = m; document.querySelectorAll('.method').forEach(el => el.style.borderColor = '#e5e7eb'); event.currentTarget.style.borderColor = '#059669'; }
    function pay() {
      document.getElementById('payBtn').textContent = 'Processing...';
      document.getElementById('payBtn').disabled = true;
      setTimeout(() => {
        window.location.href = '/api/payments/success?ref=${ref}&opt_a=${searchParams.get("opt_a") ?? ""}&opt_b=${searchParams.get("opt_b") ?? ""}&opt_c=${searchParams.get("opt_c") ?? ""}&opt_d=${searchParams.get("opt_d") ?? ""}&amount=${amount}';
      }, 1500);
    }
    function cancel() {
      window.location.href = '/api/payments/fail?ref=${ref}&cancelled=true';
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
