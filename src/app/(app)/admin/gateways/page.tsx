import type { Metadata } from "next";

import { GatewaysAdmin } from "./GatewaysAdmin";

export const metadata: Metadata = { title: "Gateways" };

export default function Page() {
  return <GatewaysAdmin />;
}
