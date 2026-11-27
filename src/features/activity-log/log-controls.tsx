"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { TextField, SelectField } from "@/components/forms/fields";
import { FilterPanel } from "@/components/layout/filter-panel";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { useClientReady } from "@/lib/use-client-ready";
import {
  actions,
  entities,
  dubaiDate,
  readable,
  auditHref,
  auditPath,
  type AuditFilters,
} from "./filters";
import { ActorPicker } from "./actor-picker";
import { auditFormSchema } from "./input";

export function LogControls({ filters }: { filters: AuditFilters }) {
  const ready = useClientReady();
  const router = useRouter();
  const [navigating, startTransition] = useTransition();
  const [pickerVersion, setPickerVersion] = useState(0);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const schema = auditFormSchema(filters);
  const { control, register, setValue, handleSubmit, reset, formState } =
    useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
      resolver: zodResolver(schema),
      values: {
        start: dubaiDate(Date.parse(filters.from)),
        end: dubaiDate(Date.parse(filters.to) - 1),
        entity: filters.entityType ?? "",
        action: filters.action ?? "",
        entityId: filters.entityId ?? "",
        actorId: filters.actorId ?? "",
        kind: filters.actorKind ?? "",
        importId: filters.importId ?? "",
      },
    });
  const [entity, action, actorId] = useWatch({
    control,
    name: ["entity", "action", "actorId"],
  });
  const { errors, isSubmitting } = formState;
  const pending = navigating || isSubmitting;

  useEffect(() => {
    if (!pending && restoreFocus.current) {
      restoreFocus.current.focus();
      restoreFocus.current = null;
    }
  }, [pending]);

  function navigate(href?: string) {
    restoreFocus.current ??=
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    startTransition(() => {
      if (href) router.push(href, { scroll: false });
      else router.refresh();
    });
  }

  function apply(next: AuditFilters) {
    navigate(auditHref(next));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    restoreFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    return handleSubmit(apply, () => {
      restoreFocus.current = null;
    })(event);
  }

  function refresh() {
    navigate();
  }

  function resetFilters() {
    const now = new Date();
    reset({
      start: dubaiDate(+now - 6 * 86400000),
      end: dubaiDate(+now),
      entity: "",
      action: "",
      entityId: "",
      kind: "",
      actorId: "",
      importId: "",
    });
    setPickerVersion((v) => v + 1);
    navigate(auditPath);
  }

  function changeActor(id: string) {
    setValue("actorId", id);
    if (id) setValue("kind", "");
  }

  function changeEntity(type: string) {
    setValue("entityId", "");
    if (type && !action.startsWith(type + ".")) setValue("action", "");
  }

  return (
    <form noValidate onSubmit={submit}>
      <FilterPanel
        disabled={!ready || pending}
        busy={pending}
        fieldsClassName="sm:grid-cols-2 xl:grid-cols-3"
      >
        <TextField
          id="audit-start"
          label="From (Dubai)"
          type="date"
          required
          error={errors.start?.message}
          {...register("start")}
        />
        <TextField
          id="audit-end"
          label="Through (Dubai)"
          type="date"
          required
          error={errors.end?.message}
          {...register("end")}
        />
        <SelectField
          id="audit-source"
          label="Actor source"
          error={errors.kind?.message}
          {...register("kind", { onChange: () => setValue("actorId", "") })}
        >
          <option value="">All sources</option>
          {["staff", "website", "system"].map((v) => (
            <option key={v} value={v}>
              {readable(v)}
            </option>
          ))}
        </SelectField>
        <ActorPicker
          key={pickerVersion}
          actorId={actorId}
          error={errors.actorId?.message}
          onChange={changeActor}
        />
        <SelectField
          id="audit-type"
          label="Record type"
          error={errors.entity?.message}
          {...register("entity", {
            onChange: (e) => changeEntity(e.target.value),
          })}
        >
          <option value="">All record types</option>
          {entities.map((v) => (
            <option key={v} value={v}>
              {readable(v)}
            </option>
          ))}
        </SelectField>
        <TextField
          id="audit-record"
          label="Record ID"
          disabled={!entity}
          error={errors.entityId?.message}
          {...register("entityId")}
        />
        <SelectField
          id="audit-action"
          label="Action"
          error={errors.action?.message}
          {...register("action")}
        >
          <option value="">All actions</option>
          {actions
            .filter((v) => !entity || v.startsWith(entity + "."))
            .map((v) => (
              <option key={v} value={v}>
                {readable(v)}
              </option>
            ))}
        </SelectField>
        <TextField
          id="audit-import"
          label="Import ID"
          error={errors.importId?.message}
          {...register("importId")}
        />
        <div className="flex flex-wrap items-end gap-2">
          <SubmitButton
            pending={pending}
            label="Apply filters"
            pendingLabel="Applying filters…"
          />
          <Button type="button" variant="outline" onClick={refresh}>
            Refresh
          </Button>
          <Button type="button" variant="ghost" onClick={resetFilters}>
            Reset filters
          </Button>
        </div>
      </FilterPanel>
    </form>
  );
}
