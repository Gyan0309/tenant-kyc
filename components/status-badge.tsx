import { Badge } from "@/components/ui/badge";
import type { RoomStatus } from "@/lib/types/enums";

const variants: Record<RoomStatus, "default" | "secondary" | "outline"> = {
  VACANT: "outline",
  PARTIAL: "secondary",
  OCCUPIED: "default",
};

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  return <Badge variant={variants[status]}>{status}</Badge>;
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <Badge variant={verified ? "default" : "secondary"}>
      {verified ? "DigiLocker verified" : "Unverified"}
    </Badge>
  );
}
