import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import { Link } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { useMe } from "@/features/auth/useMe";
import { useServices } from "@/features/services/useServices";
import { useStaff } from "@/features/staff/useStaff";

// Placeholder owner home: a setup checklist until the day timeline replaces it
export function DashboardPage() {
  const { data: account } = useMe();
  const services = useServices();
  const staff = useStaff();

  const steps = [
    {
      to: "/app/services",
      title: "Add your services",
      count: services.data?.length,
      noun: "service",
    },
    {
      to: "/app/staff",
      title: "Add your staff",
      count: staff.data?.length,
      noun: "staff member",
    },
  ];

  return (
    <>
      <PageHeader
        title="Welcome back"
        description={`Customers will book at /book/${account?.tenant.slug}`}
      />
      <ItemGroup className="gap-2">
        {steps.map((step) => {
          const done = !!step.count;
          return (
            <Item
              key={step.to}
              variant="outline"
              className="bg-background"
              asChild
            >
              <Link to={step.to}>
                <ItemMedia>
                  {done ? (
                    <CheckCircle2Icon className="text-green-600" />
                  ) : (
                    <CircleIcon className="text-muted-foreground" />
                  )}
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{step.title}</ItemTitle>
                  <ItemDescription>
                    {step.count === undefined
                      ? "…"
                      : `${step.count} ${step.noun}${step.count === 1 ? "" : "s"}`}
                  </ItemDescription>
                </ItemContent>
                <ItemActions className="text-sm text-muted-foreground">
                  {done ? "Edit" : "Start"}
                </ItemActions>
              </Link>
            </Item>
          );
        })}
      </ItemGroup>
    </>
  );
}
