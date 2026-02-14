const APP_URL = 'https://credi-red.vercel.app';

// ─── Helpers ────────────────────────────────────────────────────

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function greenButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
      <tr>
        <td style="background:#10B981;border-radius:8px;">
          <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;font-family:Arial,sans-serif;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

function infoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 12px;font-weight:bold;color:#374151;border-bottom:1px solid #E5E7EB;width:40%;">${label}</td>
      <td style="padding:8px 12px;color:#1F2937;border-bottom:1px solid #E5E7EB;">${value}</td>
    </tr>`;
}

interface SaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

function itemsTable(items: SaleItem[], total: number): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;">${item.productName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;text-align:right;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;text-align:right;">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #E5E7EB;border-radius:8px;border-collapse:collapse;">
      <tr style="background:#F9FAFB;">
        <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Producto</th>
        <th style="padding:10px 12px;text-align:center;font-size:13px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Cant.</th>
        <th style="padding:10px 12px;text-align:right;font-size:13px;color:#6B7280;border-bottom:2px solid #E5E7EB;">P. Unit.</th>
        <th style="padding:10px 12px;text-align:right;font-size:13px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Subtotal</th>
      </tr>
      ${rows}
      <tr style="background:#F0FDF4;">
        <td colspan="3" style="padding:10px 12px;font-weight:bold;color:#065F46;">Total</td>
        <td style="padding:10px 12px;text-align:right;font-weight:bold;color:#065F46;font-size:16px;">$${total.toFixed(2)} USD</td>
      </tr>
    </table>`;
}

function signature(): string {
  return `
    <p style="margin-top:32px;color:#6B7280;font-size:14px;">— El equipo de CrediRed</p>`;
}

// ─── Layout base ────────────────────────────────────────────────

function emailLayout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#10B981;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">Credi<span style="color:#D1FAE5;">Red</span></h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;color:#1F2937;font-size:15px;line-height:1.6;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;padding:20px 32px;text-align:center;border-top:1px solid #E5E7EB;">
              <p style="margin:0;font-size:13px;color:#9CA3AF;">&copy; 2026 CrediRed &mdash; Gestión de ventas y créditos</p>
              <p style="margin:8px 0 0;font-size:13px;"><a href="${APP_URL}" style="color:#10B981;text-decoration:none;">${APP_URL.replace('https://', '')}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Types ──────────────────────────────────────────────────────

interface EmailResult {
  subject: string;
  html: string;
}

interface CreditTerm {
  unit: string;
  quantity: number;
  dueDate: string | Date;
}

// ─── 7 Email Templates ─────────────────────────────────────────

// 1. Bienvenida
export function welcomeEmail({ name }: { name: string }): EmailResult {
  const body = `
    <h2 style="margin:0 0 16px;color:#065F46;font-size:22px;">¡Bienvenido a CrediRed, ${name}!</h2>
    <p>Tu cuenta ha sido creada exitosamente. Tienes <strong>15 días de prueba gratuita</strong> para explorar todas las funcionalidades:</p>
    <ul style="padding-left:20px;color:#374151;">
      <li style="margin-bottom:8px;">📦 Gestión de inventario y productos</li>
      <li style="margin-bottom:8px;">💰 Registro de ventas al detal y a crédito</li>
      <li style="margin-bottom:8px;">👥 Red de distribución multinivel</li>
      <li style="margin-bottom:8px;">📊 Dashboard con métricas en tiempo real</li>
      <li style="margin-bottom:8px;">💵 Soporte multimoneda (USD, COP, VES)</li>
    </ul>
    ${greenButton('Ir a CrediRed', APP_URL)}
    ${signature()}`;
  return {
    subject: `Bienvenido a CrediRed, ${name}`,
    html: emailLayout('Bienvenido a CrediRed', body)
  };
}

// 2. Recuperar contraseña
export function resetPasswordEmail({ name, resetUrl }: { name: string; resetUrl: string }): EmailResult {
  const body = `
    <h2 style="margin:0 0 16px;color:#065F46;font-size:22px;">Recuperar contraseña</h2>
    <p>Hola <strong>${name}</strong>,</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en CrediRed. Haz clic en el botón para crear una nueva contraseña:</p>
    ${greenButton('Restablecer contraseña', resetUrl)}
    <p style="background:#FEF3C7;padding:12px 16px;border-radius:8px;color:#92400E;font-size:13px;">
      ⏱ Este enlace expira en <strong>30 minutos</strong>. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
    </p>
    ${signature()}`;
  return {
    subject: 'CrediRed - Recuperar contraseña',
    html: emailLayout('Recuperar contraseña', body)
  };
}

// 3. Confirmación de venta (al vendedor)
export function saleConfirmationEmail({
  sellerName,
  clientOrBuyerName,
  type,
  paymentType,
  items,
  totalAmount,
  creditTerm
}: {
  sellerName: string;
  clientOrBuyerName: string;
  type: string;
  paymentType: string;
  items: SaleItem[];
  totalAmount: number;
  creditTerm?: CreditTerm;
}): EmailResult {
  const typeLabel = type === 'red' ? 'Red' : 'Detal';
  const paymentLabel = paymentType === 'contado' ? 'Contado' : 'Crédito';

  let creditInfo = '';
  if (paymentType === 'credito' && creditTerm) {
    creditInfo = infoRow('Vencimiento', formatDate(creditTerm.dueDate));
  }

  const body = `
    <h2 style="margin:0 0 16px;color:#065F46;font-size:22px;">Venta registrada</h2>
    <p>Hola <strong>${sellerName}</strong>, tu venta ha sido registrada exitosamente.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #E5E7EB;border-radius:8px;border-collapse:collapse;">
      ${infoRow('Cliente / Comprador', clientOrBuyerName)}
      ${infoRow('Tipo', typeLabel)}
      ${infoRow('Forma de pago', paymentLabel)}
      ${creditInfo}
    </table>
    ${itemsTable(items, totalAmount)}
    ${greenButton('Ver mis ventas', `${APP_URL}/ventas`)}
    ${signature()}`;
  return {
    subject: `Venta registrada - $${totalAmount.toFixed(2)} USD`,
    html: emailLayout('Venta registrada', body)
  };
}

