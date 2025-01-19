import { color2Tailwind, colors } from "@/components/Colorselector";
import { apiCall } from "@/lib";
import { AddLarge, Edit } from "@carbon/icons-react";
import {
	Button,
	Checkbox,
	Chip,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Tooltip,
} from "@heroui/react";
import { useAsyncList } from "@react-stately/data";
import { useState } from "react";
import AddAvailability from "./AddAvailability";
import { Availability } from "./AvailabilityEditor";
import EditAvailability from "./EditAvailability";

export default function Availabilities() {
	const [showAddAvailability, setShowAddAvailability] = useState(false);
	const [editAvailability, setEditAvailability] = useState<Availability>();

	const availabilities = useAsyncList<Availability>({
		async load() {
			const result = await apiCall("GET", "availabilities");

			if (result.ok) {
				const json = await result.json();

				return {
					items: json.availabilities,
				};
			} else {
				return {
					items: [],
				};
			}
		},
		async sort({ items, sortDescriptor }) {
			return {
				items: items.sort((a, b) => {
					let cmp = 0;

					switch (sortDescriptor.column) {
						case "text":
							cmp = a.text.localeCompare(b.text);
							break;
						case "enabled":
							if (a.enabled && !b.enabled) {
								cmp = -1;
							} else if (!a.enabled && b.enabled) {
								cmp = 1;
							}
							break;
						case "color":
							const aIndex = colors.findIndex((c) => c.value === a.color);
							const bIndex = colors.findIndex((c) => c.value === a.color);

							if (aIndex > bIndex) {
								cmp = -1;
							} else {
								cmp = 1;
							}
					}

					if (sortDescriptor.direction === "descending") {
						cmp *= -1;
					}

					return cmp;
				}),
			};
		},
	});

	const topContent = (
		<>
			<Button
				color="primary"
				startContent={<AddLarge />}
				onPress={() => setShowAddAvailability(true)}
			>
				Add Availability
			</Button>
		</>
	);

	return (
		<div>
			<Table
				aria-label="Table with the availabilites"
				shadow="none"
				isHeaderSticky
				isStriped
				topContent={topContent}
				sortDescriptor={availabilities.sortDescriptor}
				onSortChange={availabilities.sort}
			>
				<TableHeader>
					<TableColumn allowsSorting key="userName">
						Text
					</TableColumn>
					<TableColumn allowsSorting key="color" align="center">
						Color
					</TableColumn>
					<TableColumn allowsSorting key="admin" align="center">
						Enabled
					</TableColumn>
					<TableColumn key="edit" align="center">
						Edit
					</TableColumn>
				</TableHeader>
				<TableBody items={availabilities.items}>
					{(availability) => (
						<TableRow key={availability.text}>
							<TableCell
								className={`text-${color2Tailwind(availability.color)}`}
							>
								{availability.text}
							</TableCell>
							<TableCell>
								<Chip
									classNames={{
										base: `bg-${color2Tailwind(availability.color)}`,
									}}
								>
									{availability.color}
								</Chip>
							</TableCell>
							<TableCell>
								<Checkbox isSelected={availability.enabled} />
							</TableCell>
							<TableCell>
								<Button
									isIconOnly
									variant="light"
									size="sm"
									onPress={() => setEditAvailability(availability)}
								>
									<Tooltip content="Edit availability">
										<Edit />
									</Tooltip>
								</Button>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			<AddAvailability
				isOpen={showAddAvailability}
				onOpenChange={setShowAddAvailability}
				onSuccess={availabilities.reload}
			/>

			<EditAvailability
				value={editAvailability}
				isOpen={!!editAvailability}
				onOpenChange={(isOpen) =>
					!isOpen ? setEditAvailability(undefined) : null
				}
				onSuccess={availabilities.reload}
			/>
		</div>
	);
}
