import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.svg" alt="CrediRed" width={220} height={55} className="mx-auto mb-2" priority />
          <p className="text-gray-400 mt-2">Gestión de ventas y créditos</p>
        </div>
        {children}
      </div>
    </div>
  );
}
