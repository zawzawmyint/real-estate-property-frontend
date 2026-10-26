import { Card, CardContent } from "@/components/ui/card";

export function PropertyFormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent>
        <h2 className="mb-5 text-lg font-semibold">{title}</h2>
        {children}
      </CardContent>
    </Card>
  );
}
