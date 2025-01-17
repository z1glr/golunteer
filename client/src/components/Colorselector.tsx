import {
	RadioGroup,
	RadioProps,
	useRadio,
	VisuallyHidden,
} from "@heroui/react";

export default function ColorSelector() {
	const colors = [
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

	return (
		<RadioGroup classNames={{ wrapper: "grid grid-cols-4" }}>
			{colors.map((color) => (
				<ColorRadio
					description={color.value}
					value={color.value}
					key={color.value}
					radioColor={`bg-${color.tailwind}`}
				>
					<div>{color.value}</div>
				</ColorRadio>
			))}
		</RadioGroup>
	);
}

function ColorRadio(props: { radioColor: string } & RadioProps) {
	const { Component, children, getBaseProps, getInputProps } = useRadio(props);

	return (
		<Component
			{...getBaseProps()}
			className={`aspect-square cursor-pointer rounded-lg border-2 border-default tap-highlight-transparent hover:opacity-70 active:opacity-50 data-[selected=true]:border-primary ${props.radioColor} flex items-center justify-center p-1`}
		>
			<VisuallyHidden>
				<input {...getInputProps()} />
			</VisuallyHidden>
			{children}
		</Component>
	);
}
