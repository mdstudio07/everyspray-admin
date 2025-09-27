export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="super-admin-section">
      <div className="border-l-4 border-red-500 bg-red-50 p-4 mb-6">
        <h2 className="text-lg font-semibold text-red-700">Super Admin Only</h2>
        <p className="text-red-600">This section requires super admin privileges.</p>
      </div>
      {children}
    </div>
  );
}