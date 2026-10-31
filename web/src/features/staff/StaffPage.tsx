import { PencilIcon, PlusIcon, Trash2Icon, UsersIcon } from "lucide-react";
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
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { StaffFormDialog } from "./StaffFormDialog";
import { useDeleteStaff, useStaff, type Staff } from "./useStaff";

type DialogState = { open: boolean; member?: Staff };

export function StaffPage() {
  const { data: staff, isPending, error } = useStaff();
  const remove = useDeleteStaff();
  const [form, setForm] = useState<DialogState>({ open: false });
  const [removing, setRemoving] = useState<DialogState>({ open: false });

  const addButton = (
    <Button onClick={() => setForm({ open: true })}>
      <PlusIcon />
      Add staff
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Staff"
        description="The people customers can book with."
        action={staff?.length ? addButton : undefined}
      />

      {isPending ? (
        <Spinner className="mx-auto mt-8 size-6 text-muted-foreground" />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : staff.length === 0 ? (
        <Empty className="border bg-background">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>No staff yet</EmptyTitle>
            <EmptyDescription>
              Add everyone who takes bookings, including yourself.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{addButton}</EmptyContent>
        </Empty>
      ) : (
        <ItemGroup className="gap-2">
          {staff.map((member) => (
            <Item key={member.id} variant="outline" className="bg-background">
              <ItemContent>
                <ItemTitle>{member.name}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${member.name}`}
                  onClick={() => setForm({ open: true, member })}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${member.name}`}
                  onClick={() => {
                    remove.reset();
                    setRemoving({ open: true, member });
                  }}
                >
                  <Trash2Icon />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}

      <StaffFormDialog
        open={form.open}
        member={form.member}
        onOpenChange={(open) => setForm((s) => ({ ...s, open }))}
      />

      <RemoveDialog
        open={removing.open}
        onOpenChange={(open) => setRemoving((s) => ({ ...s, open }))}
        title={`Remove ${removing.member?.name}?`}
        description="They won't get new bookings. Their past bookings and working hours are kept."
        pending={remove.isPending}
        error={remove.error?.message}
        onConfirm={() => {
          if (!removing.member) return;
          remove.mutate(removing.member.id, {
            onSuccess: () => setRemoving((s) => ({ ...s, open: false })),
          });
        }}
      />
    </>
  );
}
