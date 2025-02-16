import { memo } from "react";

type RippleProps = {
	mainCircleOpacity?: number;
	mainCircleSize?: number;
	numCircles?: number;
};

function Ripple(props: RippleProps) {
	const { mainCircleOpacity = 0.2, mainCircleSize = 310, numCircles = 20 } = props;

	return (
		<div
			className="absolute inset-0 overflow-hidden bg-white/5
				[mask-image:linear-gradient(to_bottom,white,transparent)]"
		>
			{Array.from({ length: numCircles }, (_, i) => {
				const size = mainCircleSize + i * 70;
				const opacity = mainCircleOpacity - i * 0.03;
				const animationDelay = `${i * 0.06}s`;
				const borderStyle = i === numCircles - 1 ? "dashed" : "solid";
				const borderOpacity = 5 + i * 5;

				return (
					<div
						key={i}
						className="bg-fd-foreground/25 animate-ripple absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border shadow-xl"
						style={
							{
								"--i": i,
								animationDelay,
								borderColor: `rgba(var(--foreground-rgb), ${borderOpacity / 100})`,
								borderRadius: "50%",
								borderStyle,
								borderWidth: "1px",
								height: `${size}px`,
								opacity,
								width: `${size}px`,
							} as React.CSSProperties
						}
					/>
				);
			})}
		</div>
	);
}

export default memo(Ripple);
