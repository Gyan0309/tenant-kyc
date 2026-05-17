import { AddPersonForm } from "@/components/add-person-form";

export default async function AddPersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ propertyId: string; roomId: string }>;
  searchParams: Promise<{ state?: string; verified?: string; role?: string }>;
}) {
  const { propertyId, roomId } = await params;
  const sp = await searchParams;

  return (
    <AddPersonForm
      propertyId={propertyId}
      roomId={roomId}
      sessionState={sp.state}
      verified={sp.verified === "1"}
      defaultRole={(sp.role as "PRIMARY" | "ROOMMATE" | "FAMILY") ?? "PRIMARY"}
    />
  );
}
