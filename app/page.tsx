export const dynamic = 'force-dynamic';
import { getMissingKeys } from "@/app/actions";
import IndexClient from "@/components/IndexClient";

export default async function Page() {
  const missingKeys = await getMissingKeys();
  return <IndexClient missingKeys={missingKeys} />;
}
