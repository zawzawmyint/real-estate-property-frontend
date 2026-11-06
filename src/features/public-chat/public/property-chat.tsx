"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Tooltip } from "@base-ui/react/tooltip";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextField } from "@/components/forms/fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { SubmitButton } from "@/components/ui/submit-button";
import { useClientReady } from "@/lib/use-client-ready";
import { cn } from "@/lib/utils";
import { sendPublicChat } from "../data/actions";
import {
  chatMessage,
  chatMessageLimit,
  type PublicChatReply,
} from "../data/schema";
import { ChatFallbackLinks, ChatReply } from "./chat-reply";

const questionForm = z.object({ message: chatMessage });
const launcherLabel = "Ask about properties";
type ChatTurn = { question: string; reply: PublicChatReply };

const headerButtonClass =
  "text-primary-foreground hover:bg-primary-foreground/10 focus-visible:outline-primary-foreground";

function ChatTooltip({
  label,
  render,
  disabled,
  side = "top",
  children,
}: {
  label: string;
  render: Tooltip.Trigger.Props["render"];
  disabled?: boolean;
  side?: "top" | "bottom";
  children?: ReactNode;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger aria-label={label} disabled={disabled} render={render}>
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner
          side={side}
          align="end"
          sideOffset={8}
          className="z-[60]"
        >
          <Tooltip.Popup
            role="tooltip"
            className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background shadow-md"
          >
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function PropertyChat() {
  const ready = useClientReady();
  const questionId = useId();
  const scrollArea = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const sending = useRef(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [animateLatestReply, setAnimateLatestReply] = useState(false);
  const [failure, setFailure] = useState("");
  const {
    register,
    handleSubmit,
    resetField,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof questionForm>>({
    resolver: zodResolver(questionForm),
    defaultValues: { message: "" },
  });

  useEffect(() => {
    if (open && scrollArea.current)
      scrollArea.current.scrollTop = scrollArea.current.scrollHeight;
  }, [open, turns, isSubmitting]);

  function changeOpen(nextOpen: boolean) {
    if (nextOpen) setExpanded(false);
    setAnimateLatestReply(false);
    setOpen(nextOpen);
  }

  const close = () => changeOpen(false);
  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    if (sending.current) {
      event.preventDefault();
      return;
    }

    sending.current = true;
    setFailure("");
    try {
      await handleSubmit(async ({ message }) => {
        const result = await sendPublicChat(message);
        if (result.ok) {
          setAnimateLatestReply(
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          );
          setTurns((previous) => [
            ...previous,
            { question: message, reply: result.reply },
          ]);
          resetField("message");
        } else {
          setFailure(result.message);
        }
      })(event);
    } catch {
      setFailure(
        "The property assistant is temporarily unavailable. Try again shortly.",
      );
    } finally {
      sending.current = false;
      setFocus("message");
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <div className="fixed end-3 bottom-3 z-30 sm:end-6 sm:bottom-6">
        <ChatTooltip
          label={launcherLabel}
          disabled={open || !ready}
          render={
            <DialogTrigger
              disabled={!ready}
              render={
                <Button
                  size="icon"
                  className="size-12 rounded-full shadow-lg"
                />
              }
            />
          }
        >
          <Icon name="chat" className="size-5" />
        </ChatTooltip>
      </div>
      <DialogContent
        showCloseButton={false}
        initialFocus={title}
        className={cn(
          "flex flex-col gap-0 overflow-hidden rounded-[1.125rem] border border-border bg-background p-0 shadow-2xl sm:max-h-[calc(100dvh-3rem)]",
          expanded
            ? "h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-[44rem] sm:h-[46rem] sm:w-[calc(100%-3rem)] sm:max-w-[44rem]"
            : "start-auto end-3 top-auto bottom-3 left-auto h-[38rem] max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[27.5rem] translate-x-0 translate-y-0 sm:end-6 sm:bottom-6 sm:max-w-[27.5rem]",
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-1 bg-primary px-4 py-4 text-primary-foreground sm:px-5">
          <div>
            <p className="mb-1 text-[0.6875rem] font-medium tracking-[0.14em] uppercase">
              Avenor Properties · Demo
            </p>
            <DialogTitle
              ref={title}
              tabIndex={-1}
              className="font-display text-xl font-normal sm:text-2xl"
            >
              Property assistant
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Ask about properties or how to arrange a viewing.
          </DialogDescription>
          <div className="flex shrink-0">
            <ChatTooltip
              label={expanded ? "Collapse chat" : "Expand chat"}
              side="bottom"
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  tone="inverse"
                  className={headerButtonClass}
                  onClick={() => setExpanded(!expanded)}
                />
              }
            >
              <Icon name={expanded ? "minimize" : "maximize"} />
            </ChatTooltip>
            <ChatTooltip
              label="Close"
              side="bottom"
              render={
                <DialogClose
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      tone="inverse"
                      className={headerButtonClass}
                    />
                  }
                />
              }
            >
              <Icon name="close" />
            </ChatTooltip>
          </div>
        </header>
        <div
          ref={scrollArea}
          role="log"
          aria-label="Conversation"
          className="@container min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
        >
          {turns.length === 0 && (
            <p className="text-muted-foreground">
              Tell me what you’re looking for, or ask how to arrange a viewing.
            </p>
          )}
          {turns.map(({ question, reply }, index) => (
            <div key={index} className="mb-4 grid gap-3 last:mb-0">
              <p className="max-w-[90%] justify-self-end rounded-xl rounded-ee-sm bg-primary/10 px-3 py-2 [overflow-wrap:anywhere]">
                <span className="sr-only">You: </span>
                {question}
              </p>
              <ChatReply
                reply={reply}
                animate={
                  open && animateLatestReply && index === turns.length - 1
                }
                onNavigate={close}
              />
            </div>
          ))}
        </div>
        <footer className="shrink-0 border-t border-border bg-card p-3 sm:px-4">
          {failure && (
            <Alert variant="destructive" className="mb-2 gap-0 px-3 py-2">
              <AlertDescription>
                {failure}
                <ChatFallbackLinks onNavigate={close} />
              </AlertDescription>
            </Alert>
          )}
          <form
            noValidate
            onSubmit={submitQuestion}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2"
          >
            <TextField
              {...register("message")}
              id={questionId}
              label="Your question"
              fieldClassName="[&_[data-slot=field-label]]:sr-only"
              className="min-h-11 bg-background px-3"
              placeholder="Ask about properties…"
              maxLength={chatMessageLimit}
              autoComplete="off"
              readOnly={isSubmitting}
              error={errors.message?.message}
              aria-describedby={`${questionId}-privacy`}
            />
            <ChatTooltip
              label={isSubmitting ? "Sending" : "Send"}
              disabled={isSubmitting}
              render={
                <SubmitButton
                  size="icon"
                  pending={isSubmitting}
                  label={<Icon name="send" />}
                  pendingLabel={null}
                />
              }
            />
          </form>
          <p
            id={`${questionId}-privacy`}
            className="mt-1.5 text-xs text-muted-foreground"
          >
            Use the inquiry form to share your contact details.
          </p>
          <p role="status" className="sr-only">
            {isSubmitting ? "Getting an answer." : ""}
          </p>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
