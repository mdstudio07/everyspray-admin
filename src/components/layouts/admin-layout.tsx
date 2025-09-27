interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-layout">
      <nav className="bg-green-600 text-white p-4">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </nav>
      <main className="container mx-auto">
        {children}
      </main>
    </div>
  );
}