import {
	RadioGroup,
	RadioProps,
	useRadio,
	VisuallyHidden,
} from "@heroui/react";

export const colors = [
	{ value: "Red", tailwind: "red-600" },
	{ value: "Orange", tailwind: "orange-600" },
	{ value: "Amber", tailwind: "amber-600" },
	{ value: "Yellow", tailwind: "yellow-600" },
	{ value: "Lime", tailwind: "lime-600" },
	{ value: "Green", tailwind: "green-600" },
	{ value: "Emerald", tailwind: "emerald-600" },
	{ value: "Teal", tailwind: "teal-600" },
	{ value: "Cyan", tailwind: "cyan-600" },
	{ value: "Sky", tailwind: "sky-600" },
	{ value: "Blue", tailwind: "blue-600" },
	{ value: "Indigo", tailwind: "indigo-600" },
	{ value: "Violet", tailwind: "violet-600" },
	{ value: "Purple", tailwind: "purple-600" },
	{ value: "Fuchsia", tailwind: "fuchsia-600" },
	{ value: "Pink", tailwind: "pink-600" },
];

export function color2Tailwind(v: string): string | undefined {
	const find = colors.find((c) => c.value === v)?.tailwind;

	return find;
}

export default function ColorSelector(props: {
	name?: string;
	value?: string;
	onValueChange?: (value: string) => void;
}) {
	return (
		<RadioGroup
			value={props.value}
			onValueChange={props.onValueChange}
			classNames={{ wrapper: "grid grid-cols-4" }}
			name={props.name}
		>
			{colors.map((color) => (
				<ColorRadio
					description={color.value}
					value={color.value}
					key={color.value}
					radiocolor={`bg-${color.tailwind}`}
				>
					<div>{color.value}</div>
				</ColorRadio>
			))}
		</RadioGroup>
	);
}

function ColorRadio(props: { radiocolor: string } & RadioProps) {
	const { Component, children, getBaseProps, getInputProps } = useRadio(props);

	return (
		<Component
			{...getBaseProps()}
			className={`aspect-square cursor-pointer rounded-lg border-2 border-default text-foreground transition tap-highlight-transparent hover:opacity-70 active:opacity-50 data-[selected=true]:border-2 data-[selected=true]:border-stone-300 ${props.radiocolor} flex select-none items-center justify-center p-1 text-sm`}
		>
			<VisuallyHidden>
				<input {...getInputProps()} />
			</VisuallyHidden>
			{children}
		</Component>
	);
}
