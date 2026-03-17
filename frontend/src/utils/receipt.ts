import type { Session, Order, EODReport } from "../types";

const paymentLabels: Record<string, string> = {
  cash: "Cash",
  qris: "QRIS",
  bank_transfer: "Bank Transfer",
  e_wallet: "E-Wallet",
};

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

function buildItemsTable(items: { name: string; qty: number; price: number; subtotal: number }[]): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:4px 0;border-bottom:1px solid #eee">${item.name}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center">${item.qty}</td>
        <td style="padding:4px 0;border-bottom:1px solid #eee;text-align:right">${formatCurrency(item.price)}</td>
        <td style="padding:4px 0;border-bottom:1px solid #eee;text-align:right">${formatCurrency(item.subtotal)}</td>
      </tr>`
    )
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin:12px 0">
      <thead>
        <tr style="border-bottom:2px solid #333">
          <th style="text-align:left;padding:4px 0;font-size:11px;text-transform:uppercase;color:#666">Item</th>
          <th style="text-align:center;padding:4px 8px;font-size:11px;text-transform:uppercase;color:#666">Qty</th>
          <th style="text-align:right;padding:4px 0;font-size:11px;text-transform:uppercase;color:#666">Price</th>
          <th style="text-align:right;padding:4px 0;font-size:11px;text-transform:uppercase;color:#666">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildTotalsSection(lines: { label: string; value: string; bold?: boolean }[]): string {
  return lines
    .map(
      (line) => `
      <div style="display:flex;justify-content:space-between;padding:4px 0;${line.bold ? "font-weight:700;font-size:16px;border-top:2px solid #333;margin-top:4px;padding-top:8px" : ""}">
        <span>${line.label}</span>
        <span>${line.value}</span>
      </div>`
    )
    .join("");
}

function openPrintWindow(html: string) {
  const win = window.open("", "_blank", "width=400,height=600");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.print();
    win.onafterprint = () => win.close();
  };
}

function wrapReceipt(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Receipt - Bill House</title>
  <style>
    @media print {
      body { margin: 0; }
      @page { margin: 10mm; size: 80mm auto; }
    }
  </style>
</head>
<body style="font-family:'Courier New',monospace;max-width:300px;margin:0 auto;padding:16px;font-size:13px;color:#333">
  <div style="text-align:center;margin-bottom:16px">
    <div style="font-size:20px;font-weight:700;letter-spacing:1px">BILL HOUSE</div>
    <div style="font-size:11px;color:#666;margin-top:4px">Billiard &amp; Lounge</div>
    <div style="border-bottom:2px dashed #ccc;margin-top:12px"></div>
  </div>
  ${content}
  <div style="border-top:2px dashed #ccc;margin-top:16px;padding-top:12px;text-align:center">
    <div style="font-size:11px;color:#666">Thank you for visiting!</div>
    <div style="font-size:10px;color:#999;margin-top:4px">Bill House - Billiard POS</div>
  </div>
</body>
</html>`;
}

