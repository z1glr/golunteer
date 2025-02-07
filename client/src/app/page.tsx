import MyEvents from "./MyEvents";
import PendingEvents from "./PendingEvents";

export default function Overview() {
	return (
		<div className="relative mx-auto flex-1 grid-cols-2 gap-8 lg:grid lg:max-w-screen-xl">
			<MyEvents />
			<PendingEvents />
		</div>
	);
}
