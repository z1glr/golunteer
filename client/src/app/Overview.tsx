import MyEvents from "./MyEvents";
import PengingEvents from "./PendingEvents";

export default function Overview() {
	return (
		<div className="relative flex-1">
			<div className="flex flex-wrap justify-center gap-4"></div>

			<h1 className="mb-4 text-center text-4xl">My Events</h1>
			<MyEvents />
			<h1 className="mb-4 mt-8 text-center text-4xl">
				events that I don&apos;t have entered an availability yet
			</h1>
			<PengingEvents />
		</div>
	);
}