export function printSessionReceipt(session: Session) {
  const allItems = session.orders.flatMap((order) =>
    order.items.map((item) => ({
      name: item.menu_item.name,
      qty: item.quantity,
      price: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    }))
  );

  const fnbTotal = allItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tableCost = Number(session.table_cost);
  const pb1Tax = Math.round(fnbTotal * 0.1);
  const grandTotal = tableCost + fnbTotal + pb1Tax;

  const duration =
    session.start_time && session.end_time
      ? formatDuration(session.start_time, session.end_time)
      : "-";

  const content = `
    <div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#666">
        <span>Date</span>
        <span>${formatDate(session.end_time || session.created_at)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-top:2px">
        <span>Table</span>
        <span>#${session.table.number}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-top:2px">
        <span>Client</span>
        <span>${session.client.name}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-top:2px">
        <span>Duration</span>
        <span>${duration}</span>
      </div>
      ${session.payment_method ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-top:2px"><span>Payment</span><span>${paymentLabels[session.payment_method] || session.payment_method}</span></div>` : ""}
    </div>

    ${allItems.length > 0 ? `<div style="font-weight:600;font-size:12px;margin-bottom:4px">F&B Orders</div>${buildItemsTable(allItems)}` : ""}

    ${buildTotalsSection([
      { label: "Table Rental", value: formatCurrency(tableCost) },
      ...(allItems.length > 0
        ? [
            { label: "F&B Subtotal", value: formatCurrency(fnbTotal) },
            { label: "PB1 Tax (10%)", value: formatCurrency(pb1Tax) },
          ]
        : []),
      { label: "TOTAL", value: formatCurrency(grandTotal), bold: true },
    ])}
  `;

  openPrintWindow(wrapReceipt(content));
}

export function printOrderReceipt(order: Order) {
  const items = order.items.map((item) => ({
    name: item.menu_item.name,
    qty: item.quantity,
    price: Number(item.unit_price),
    subtotal: Number(item.subtotal),
  }));

  const fnbTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const pb1Tax = Math.round(fnbTotal * 0.1);
  const grandTotal = fnbTotal + pb1Tax;

  const content = `
    <div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#666">
        <span>Date</span>
        <span>${formatDate(order.created_at)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-top:2px">
        <span>Order</span>
        <span>#${order.id}</span>
      </div>
      ${order.customer_name ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-top:2px"><span>Customer</span><span>${order.customer_name}</span></div>` : ""}
      ${order.payment_method ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-top:2px"><span>Payment</span><span>${paymentLabels[order.payment_method] || order.payment_method}</span></div>` : ""}
    </div>

    ${buildItemsTable(items)}

    ${buildTotalsSection([
      { label: "Subtotal", value: formatCurrency(fnbTotal) },
      { label: "PB1 Tax (10%)", value: formatCurrency(pb1Tax) },
      { label: "TOTAL", value: formatCurrency(grandTotal), bold: true },
    ])}
  `;

  openPrintWindow(wrapReceipt(content));
}

export function printEODReport(report: EODReport) {
  const paymentRows = report.payment_breakdown
    .map(
      (pb) => `
      <tr>
        <td style="padding:4px 0;border-bottom:1px solid #eee">${paymentLabels[pb.method] || pb.method}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center">${pb.count}</td>
        <td style="padding:4px 0;border-bottom:1px solid #eee;text-align:right">${formatCurrency(pb.amount)}</td>
        <td style="padding:4px 0;border-bottom:1px solid #eee;text-align:right">${report.total_revenue > 0 ? ((pb.amount / report.total_revenue) * 100).toFixed(1) + "%" : "0%"}</td>
      </tr>`
    )
    .join("");

  const content = `
    <div style="text-align:center;margin-bottom:12px">
      <div style="font-size:14px;font-weight:700">END OF DAY REPORT</div>
      <div style="font-size:12px;color:#666;margin-top:4px">${report.date}</div>
    </div>
    <div style="border-bottom:1px dashed #ccc;margin-bottom:12px"></div>
    ${buildTotalsSection([
      { label: "Total Transactions", value: String(report.total_transactions) },
      { label: "Sessions", value: String(report.session_count) },
      { label: "Walk-in Orders", value: String(report.standalone_order_count) },
    ])}
    <div style="border-bottom:1px dashed #ccc;margin:12px 0"></div>
    ${buildTotalsSection([
      { label: "Table Revenue", value: formatCurrency(report.table_revenue) },
      { label: "F&B Revenue", value: formatCurrency(report.fnb_revenue) },
      { label: "Total Revenue", value: formatCurrency(report.total_revenue), bold: true },
    ])}
    <div style="border-bottom:1px dashed #ccc;margin:12px 0"></div>
    ${buildTotalsSection([
      { label: "PB1 Tax (10%)", value: formatCurrency(report.pb1_tax) },
      { label: "NET REVENUE", value: formatCurrency(report.net_revenue), bold: true },
    ])}
    ${report.payment_breakdown.length > 0 ? `
    <div style="border-bottom:1px dashed #ccc;margin:12px 0"></div>
    <div style="font-weight:600;font-size:12px;margin-bottom:4px">Payment Breakdown</div>
    <table style="width:100%;border-collapse:collapse;margin:8px 0">
      <thead>
        <tr style="border-bottom:2px solid #333">
          <th style="text-align:left;padding:4px 0;font-size:10px;text-transform:uppercase;color:#666">Method</th>
          <th style="text-align:center;padding:4px 8px;font-size:10px;text-transform:uppercase;color:#666">Txn</th>
          <th style="text-align:right;padding:4px 0;font-size:10px;text-transform:uppercase;color:#666">Amount</th>
          <th style="text-align:right;padding:4px 0;font-size:10px;text-transform:uppercase;color:#666">%</th>
        </tr>
      </thead>
      <tbody>${paymentRows}</tbody>
    </table>` : ""}
  `;

  openPrintWindow(wrapReceipt(content));
}
