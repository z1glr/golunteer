"use client";

import { Tab, Tabs } from "@heroui/react";
import Users from "./(users)/Users";
import Availabilities from "./(availabilities)/Availabilities";
import Tasks from "./(tasks)/Tasks";

export default function AdminDashboard() {
	return (
		<div className="flex flex-col items-center">
			<Tabs variant="bordered" color="primary" size="lg">
				<Tab title="Users">
					<Users />
				</Tab>
				<Tab title="Tasks">
					<Tasks />
				</Tab>
				<Tab title="Availabilities">
					<Availabilities />
				</Tab>
			</Tabs>
		</div>
	);
}
