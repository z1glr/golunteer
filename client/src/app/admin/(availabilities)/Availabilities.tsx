import { colors } from "@/components/Colorselector";
import { apiCall, getAvailabilities } from "@/lib";
import { AddLarge, Edit, TrashCan } from "@carbon/icons-react";
import {
	Button,
	ButtonGroup,
	Checkbox,
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
import DeleteConfirmation from "@/components/DeleteConfirmation";
import AvailabilityChip from "@/components/AvailabilityChip";
import zustand from "@/Zustand";

export default function Availabilities() {
	const [showAddAvailability, setShowAddAvailability] = useState(false);
	const [editAvailability, setEditAvailability] = useState<Availability>();
	const [deleteAvailability, setDeleteAvailability] = useState<Availability>();

	const availabilities = useAsyncList<Availability>({
		async load() {
			return {
				items: await getAvailabilities(),
			};
		},
		async sort({ items, sortDescriptor }) {
			return {
				items: items.sort((a, b) => {
					let cmp = 0;

					switch (sortDescriptor.column) {
						case "text":
							cmp = a.name.localeCompare(b.name);
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

	function reload() {
		// clear the availabilites in the zustand
		zustand.getState().patch({ availabilities: undefined });

		// refresh the availabilites
		availabilities.reload();
	}

	async function sendDeleteAvailability(id: number | undefined) {
		if (id !== undefined) {
			const result = await apiCall("DELETE", "availabilities", { id });

			if (result.ok) {
				reload();

				setDeleteAvailability(undefined);
			}
		}
	}

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
						Name
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
						<TableRow key={availability.name}>
							<TableCell>
								<AvailabilityChip availability={availability} />
							</TableCell>
							<TableCell>
								<Checkbox isSelected={availability.enabled} />
							</TableCell>
							<TableCell>
								<ButtonGroup>
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
									<Button
										isIconOnly
										variant="light"
										size="sm"
										onPress={() => setDeleteAvailability(availability)}
										color="danger"
										className="text-danger"
									>
										<TrashCan />
									</Button>
								</ButtonGroup>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			<AddAvailability
				isOpen={showAddAvailability}
				onOpenChange={setShowAddAvailability}
				onSuccess={reload}
			/>

			<EditAvailability
				value={editAvailability}
				isOpen={!!editAvailability}
				onOpenChange={(isOpen) =>
					!isOpen ? setEditAvailability(undefined) : null
				}
				onSuccess={reload}
			/>

			<DeleteConfirmation
				isOpen={!!deleteAvailability}
				onOpenChange={(isOpen) =>
					!isOpen ? setDeleteAvailability(undefined) : null
				}
				header="Delete Availability"
				onDelete={() => sendDeleteAvailability(deleteAvailability?.id)}
			>
				{!!deleteAvailability ? (
					<>
						The availability{" "}
						<AvailabilityChip availability={deleteAvailability} /> will be
						deleted.
					</>
				) : null}
			</DeleteConfirmation>
		</div>
	);
}
