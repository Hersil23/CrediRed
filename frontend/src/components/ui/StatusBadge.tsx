const statusConfig: Record<string, { label: string; className: string }> = {
  pendiente: { label: 'Pendiente', className: 'bg-amber-100 text-amber-800' },
  saldado: { label: 'Saldado', className: 'bg-green-100 text-green-800' },
  vencido: { label: 'Vencido', className: 'bg-red-100 text-red-800' },
  active: { label: 'Activo', className: 'bg-green-100 text-green-800' },
  trial: { label: 'Trial', className: 'bg-blue-100 text-blue-800' },
  expired: { label: 'Inactivo', className: 'bg-red-100 text-red-800' },
  blocked: { label: 'Bloqueado', className: 'bg-gray-100 text-gray-800' },
  contado: { label: 'Contado', className: 'bg-emerald-100 text-emerald-800' },
  credito: { label: 'Crédito', className: 'bg-purple-100 text-purple-800' },
  detal: { label: 'Detal', className: 'bg-blue-100 text-blue-800' },
  red: { label: 'Red', className: 'bg-orange-100 text-orange-800' }
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
