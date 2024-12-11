// TimeoutControls.tsx
import React from "react";
import { Button } from "./components/ui/button";
import { useToast } from "./hooks/use-toast";
import { useTimeout } from "./useInactive";

const TimeoutControls: React.FC = () => {
  const { setTimeoutValue } = useTimeout();
  const { toast } = useToast();

  const handleSetTimeout = (time: number, label: string) => {
    setTimeoutValue(time);
    toast({
      title: "Inactivity Timeout Updated",
      description: `Timeout set to ${label}.`,
      variant: "default",
    });
  };
  return (
<div className="grid  grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4 items-center">
  <p className="col-span-full md:col-span-1">Set Inactivity Timeout:</p>
  <Button onClick={() => handleSetTimeout(15 * 60 * 1000, "15 minutes")}>15 minutes</Button>
  <Button onClick={() => handleSetTimeout(30 * 60 * 1000, "30 minutes")}>30 minutes</Button>
  <Button onClick={() => handleSetTimeout(45 * 60 * 1000, "45 minutes")}>45 minutes</Button>
  <Button onClick={() => handleSetTimeout(90 * 60 * 1000, "90 minutes")}>90 minutes</Button>
  <Button onClick={() => handleSetTimeout(180 * 60 * 1000, "180 minutes")}>180 minutes</Button>
</div>
  );
};

export default TimeoutControls;
