import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import { Link } from "react-router";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";

type Props = { serviceCount?: number; staffCount?: number };

/** Shown on the dashboard until the shop has at least one service and one staff member */
export function SetupChecklist({ serviceCount, staffCount }: Props) {
  const steps = [
    {
      to: "/app/services",
      title: "Add your services",
      count: serviceCount,
      noun: "service",
    },
    {
      to: "/app/staff",
      title: "Add your staff",
      count: staffCount,
      noun: "staff member",
    },
  ];

  return (
    <ItemGroup className="gap-2">
      {steps.map((step) => {
        const done = !!step.count;
        return (
          <Item key={step.to} variant="outline" className="bg-card" asChild>
            <Link to={step.to}>
              <ItemMedia>
                {done ? (
                  <CheckCircle2Icon className="text-primary" />
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
  );
}
