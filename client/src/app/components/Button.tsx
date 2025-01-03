import React, { MouseEventHandler } from "react";

export default function Button(props: {
	children: React.ReactNode;
	className?: string;
	onClick?: MouseEventHandler<HTMLDivElement>;
}) {
	return (
		<div
			onClick={props.onClick}
			className={`${props.className ?? ""} inline-block cursor-pointer rounded-full bg-accent-2 p-2`}
		>
			{props.children}
		</div>
	);
}
