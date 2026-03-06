import QRCodeLib from 'qrcode';
import { getTrackingUrl } from '@/lib/qr-url';

interface PrintStep {
  stepCode: string;
  step_type: string;
  address: string;
  contact_name: string;
  contact_phone: string;
  notes: string;
  package_qty: number;
  statusName: string;
}

interface PrintOrder {
  orderCode: string;
  description: string;
  customerName: string;
  customerLastname: string;
  customerPhone: string;
  customerEmail?: string;
  notes: string;
  steps: PrintStep[];
}

async function generateQRDataUrl(code: string, size = 200): Promise<string> {
  const url = getTrackingUrl(code);
  return QRCodeLib.toDataURL(url, { width: size, margin: 1 });
}

export async function printLabels(order: PrintOrder) {
  const labels: { stepCode: string; address: string; contactName: string; contactPhone: string; notes: string; orderCode: string; qrDataUrl: string; labelIndex: number; totalLabels: number }[] = [];

  for (const step of order.steps) {
    if (step.step_type === 'origin') continue;
    const qty = step.package_qty || 1;
    const qrDataUrl = await generateQRDataUrl(step.stepCode, 200);
    for (let i = 0; i < qty; i++) {
      labels.push({
        stepCode: step.stepCode,
        address: step.address,
        contactName: step.contact_name,
        contactPhone: step.contact_phone,
        notes: step.notes,
        orderCode: order.orderCode,
        qrDataUrl,
        labelIndex: i + 1,
        totalLabels: qty,
      });
    }
  }

  const labelsHtml = labels.map((l) => `
    <div class="label">
      <div class="label-header">
        <strong>LOMANDO</strong>
        <span class="order-code">${l.orderCode}</span>
      </div>
      <div class="label-body">
        <div class="qr-section">
          <img src="${l.qrDataUrl}" width="140" height="140" />
          <div class="step-code">${l.stepCode}</div>
        </div>
        <div class="info-section">
          <div class="address">${l.address}</div>
          <div class="contact">${l.contactName}${l.contactPhone ? ' - ' + l.contactPhone : ''}</div>
          ${l.notes ? `<div class="notes">${l.notes}</div>` : ''}
          <div class="pkg-info">Bulto ${l.labelIndex} de ${l.totalLabels}</div>
        </div>
      </div>
    </div>
  `).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
    <head>
      <title>Etiquetas - ${order.orderCode}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; }
        .label {
          width: 10cm;
          height: 6cm;
          border: 2px solid #000;
          padding: 8px;
          page-break-after: always;
          margin: 10px auto;
          display: flex;
          flex-direction: column;
        }
        .label:last-child { page-break-after: auto; }
        .label-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #000;
          padding-bottom: 4px;
          margin-bottom: 6px;
          font-size: 14px;
        }
        .order-code { font-family: monospace; font-size: 12px; }
        .label-body {
          display: flex;
          gap: 10px;
          flex: 1;
        }
        .qr-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .step-code {
          font-family: monospace;
          font-size: 10px;
          font-weight: bold;
        }
        .info-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .address { font-size: 14px; font-weight: bold; }
        .contact { font-size: 12px; color: #333; }
        .notes { font-size: 11px; color: #666; font-style: italic; }
        .pkg-info {
          margin-top: auto;
          font-size: 13px;
          font-weight: bold;
          background: #000;
          color: #fff;
          padding: 2px 8px;
          text-align: center;
        }
        @media print {
          body { margin: 0; }
          .label { margin: 0; border-width: 1px; }
        }
      </style>
    </head>
    <body>${labelsHtml}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

export async function printRoute(order: PrintOrder) {
  const orderQr = await generateQRDataUrl(order.orderCode, 180);
  const stepQrs: { [code: string]: string } = {};

  for (const step of order.steps) {
    if (step.stepCode) {
      stepQrs[step.stepCode] = await generateQRDataUrl(step.stepCode, 120);
    }
  }

  const stepsHtml = order.steps.map((step, i) => `
    <tr>
      <td style="vertical-align:top;padding:8px;border-bottom:1px solid #ddd;">
        ${step.stepCode && stepQrs[step.stepCode] ? `<img src="${stepQrs[step.stepCode]}" width="80" height="80" />` : ''}
      </td>
      <td style="vertical-align:top;padding:8px;border-bottom:1px solid #ddd;">
        <strong>${i + 1}. ${step.step_type === 'origin' ? 'ORIGEN' : 'DESTINO'}</strong>
        ${step.stepCode ? `<span style="font-family:monospace;font-size:11px;color:#666;"> (${step.stepCode})</span>` : ''}<br/>
        <span style="font-size:14px;">${step.address}</span><br/>
        ${step.contact_name ? `<span style="font-size:12px;color:#555;">📞 ${step.contact_name} - ${step.contact_phone || ''}</span><br/>` : ''}
        ${step.package_qty > 0 ? `<span style="font-size:12px;">📦 ${step.package_qty} bulto(s)</span><br/>` : ''}
        ${step.notes ? `<span style="font-size:11px;color:#888;font-style:italic;">📝 ${step.notes}</span>` : ''}
        <br/><span style="font-size:11px;background:#eee;padding:2px 6px;border-radius:4px;">${step.statusName}</span>
      </td>
    </tr>
  `).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
    <head>
      <title>Hoja de Ruta - ${order.orderCode}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        @media print { body { padding: 10px; } }
      </style>
    </head>
    <body>
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #000;padding-bottom:10px;margin-bottom:15px;">
        <div>
          <h1 style="margin:0;font-size:22px;">HOJA DE RUTA</h1>
          <h2 style="margin:0;font-size:16px;color:#0284c7;font-family:monospace;">${order.orderCode}</h2>
          <p style="margin:4px 0 0;font-size:13px;color:#666;">${new Date().toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
        </div>
        <div style="text-align:center;">
          <img src="${orderQr}" width="120" height="120" />
          <div style="font-size:10px;font-family:monospace;">${order.orderCode}</div>
        </div>
      </div>

      <div style="background:#f8f8f8;padding:10px;border-radius:6px;margin-bottom:15px;">
        <strong>Cliente:</strong> ${order.customerName} ${order.customerLastname}<br/>
        <strong>Tel:</strong> ${order.customerPhone}
        ${order.notes ? `<br/><strong>Notas:</strong> ${order.notes}` : ''}
      </div>

      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#0284c7;color:#fff;">
            <th style="padding:8px;width:100px;text-align:left;">QR</th>
            <th style="padding:8px;text-align:left;">Detalle</th>
          </tr>
        </thead>
        <tbody>
          ${stepsHtml}
        </tbody>
      </table>

      <div style="margin-top:20px;border-top:2px solid #000;padding-top:10px;">
        <table style="width:100%;">
          <tr>
            <td style="width:50%;padding:8px;">
              <strong>Firma Receptor:</strong><br/><br/>
              _____________________________
            </td>
            <td style="width:50%;padding:8px;">
              <strong>DNI/CI:</strong><br/><br/>
              _____________________________
            </td>
          </tr>
          <tr>
            <td style="padding:8px;">
              <strong>Hora Entrega:</strong><br/><br/>
              _____________________________
            </td>
            <td style="padding:8px;">
              <strong>Observaciones:</strong><br/><br/>
              _____________________________
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin-top:15px;font-size:11px;color:#999;">
        Lomando — Sistema de Tracking de Envíos
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}
