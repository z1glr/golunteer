import { SwitchProps, useSwitch, VisuallyHidden } from "@nextui-org/react";
import React from "react";

export default function CheckboxIcon(props: SwitchProps) {
	const {
		Component,
		slots,
		isSelected,
		getBaseProps,
		getInputProps,
		getWrapperProps,
	} = useSwitch(props);

	return (
		<Component {...getBaseProps()}>
			<VisuallyHidden>
				<input {...getInputProps()} />
			</VisuallyHidden>
			<div
				{...getWrapperProps()}
				className={slots.wrapper({
					class: [
						"h-8 w-8",
						"flex items-center justify-center",
						"rounded-lg bg-default-100 hover:bg-default-200",
					],
				})}
			>
				{isSelected ? props.startContent : props.endContent}
			</div>
		</Component>
	);
}
