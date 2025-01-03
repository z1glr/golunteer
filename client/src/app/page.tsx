import EventVolunteer from "./components/Overview";

export default function Home() {
	return (
		<div className="p-4 min-h-screen flex flex-col">
			<header>
				<h1 className="text-center text-8xl font-display-headline">
					Volunteer schedluer
				</h1>
			</header>
			<main className="min-h-full flex-1 flex">
				<EventVolunteer />
			</main>
		</div>
	);
}
