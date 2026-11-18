"use client";

import { AreaError } from "@/components/states/AreaError";

export default function AreaErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <AreaError reset={reset} />;
}
