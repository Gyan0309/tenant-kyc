import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { listPropertiesByOwner } from "@/lib/azure/repos/properties";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  const ownerId = session!.user!.id;
  const properties = await listPropertiesByOwner(ownerId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
          <p className="text-muted-foreground text-sm">
            Manage your rental properties and tenant verification
          </p>
        </div>
        <Link href="/properties/new" className={cn(buttonVariants())}>
          Add property
        </Link>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No properties yet</CardTitle>
            <CardDescription>
              Create your first property to start adding rooms and tenants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/properties/new" className={cn(buttonVariants())}>
              Create property
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Link key={p.rowKey} href={`/properties/${p.rowKey}`}>
              <Card className="hover:border-primary/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                  <CardDescription>
                    {p.address}, {p.city}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {p.totalRooms > 0
                      ? `${p.totalRooms} rooms configured`
                      : "View rooms"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


