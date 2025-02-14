/* eslint-disable react-refresh/only-export-components -- Not relevant in Next.js */

import type { ImageResponseOptions } from "next/dist/compiled/@vercel/og/types";
import { ImageResponse } from "next/og";
import type { ReactElement, ReactNode } from "react";

type GenerateProps = {
	description?: ReactNode;
	icon?: ReactNode;
	primaryColor?: string;
	primaryTextColor?: string;
	site?: ReactNode;
	title: ReactNode;
};

export function generateOGImage(options: GenerateProps & ImageResponseOptions): ImageResponse {
	const { description, icon, primaryColor, primaryTextColor, site, title, ...rest } = options;

	return new ImageResponse(
		generate({
			description,
			icon,
			primaryColor,
			primaryTextColor,
			site,
			title,
		}),
		{
			height: 630,
			width: 1200,
			...rest,
		}
	);
}

export function generate({
	primaryColor = "rgba(255,150,255,0.5)",
	primaryTextColor = "rgb(255,150,255)",
	...props
}: GenerateProps): ReactElement {
	return (
		<div
			style={{
				backgroundColor: "#0c0c0c",
				backgroundImage: `linear-gradient(to right top, ${primaryColor}, transparent)`,
				color: "white",
				display: "flex",
				flexDirection: "column",
				height: "100%",
				width: "100%",
			}}
		>
			<GridPattern
				squares={[
					[0, 3],
					[5, 3],
					[1, 2],
					[3, 0],
				]}
			/>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					height: "100%",
					padding: "4rem",
					width: "100%",
				}}
			>
				<div
					style={{
						alignItems: "center",
						color: primaryTextColor,
						display: "flex",
						flexDirection: "row",
						gap: "16px",
						marginBottom: "12px",
					}}
				>
					{props.icon}
					<p
						style={{
							fontSize: "56px",
							fontWeight: 600,
						}}
					>
						{props.site}
					</p>
				</div>

				<p
					style={{
						fontSize: "82px",
						fontWeight: 800,
					}}
				>
					{props.title}
				</p>
				<p
					style={{
						color: "rgba(240,240,240,0.7)",
						fontSize: "52px",
					}}
				>
					{props.description}
				</p>
			</div>
		</div>
	);
}

type GridPatternProps = {
	className?: string;
	height?: number;
	squares?: Array<[x: number, y: number]>;
	strokeDasharray?: number;
	width?: number;
	x?: number;
	y?: number;
};

export function GridPattern({
	height = 100,
	squares,
	strokeDasharray,
	width = 100,
	x = -1,
	y = -1,
	...props
}: GridPatternProps): ReactElement {
	return (
		<svg
			fill="rgba(156, 163, 175, 0.2)"
			stroke="rgba(156, 163, 175, 0.2)"
			style={{
				height: "100%",
				maskImage: "radial-gradient(circle at 0% 100%, white, transparent)",
				position: "absolute",
				top: 0,
				width: "100%",
			}}
			viewBox="0 0 600 400"
			{...props}
		>
			<defs>
				<pattern id="og-pattern" width={width} height={height} patternUnits="userSpaceOnUse">
					<path
						d={`M.5 ${height.toString()}V.5H${width.toString()}`}
						fill="none"
						strokeWidth={1}
						strokeDasharray={strokeDasharray}
					/>
				</pattern>
			</defs>
			<rect width="600" height="600" strokeWidth={0} fill="url(#og-pattern)" x={x} y={y} />
			{squares?.map(([itemX, itemY]) => (
				<rect
					strokeWidth="0"
					key={`${itemX.toString()}-${itemY.toString()}`}
					width={width - 1}
					height={height}
					x={itemX * width + 1}
					y={itemY * (height + 1)}
				/>
			))}
		</svg>
	);
}
