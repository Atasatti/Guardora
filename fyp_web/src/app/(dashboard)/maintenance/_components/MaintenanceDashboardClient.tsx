"use client";

import { useState } from "react";
import { MaintenanceTicket } from "@/models";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  ClipboardList,
  CheckCircle,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import MaintenanceDataTable from "./MaintenanceDataTable";
import { columns } from "./MaintenanceTableColumns";
import ViewTicketModal from "./ViewTicketModal";

export default function MaintenanceDashboardClient({
  initialTickets,
}: {
  initialTickets: MaintenanceTicket[];
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicket, setSelectedTicket] =
    useState<MaintenanceTicket | null>(null);

  // Calculate stats
  const pendingCount = tickets.filter((t) => t.status === "PENDING").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "IN_PROGRESS"
  ).length;
  const completedCount = tickets.filter((t) => t.status === "COMPLETED").length;

  // Handlers for Modal Callbacks
  const handleTicketUpdated = (updatedTicket: MaintenanceTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
    );
  };

  const handleTicketDeleted = (deletedTicketId: string) => {
    setTickets((prev) => prev.filter((t) => t._id !== deletedTicketId));
  };

  return (
    <>
      <div className="flex flex-col h-full w-full gap-6">
        {/* --- Header --- */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Maintenance Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all maintenance requests
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/maintenance/board">
              <Button variant="outline">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Kanban Board
              </Button>
            </Link>
          </div>
        </header>

        {/* --- Stat Cards --- */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Requests
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                Tickets awaiting assignment
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <ClipboardList className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressCount}</div>
              <p className="text-xs text-muted-foreground">
                Tickets currently being worked on
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
              <p className="text-xs text-muted-foreground">
                Total tickets resolved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* --- Data Table --- */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>All Maintenance Tickets</CardTitle>
            <CardDescription>
              Manage, update status, and track all maintenance requests from
              residents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MaintenanceDataTable
              columns={columns({
                onView: setSelectedTicket,
                onDelete: setSelectedTicket,
              })}
              data={tickets}
            />
          </CardContent>
        </Card>
      </div>

      {/* --- View/Update Modal --- */}
      <ViewTicketModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onTicketUpdated={handleTicketUpdated}
        onTicketDeleted={handleTicketDeleted}
      />
    </>
  );
}
