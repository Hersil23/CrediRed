export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">
            <span className="text-white">Credi</span>
            <span className="text-emerald-400">Red</span>
          </h1>
          <p className="text-gray-400 mt-2">Gestión de ventas y créditos</p>
        </div>
        {children}
      </div>
    </div>
  );
}
