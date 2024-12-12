"use client";

import { type AnimationProps, motion } from "motion/react";

const animationProps = {
	animate: { "--x": "-100%", scale: 1 },
	initial: { "--x": "100%", scale: 0.8 },
	transition: {
		damping: 15,
		mass: 2,
		repeat: Infinity,
		repeatDelay: 1,
		repeatType: "loop",
		scale: {
			damping: 5,
			mass: 0.5,
			stiffness: 200,
			type: "spring",
		},
		stiffness: 20,
		type: "spring",
	},
	whileTap: { scale: 0.95 },
} as AnimationProps;

function ShinyButton({ children, ...restOfProps }: { children: React.ReactNode }) {
	return (
		<motion.button
			{...animationProps}
			{...restOfProps}
			className="relative h-9 rounded-lg px-4 py-2 font-medium backdrop-blur-xl transition-shadow
				duration-300 ease-in-out hover:shadow
				dark:bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/10%)_0%,transparent_60%)]
				dark:hover:shadow-[0_0_20px_hsl(var(--primary)/10%)]"
		>
			<span
				className="relative flex size-full items-center gap-2"
				style={{
					maskImage:
						"linear-gradient(-75deg,hsl(var(--primary)) calc(var(--x) + 20%),transparent calc(var(--x) + 30%),hsl(var(--primary)) calc(var(--x) + 100%))",
				}}
			>
				{children}
			</span>
			<span
				style={{
					mask: "linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box,linear-gradient(rgb(0,0,0), rgb(0,0,0))",
					maskComposite: "exclude",
				}}
				className="absolute inset-0 z-10 block rounded-[inherit]
					bg-[linear-gradient(-75deg,hsl(var(--primary)/10%)_calc(var(--x)+20%),hsl(var(--primary)/50%)_calc(var(--x)+25%),hsl(var(--primary)/10%)_calc(var(--x)+100%))]
					p-px"
			/>
		</motion.button>
	);
}

export { ShinyButton };
