import { PencilIcon, PlusIcon, ScissorsIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RemoveDialog } from "@/components/RemoveDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { formatPrice } from "@/lib/money";
import { ServiceFormDialog } from "./ServiceFormDialog";
import { useDeleteService, useServices, type Service } from "./useServices";

// `open` is kept apart from `service`, so the dialog's text doesn't change while it animates closed
type DialogState = { open: boolean; service?: Service };

export function ServicesPage() {
  const { data: services, isPending, error } = useServices();
  const remove = useDeleteService();
  const [form, setForm] = useState<DialogState>({ open: false });
  const [removing, setRemoving] = useState<DialogState>({ open: false });

  const addButton = (
    <Button onClick={() => setForm({ open: true })}>
      <PlusIcon />
      Add service
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Services"
        description="What customers can book."
        action={services?.length ? addButton : undefined}
      />

      {isPending ? (
        <Spinner className="mx-auto mt-8 size-6 text-muted-foreground" />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : services.length === 0 ? (
        <Empty className="border bg-background">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ScissorsIcon />
            </EmptyMedia>
            <EmptyTitle>No services yet</EmptyTitle>
            <EmptyDescription>
              Add what customers can book, like a haircut or a beard trim.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{addButton}</EmptyContent>
        </Empty>
      ) : (
        <ItemGroup className="gap-2">
          {services.map((service) => (
            <Item key={service.id} variant="outline" className="bg-background">
              <ItemContent>
                <ItemTitle>{service.name}</ItemTitle>
                <ItemDescription>
                  {service.durationMin} min · {formatPrice(service.price)}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${service.name}`}
                  onClick={() => setForm({ open: true, service })}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${service.name}`}
                  onClick={() => {
                    remove.reset(); // clear an error left from last time
                    setRemoving({ open: true, service });
                  }}
                >
                  <Trash2Icon />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}

      <ServiceFormDialog
        open={form.open}
        service={form.service}
        onOpenChange={(open) => setForm((s) => ({ ...s, open }))}
      />

      <RemoveDialog
        open={removing.open}
        onOpenChange={(open) => setRemoving((s) => ({ ...s, open }))}
        title={`Remove ${removing.service?.name}?`}
        description="Customers won't be able to book it any more. Past bookings keep it."
        pending={remove.isPending}
        error={remove.error?.message}
        onConfirm={() => {
          if (!removing.service) return;
          remove.mutate(removing.service.id, {
            onSuccess: () => setRemoving((s) => ({ ...s, open: false })),
          });
        }}
      />
    </>
  );
}
