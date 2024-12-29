"use client";

import { cnMerge } from "@/lib/utils/cn";
import { useEffect, useState } from "react";

type TypingAnimationProps = {
	className?: string;
	duration?: number;
	text: string;
};

export default function TypingAnimation({ className, duration = 200, text }: TypingAnimationProps) {
	const [displayedText, setDisplayedText] = useState<string>("");
	const [i, setI] = useState<number>(0);

	useEffect(() => {
		const typingEffect = setInterval(() => {
			if (i < text.length) {
				setDisplayedText(text.slice(0, Math.max(0, i + 1)));
				setI(i + 1);
			} else {
				clearInterval(typingEffect);
			}
		}, duration);

		return () => {
			clearInterval(typingEffect);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Not my code
	}, [duration, i]);

	return (
		<h1
			className={cnMerge(
				"text-center text-4xl font-bold leading-[5rem] tracking-[-0.02em] drop-shadow-sm",
				className
			)}
		>
			{displayedText || text}
		</h1>
	);
}
