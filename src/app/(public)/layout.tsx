import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import "./public.css";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-site flex min-h-dvh flex-col">
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  );
}
