"use client"

import { useClientLogger } from "@avenire/logger/client";
import { Button } from "@avenire/ui/components/button";
import { useEffect } from "react";

export default function Home() {
  const logger = useClientLogger({ page: "home" });

  useEffect(() => {
    logger.info("Testing out info log");
    logger.warn("Testing out warn log");
    logger.error("Testing out error log");
    logger.debug?.("Testing out debug log");
  }, [])

  return (
    <div>
      <h1>Hello World</h1>
      <Button>Click me</Button>
    </div>
  );
}
