export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white p-4">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
      </div>
      <div className="container mx-auto p-4">
        {children}
      </div>
    </div>
  );
}