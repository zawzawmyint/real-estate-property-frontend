import { Icon } from "@/components/ui/icon";
import type { PublicPropertyDetail } from "../data/types";
import { formatArea, formatBedrooms } from "../data/filters";

export function PropertyDetails({
  property,
}: {
  property: PublicPropertyDetail;
}) {
  const facts = [
    { label: "Property type", value: property.type, icon: "properties" },
    { label: "Bathrooms", value: property.bathrooms, icon: "bath" },
    {
      label: "Location",
      value: `${property.community}, ${property.city}`,
      icon: "location",
    },
    {
      label: "Property size",
      value: formatArea(property.areaSqft),
      icon: "area",
    },
    {
      label: "Bedrooms",
      value: formatBedrooms(property.bedrooms),
      icon: "bed",
    },
  ] as const;

  return (
    <section
      className="property-detail-information"
      aria-labelledby="property-details-heading"
    >
      <h2 id="property-details-heading" className="display-heading text-3xl">
        Property details
      </h2>
      <dl className="property-detail-information-grid">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt>
              <Icon name={fact.icon} />
              {fact.label}
            </dt>
            <dd
              className={
                fact.label === "Property type" ? "capitalize" : undefined
              }
            >
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
