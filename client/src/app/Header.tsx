import { Link } from "@nextui-org/link";

export default function Header() {
	return (
		<div className="flex justify-center">
			<Link href="/" className="text-center text-8xl">
				<h1 className="font-display-headline">Volunteer Scheduler</h1>
			</Link>
		</div>
	);
}
