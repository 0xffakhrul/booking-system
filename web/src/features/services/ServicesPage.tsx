import { PencilIcon, PlusIcon, ScissorsIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { PageHeader, pageAction } from "@/components/PageHeader";
import { RemoveDialog } from "@/components/RemoveDialog";
import {
  SettingsList,
  SettingsRow,
  SettingsSkeleton,
} from "@/components/SettingsList";
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
import { formatPrice } from "@/lib/money";
import { ServiceFormDialog } from "./ServiceFormDialog";
import { useDeleteService, useServices, type Service } from "./useServices";

// name, length, price, then edit and remove; the same template for the header and rows
const columns = "md:grid-cols-[minmax(0,1fr)_7rem_7rem_5.5rem]";

// `open` is kept apart from `service`, so the dialog's text doesn't change while it animates closed
type DialogState = { open: boolean; service?: Service };

export function ServicesPage() {
  const { data: services, isPending, error } = useServices();
  const remove = useDeleteService();
  const [form, setForm] = useState<DialogState>({ open: false });
  const [removing, setRemoving] = useState<DialogState>({ open: false });

  const addButton = (
    <Button className={pageAction} onClick={() => setForm({ open: true })}>
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
        <SettingsSkeleton />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : services.length === 0 ? (
        <Empty className="rounded-xl border bg-card">
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
        <SettingsList
          columns={columns}
          headings={["Service", "Length", "Price", ""]}
        >
          {services.map((service) => (
            <SettingsRow
              key={service.id}
              columns={columns}
              actions={
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    aria-label={`Edit ${service.name}`}
                    onClick={() => setForm({ open: true, service })}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    aria-label={`Remove ${service.name}`}
                    onClick={() => {
                      remove.reset(); // clear an error left from last time
                      setRemoving({ open: true, service });
                    }}
                  >
                    <Trash2Icon />
                  </Button>
                </>
              }
            >
              <span className="truncate text-sm font-semibold">
                {service.name}
              </span>
              {/* one muted line on a phone, two columns from md up */}
              <span className="text-[13px] text-muted-foreground md:text-sm md:text-foreground">
                {service.durationMin} min
                <span className="md:hidden">
                  {" · "}
                  {formatPrice(service.price)}
                </span>
              </span>
              <span className="hidden text-sm md:block">
                {formatPrice(service.price)}
              </span>
            </SettingsRow>
          ))}
        </SettingsList>
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
