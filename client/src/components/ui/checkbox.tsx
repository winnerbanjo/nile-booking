import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onChange, ...props }, ref) => {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={onChange}
          ref={ref}
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 rounded border border-input bg-background flex items-center justify-center transition-colors",
            checked && "bg-primary border-primary",
            className
          )}
        >
          {checked && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
