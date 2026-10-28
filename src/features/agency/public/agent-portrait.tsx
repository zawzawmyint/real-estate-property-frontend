"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import type { PublicAgentSummary } from "../data/types";
import { cn } from "@/lib/utils";

export function AgentPortrait({
  agent,
  priority = false,
  className,
}: {
  agent: Pick<PublicAgentSummary, "name" | "portrait">;
  priority?: boolean;
  className?: string;
}) {
  return (
    <PortraitContent
      key={agent.portrait?.src ?? agent.name}
      agent={agent}
      priority={priority}
      className={className}
    />
  );
}

function PortraitContent({
  agent,
  priority,
  className,
}: {
  agent: Pick<PublicAgentSummary, "name" | "portrait">;
  priority: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const imageRef = useCallback((image: HTMLImageElement | null) => {
    if (image?.complete && image.naturalWidth === 0) setFailed(true);
  }, []);
  const initials = agent.name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <div
      className={cn(
        "relative aspect-[4/5] overflow-hidden bg-muted",
        className,
      )}
    >
      {agent.portrait && !failed ? (
        <Image
          ref={imageRef}
          src={agent.portrait.src}
          width={agent.portrait.width}
          height={agent.portrait.height}
          alt={`Portrait of ${agent.name}`}
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={`${agent.name}. Portrait unavailable`}
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center text-primary"
        >
          <span
            aria-hidden="true"
            className="display-heading flex size-28 items-center justify-center rounded-full border border-primary/20 text-4xl"
          >
            {initials}
          </span>
          <span className="text-sm text-muted-foreground">
            Portrait unavailable
          </span>
        </div>
      )}
    </div>
  );
}
