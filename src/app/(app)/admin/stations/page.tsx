import type { Metadata } from "next";

import { StationsAdmin } from "./StationsAdmin";

export const metadata: Metadata = { title: "Estações" };

export default function Page() {
  return <StationsAdmin />;
}