// 4. Mercancía asignada (al comprador de red)
export function networkSaleEmail({
  buyerName,
  sellerName,
  items,
  totalAmount,
  paymentType,
  creditTerm
}: {
  buyerName: string;
  sellerName: string;
  items: SaleItem[];
  totalAmount: number;
  paymentType: string;
  creditTerm?: CreditTerm;
}): EmailResult {
  const paymentLabel = paymentType === 'contado' ? 'Contado' : 'Crédito';

  let creditInfo = '';
  if (paymentType === 'credito' && creditTerm) {
    creditInfo = infoRow('Vencimiento', formatDate(creditTerm.dueDate));
  }

  const body = `
    <h2 style="margin:0 0 16px;color:#065F46;font-size:22px;">Mercancía recibida</h2>
    <p>Hola <strong>${buyerName}</strong>, <strong>${sellerName}</strong> te ha asignado la siguiente mercancía:</p>
    ${itemsTable(items, totalAmount)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #E5E7EB;border-radius:8px;border-collapse:collapse;">
      ${infoRow('Forma de pago', paymentLabel)}
      ${creditInfo}
    </table>
    ${greenButton('Ver mi inventario', `${APP_URL}/inventario`)}
    ${signature()}`;
  return {
    subject: `Mercancía asignada por ${sellerName}`,
    html: emailLayout('Mercancía recibida', body)
  };
}

// 5. Abono recibido (al vendedor)
export function paymentReceivedEmail({
  sellerName,
  amount,
  totalAmount,
  paidAmount,
  remaining
}: {
  sellerName: string;
  amount: number;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
}): EmailResult {
  const body = `
    <h2 style="margin:0 0 16px;color:#065F46;font-size:22px;">Abono recibido</h2>
    <p>Hola <strong>${sellerName}</strong>, se ha registrado un nuevo abono en una de tus ventas.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #E5E7EB;border-radius:8px;border-collapse:collapse;">
      ${infoRow('Monto abonado', `<span style="color:#059669;font-weight:bold;">+$${amount.toFixed(2)} USD</span>`)}
      ${infoRow('Total de la venta', `$${totalAmount.toFixed(2)} USD`)}
      ${infoRow('Total pagado', `$${paidAmount.toFixed(2)} USD`)}
      ${infoRow('Pendiente', `<span style="color:#DC2626;font-weight:bold;">$${remaining.toFixed(2)} USD</span>`)}
    </table>
    ${greenButton('Ver ventas', `${APP_URL}/ventas`)}
    ${signature()}`;
  return {
    subject: `Abono recibido - $${amount.toFixed(2)} USD`,
    html: emailLayout('Abono recibido', body)
  };
}

// 6. Deuda saldada (al vendedor)
export function debtSettledEmail({
  sellerName,
  totalAmount,
  clientOrBuyerName
}: {
  sellerName: string;
  totalAmount: number;
  clientOrBuyerName: string;
}): EmailResult {
  const body = `
    <h2 style="margin:0 0 16px;color:#065F46;font-size:22px;">Deuda saldada</h2>
    <p>Hola <strong>${sellerName}</strong>, ¡buenas noticias!</p>
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:#D1FAE5;border:2px solid #10B981;border-radius:12px;padding:20px 32px;">
        <p style="margin:0 0 4px;font-size:14px;color:#065F46;">PAGO COMPLETADO</p>
        <p style="margin:0;font-size:28px;font-weight:bold;color:#059669;">$${totalAmount.toFixed(2)} USD</p>
      </div>
    </div>
    <p><strong>${clientOrBuyerName}</strong> ha completado el pago total de su deuda.</p>
    ${greenButton('Ver ventas', `${APP_URL}/ventas`)}
    ${signature()}`;
  return {
    subject: `Deuda saldada - ${clientOrBuyerName}`,
    html: emailLayout('Deuda saldada', body)
  };
}

// 7. Nuevo miembro en red (al sponsor)
export function newNetworkMemberEmail({
  sponsorName,
  newMemberName,
  newMemberRole
}: {
  sponsorName: string;
  newMemberName: string;
  newMemberRole: string;
}): EmailResult {
  const body = `
    <h2 style="margin:0 0 16px;color:#065F46;font-size:22px;">Nuevo miembro en tu red</h2>
    <p>Hola <strong>${sponsorName}</strong>, alguien se unió a tu red usando tu código de invitación.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #E5E7EB;border-radius:8px;border-collapse:collapse;">
      ${infoRow('Nombre', newMemberName)}
      ${infoRow('Rol', newMemberRole)}
    </table>
    ${greenButton('Ver mi red', `${APP_URL}/mi-red`)}
    ${signature()}`;
  return {
    subject: `Nuevo miembro en tu red - ${newMemberName}`,
    html: emailLayout('Nuevo miembro en tu red', body)
  };
}
