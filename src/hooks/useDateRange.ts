import { useState } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

export function useDateRange() {
  const now = new Date();
  const [rangeType, setRangeType] = useState<"month" | "week" | "all" | "custom">("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  let startDate: Date;
  let endDate: Date;

  switch (rangeType) {
    case "month":
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    case "week":
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case "custom":
      startDate = customStart ? new Date(customStart) : new Date(0);
      endDate = customEnd ? new Date(customEnd) : new Date();
      break;
    default:
      startDate = new Date(0);
      endDate = new Date();
  }

  return {
    rangeType,
    setRangeType,
    customStart,
    customEnd,
    setCustomStart,
    setCustomEnd,
    startDate,
    endDate,
  };
}
