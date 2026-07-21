"use client";

import * as React from "react";

import { toEnglishDigits } from "@/lib/format";
import { Input } from "@/components/ui/input";

type DigitsInputProps = React.ComponentProps<typeof Input> & {
  /** Strip everything except English digits (0-9). */
  digitsOnly?: boolean;
};

export function DigitsInput({ onChange, digitsOnly, maxLength, ...props }: DigitsInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = toEnglishDigits(e.target.value);
    if (digitsOnly) {
      value = value.replace(/\D/g, "");
    }
    if (maxLength != null) {
      value = value.slice(0, maxLength);
    }
    e.target.value = value;
    onChange?.(e);
  }

  return <Input {...props} maxLength={maxLength} onChange={handleChange} />;
}
