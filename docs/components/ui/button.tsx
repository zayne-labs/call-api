"use client";

import { cnMerge } from "@/lib/utils/cn";
import { Slot } from "@zayne-labs/toolkit/react/ui/slot";
import type { InferProps } from "@zayne-labs/toolkit/react/utils";
import type { Prettify } from "@zayne-labs/toolkit/type-helpers";
import { type VariantProps, tv } from "tailwind-variants";

// eslint-disable-next-line react-refresh/only-export-components -- It's fine
export const buttonVariants = tv({
	base: `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium
	transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
	disabled:pointer-events-none disabled:opacity-50`,

	variants: {
		size: {
			default: "h-9 px-4 py-2",
			icon: "size-9",
			lg: "h-10 rounded-md px-8",
			sm: "h-8 rounded-md px-3 text-xs",
		},

		theme: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline",
			outline:
				"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
		},
	},

	/* eslint-disable perfectionist/sort-objects -- I want this to be last */
	defaultVariants: {
		size: "default",
		theme: "default",
	},
	/* eslint-enable perfectionist/sort-objects -- I want this to be last */
});

export type ButtonProps = Prettify<InferProps<"button"> & VariantProps<typeof buttonVariants>> & {
	asChild?: boolean;
	unstyled?: boolean;
};

function Button(props: ButtonProps) {
	const {
		asChild = false,
		className,
		size,
		theme,
		type = "button",
		unstyled,
		...extraButtonProps
	} = props;

	const BTN_CLASSES = unstyled ? className : buttonVariants({ className, size, theme });

	const Component = asChild ? Slot : "button";

	return <Component type={type} className={cnMerge(BTN_CLASSES)} {...extraButtonProps} />;
}

export { Button };
