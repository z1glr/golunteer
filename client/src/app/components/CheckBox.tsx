import { CheckboxChecked, Checkbox } from "@carbon/icons-react";
import { MouseEventHandler } from "react";

export default function CheckBox(props: {
	state: boolean;
	onClick?: MouseEventHandler<HTMLDivElement>;
}) {
	return (
		<div onClick={props.onClick} className="inline-block cursor-pointer">
			{props.state ? <CheckboxChecked /> : <Checkbox />}
		</div>
	);
}
