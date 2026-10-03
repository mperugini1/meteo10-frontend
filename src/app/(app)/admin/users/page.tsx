import type { Metadata } from "next";

import { UsersAdmin } from "./UsersAdmin";

export const metadata: Metadata = { title: "Usuários" };

export default function Page() {
  return <UsersAdmin />;
}
