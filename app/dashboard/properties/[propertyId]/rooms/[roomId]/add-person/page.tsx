import { AddPersonForm } from "@/components/add-person-form";
import { auth } from "@/lib/auth/config";
import { listPersonsByRoom } from "@/lib/azure/repos/persons";

export default async function AddPersonPage({
  params,
}: {
  params: Promise<{ propertyId: string; roomId: string }>;
}) {
  const { propertyId, roomId } = await params;

  // Determine whether the room already has a primary tenant. The first occupant
  // is the primary; anyone added afterwards is a roommate or family member and
  // inherits the primary's address.
  const session = await auth();
  const persons = session?.user ? await listPersonsByRoom(roomId) : [];
  const primary = persons.find((p) => p.role === "PRIMARY");

  return (
    <AddPersonForm
      propertyId={propertyId}
      roomId={roomId}
      hasPrimary={!!primary}
      primaryName={primary?.name ?? ""}
      primaryAddress={primary?.address ?? ""}
    />
  );
}
