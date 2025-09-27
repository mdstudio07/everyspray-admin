export default function ContributeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-green-600 text-white p-4">
        <h1 className="text-xl font-bold">Contribute</h1>
      </div>
      <div className="container mx-auto p-4">
        {children}
      </div>
    </div>
  );
}