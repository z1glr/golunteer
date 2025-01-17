"use client";

import { Tab, Tabs } from "@heroui/react";
import Users from "./Users";
import Availabilities from "./Availabilities";

export default function AdminDashboard() {
	return (
		<div className="flex flex-col items-center">
			<Tabs color="primary">
				<Tab title="Users">
					<Users />
				</Tab>
				<Tab title="Tasks">Tasks</Tab>
				<Tab title="Availabilities"><Availabilities /></Tab>
			</Tabs>
		</div>
	);
}
