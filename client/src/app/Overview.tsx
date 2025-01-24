import MyEvents from "./MyEvents";
import PengingEvents from "./PendingEvents";

export default function Overview() {
	return (
		<div className="relative flex-1 grid-cols-2 lg:grid">
			<div>
				<h1 className="mb-4 text-center text-4xl">My Events</h1>
				<MyEvents />
			</div>
			<div>
				<h1 className="mb-4 mt-8 text-center text-4xl lg:mt-0">
					Pending Events
				</h1>
				<PengingEvents />
			</div>
		</div>
	);
}
