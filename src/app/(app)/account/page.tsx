import type { Metadata } from "next";

import { AccountForm } from "./AccountForm";

export const metadata: Metadata = { title: "Minha conta" };

export default function Page() {
  return <AccountForm />;
}
