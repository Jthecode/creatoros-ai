import type { ReactNode } from "react";
import BusinessSidebar from "@/components/BusinessSidebar";
import BusinessHeader from "@/components/BusinessHeader";

type BusinessLayoutProps = {
  children: ReactNode;
  params: Promise<{
    id: string;
  }>;
};

export default async function BusinessLayout({
  children,
  params,
}: BusinessLayoutProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen">
        <BusinessSidebar businessId={id} />

        <div className="min-w-0 flex-1">
          <BusinessHeader businessId={id} />

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}