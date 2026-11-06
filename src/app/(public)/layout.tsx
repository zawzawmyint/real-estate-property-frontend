import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { PropertyChat } from "@/features/public-chat/public/property-chat";
import "./public.css";
import "@/features/agency/public/agency-contact.css";

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
      {process.env.PUBLIC_CHAT_ENABLED === "true" && <PropertyChat />}
    </div>
  );
}
