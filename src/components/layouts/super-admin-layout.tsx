interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return (
    <div className="super-admin-layout">
      <nav className="bg-red-600 text-white p-4">
        <h2 className="text-lg font-semibold">Super Admin Panel</h2>
      </nav>
      <main className="container mx-auto">
        {children}
      </main>
    </div>
  );
}