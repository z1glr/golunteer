import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	output: "export",

	rewrites: async () => ({
		beforeFiles: [],
		afterFiles: [],
		fallback: [
			{
				source: "/api/:path*",
				destination: "http://golunteer-backend:8080/api/:path*",
			},
		],
	}),
};

export default nextConfig;
