interface ContributorLayoutProps {
  children: React.ReactNode;
}

export default function ContributorLayout({ children }: ContributorLayoutProps) {
  return (
    <div className="contributor-layout">
      <nav className="bg-blue-600 text-white p-4">
        <h2 className="text-lg font-semibold">Contributor Panel</h2>
      </nav>
      <main className="container mx-auto">
        {children}
      </main>
    </div>
  );
}