import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-55 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-brand-navy text-white shadow-[0_4px_14px_rgba(12,36,72,0.2)] hover:bg-brand-navy-700 hover:shadow-[0_6px_20px_rgba(12,36,72,0.3)]",
        accent: "bg-brand-teal text-white shadow-[0_4px_14px_rgba(24,120,144,0.24)] hover:bg-brand-teal-700 hover:shadow-[0_6px_20px_rgba(24,120,144,0.34)]",
        secondary: "border border-white/75 bg-white/70 backdrop-blur-md text-ink hover:bg-white/95 shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.85)]",
        ghost: "text-ink-muted hover:bg-white/60 hover:text-ink backdrop-blur-xs",
        danger: "bg-danger text-white shadow-[0_4px_14px_rgba(176,58,50,0.22)] hover:bg-danger/90 hover:shadow-[0_6px_20px_rgba(176,58,50,0.32)]",
        "danger-outline": "border border-danger/35 bg-white/70 backdrop-blur-md text-danger hover:bg-danger-50",
        link: "h-auto px-0 text-brand-teal underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-10 px-5",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...(asChild ? {} : { type: type ?? "button" })}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
