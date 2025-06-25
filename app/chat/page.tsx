export const dynamic = 'force-dynamic';
import { nanoid } from 'nanoid'; // sync version
import { Chat } from "@/components/chat";
import { AI } from "@/lib/chat/actions";
import { getMissingKeys } from "@/app/actions";

export const metadata = {
  title: "Snoldier's powered by ME Gov. Finn",
};

export default async function IndexPage() {
  const id = nanoid(); 
  const missingKeys = await getMissingKeys();

  return (
    <AI initialAIState={{ chatId: id, messages: [] }}>
      <Chat id={id} missingKeys={missingKeys} />
    </AI>
  );
}