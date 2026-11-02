import { Alert, AlertDescription } from "@/components/ui/alert";
import { AgencyInquiryCard } from "@/features/leads/public/agency-inquiry-card";
import { getPublicAgency } from "../data/queries";
import { AgencyRetry } from "./agency-retry";

export async function DirectoryEnquiry() {
  const agency = await getPublicAgency().catch(() => null);

  return (
    <div key="directory-enquiry-layout">
      <div key="directory-context" className="mb-5 empty:hidden">
        {agency === null ? (
          <Alert>
            <AlertDescription>
              Agency information is temporarily unavailable. You can still send
              an enquiry below. We cannot currently confirm whether this is a
              demonstration website; avoid sensitive information.
              <div>
                <AgencyRetry />
              </div>
            </AlertDescription>
          </Alert>
        ) : agency.isDemo ? (
          <p className="text-sm leading-6 text-muted-foreground">
            <span className="font-medium text-primary">Demo agency.</span> Use
            sample contact details when trying the enquiry form.
          </p>
        ) : null}
      </div>
      <AgencyInquiryCard
        key="directory-agency-inquiry"
        presentation="directory"
        isDemo={agency?.isDemo ?? null}
        showDemoNotice={false}
      />
    </div>
  );
}
