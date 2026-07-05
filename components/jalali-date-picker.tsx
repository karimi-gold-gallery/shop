"use client";

import { useState } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DateObject from "react-date-object";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  value?: string;
  className?: string;
  placeholder?: string;
};

const FORMAT = "YYYY/MM/DD";

export function JalaliDatePicker({ name, value, className, placeholder }: Props) {
  const [date, setDate] = useState<DateObject | null>(null);

  function handleChange(value: DateObject | null) {
    setDate(value ?? null);
  }

  const formatted = date ? date.format(FORMAT) : value ?? "";

  return (
    <>
      <input type="hidden" name={name} value={formatted} />
      <DatePicker
        value={date ?? value ?? null}
        onChange={handleChange}
        calendar={persian}
        locale={persian_fa}
        format={FORMAT}
        calendarPosition="bottom-center"
        placeholder={placeholder ?? "تاریخ تولد را انتخاب کنید"}
        containerClassName={cn("w-full", className)}
        inputClass={cn(
          "flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:border-ring cursor-pointer text-center",
          className
        )}
        style={{ width: "100%", boxSizing: "border-box" }}
      />
    </>
  );
}
