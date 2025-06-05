"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputNumberProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  decimalPlaces?: number
  allowNegative?: boolean
  formatAsCurrency?: boolean
}

const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  (
    {
      className,
      type,
      onChange,
      value,
      min,
      max,
      step = 1,
      decimalPlaces = 2,
      allowNegative = false,
      formatAsCurrency = false,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState<string>(() => {
      if (value === undefined || value === null) return ""
      if (formatAsCurrency) {
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }).format(Number(value))
      }
      return String(value)
    })

    // Update display value when value prop changes
    React.useEffect(() => {
      if (value === undefined || value === null) {
        setDisplayValue("")
        return
      }
      
      if (formatAsCurrency) {
        setDisplayValue(
          new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(Number(value))
        )
      } else {
        setDisplayValue(String(value))
      }
    }, [value, formatAsCurrency, decimalPlaces])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value

      // Handle currency format
      if (formatAsCurrency) {
        // Remove currency symbol, thousand separators and keep only digits and decimal separator
        inputValue = inputValue.replace(/[^\d,-]/g, "").replace(",", ".")
      }

      // Allow empty input (will be treated as null)
      if (inputValue === "" || inputValue === "-") {
        setDisplayValue(inputValue)
        onChange?.(null)
        return
      }

      // Validate input is a number
      const numericValue = parseFloat(inputValue)
      if (isNaN(numericValue)) {
        return
      }

      // Check if negative values are allowed
      if (!allowNegative && numericValue < 0) {
        return
      }

      // Apply min/max constraints
      let constrainedValue = numericValue
      if (min !== undefined && numericValue < min) {
        constrainedValue = min
      }
      if (max !== undefined && numericValue > max) {
        constrainedValue = max
      }

      // Format display value
      if (formatAsCurrency) {
        setDisplayValue(
          new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(constrainedValue)
        )
      } else {
        setDisplayValue(String(constrainedValue))
      }

      // Call onChange with the numeric value
      onChange?.(constrainedValue)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, decimal point, minus sign (if allowed)
      const allowedKeys = [
        "Backspace",
        "Delete",
        "Tab",
        "Escape",
        "Enter",
        ".",
        ",",
      ]
      
      if (allowNegative) {
        allowedKeys.push("-")
      }

      // Allow arrow keys
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
        return
      }

      // Increment/decrement with arrow up/down
      if (e.key === "ArrowUp") {
        e.preventDefault()
        const currentValue = value === undefined || value === null ? 0 : Number(value)
        const newValue = currentValue + step
        if (max !== undefined && newValue > max) return
        onChange?.(newValue)
        return
      }

      if (e.key === "ArrowDown") {
        e.preventDefault()
        const currentValue = value === undefined || value === null ? 0 : Number(value)
        const newValue = currentValue - step
        if (min !== undefined && newValue < min) return
        onChange?.(newValue)
        return
      }

      // Allow numbers
      if (/^\d$/.test(e.key)) {
        return
      }

      // Block if not in allowed keys
      if (!allowedKeys.includes(e.key)) {
        e.preventDefault()
      }

      // Prevent multiple decimal points
      if ((e.key === "." || e.key === ",") && displayValue.includes(".")) {
        e.preventDefault()
      }

      // Prevent minus sign if not at start or if already present
      if (e.key === "-" && (e.currentTarget.selectionStart !== 0 || displayValue.includes("-"))) {
        e.preventDefault()
      }
    }

    return (
      <input
        type="text"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        inputMode="decimal"
        {...props}
      />
    )
  }
)
InputNumber.displayName = "InputNumber"

export { InputNumber }
