import ContributorLayout from '@/components/layouts/contributor-layout';

export default function ContributeLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ContributorLayout>
      {children}
    </ContributorLayout>
  );
}