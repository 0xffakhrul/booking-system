import {
  ClockIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
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
import { StaffFormDialog } from "./StaffFormDialog";
import { useDeleteStaff, useStaff, type Staff } from "./useStaff";
import { workingHoursQuery, type Range } from "./useWorkingHours";
import { summarizeWeek } from "./working-hours";

// name, their week, then Hours, edit and remove
const columns = "md:grid-cols-[12rem_minmax(0,1fr)_10rem]";

type DialogState = { open: boolean; member?: Staff };

export function StaffPage() {
  const { data: staff, isPending, error } = useStaff();
  const remove = useDeleteStaff();
  const [form, setForm] = useState<DialogState>({ open: false });
  const [removing, setRemoving] = useState<DialogState>({ open: false });

  // everyone's week side by side, from the same cache as the schedule and the hours editor
  const weeks = useQueries({
    queries: (staff ?? []).map((m) => workingHoursQuery(m.id)),
  });

  const addButton = (
    <Button className={pageAction} onClick={() => setForm({ open: true })}>
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
        <SettingsSkeleton />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : staff.length === 0 ? (
        <Empty className="rounded-xl border bg-card">
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
        <SettingsList columns={columns} headings={["Name", "Hours", ""]}>
          {staff.map((member, i) => {
            const week = weeks[i]?.data;
            return (
              <SettingsRow
                key={member.id}
                columns={columns}
                actions={
                  <>
                    <Button variant="outline" className="h-9 px-3" asChild>
                      <Link
                        to={`/app/staff/${member.id}/hours`}
                        aria-label={`Working hours for ${member.name}`}
                      >
                        <ClockIcon />
                        {/* icon only on a phone, to leave room for the times */}
                        <span className="hidden sm:inline">Hours</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      aria-label={`Edit ${member.name}`}
                      onClick={() => setForm({ open: true, member })}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      aria-label={`Remove ${member.name}`}
                      onClick={() => {
                        remove.reset();
                        setRemoving({ open: true, member });
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  </>
                }
              >
                <span className="truncate text-sm font-semibold">
                  {member.name}
                </span>
                <WeekLines week={week} />
              </SettingsRow>
            );
          })}
        </SettingsList>
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

/** One line per run of days: "Mon–Fri  10:00–13:00, 14:00–19:00", days muted in their own column */
function WeekLines({ week }: { week: Range[] | undefined }) {
  if (!week)
    return (
      <span
        aria-hidden
        className="h-3.5 w-48 animate-pulse rounded bg-muted motion-reduce:animate-none"
      />
    );
  const lines = summarizeWeek(week);
  if (lines.length === 0)
    return <span className="text-sm text-muted-foreground">No hours set</span>;
  return (
    <dl className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-[13px] md:text-sm">
      {lines.map(({ days, hours }) => (
        <div key={days} className="contents">
          <dt className="text-muted-foreground">{days}</dt>
          {/* each range stays whole; a long day wraps between ranges */}
          <dd className="flex flex-wrap gap-x-1">
            {hours.map((range, i) => (
              <span key={range} className="whitespace-nowrap">
                {range}
                {i < hours.length - 1 && ","}
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
