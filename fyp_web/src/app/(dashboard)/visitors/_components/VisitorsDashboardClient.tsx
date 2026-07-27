"use client";

import { useState } from "react";
import { Visitor } from "@/models";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Users, UserCheck, Clock, ShieldCheck } from "lucide-react";
import VisitorsDataTable from "./VisitorsDataTable";
import { columns } from "./VisitorsTableColumns";
import CreateVisitorModal from "./CreateVisitorModal";
import ViewVisitorModal from "./ViewVisitorModal";

export default function VisitorsDashboardClient({
  initialVisitors,
}: {
  initialVisitors: Visitor[];
}) {
  const [visitors, setVisitors] = useState(initialVisitors);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  const totalVisitors = visitors.length;
  const activePasses = visitors.filter((v) => v.status === "ACTIVE").length;
  const expiredPasses = totalVisitors - activePasses;
  const guestsCount = visitors.filter((v) => v.type === "GUEST").length;

  const handleCreated = (newVisitor: Visitor) => {
    setVisitors((prev) => [newVisitor, ...prev]);
  };

  const handleUpdated = (updatedVisitor: Visitor) => {
    setVisitors((prev) =>
      prev.map((v) => (v._id === updatedVisitor._id ? updatedVisitor : v))
    );
  };

  const handleDeleted = (id: string) => {
    setVisitors((prev) => prev.filter((v) => v._id !== id));
  };

  return (
    <>
      <div className="flex flex-col h-full w-full gap-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Visitor Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage entry passes for guests, deliveries, and services.
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Issue Pass
          </Button>
        </header>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Visitors
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVisitors}</div>
              <p className="text-xs text-muted-foreground">
                Total passes created
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Passes
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePasses}</div>
              <p className="text-xs text-muted-foreground">Valid for entry</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Guests</CardTitle>
              <ShieldCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{guestsCount}</div>
              <p className="text-xs text-muted-foreground">Personal guests</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expired/Past
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiredPasses}</div>
              <p className="text-xs text-muted-foreground">History</p>
            </CardContent>
          </Card>
        </div>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Visitor Passes</CardTitle>
            <CardDescription>
              View and manage all generated entry codes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VisitorsDataTable
              columns={columns({
                onView: setSelectedVisitor,
                onDelete: setSelectedVisitor,
              })}
              data={visitors}
            />
          </CardContent>
        </Card>
      </div>

      <CreateVisitorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreated}
      />

      <ViewVisitorModal
        visitor={selectedVisitor}
        isOpen={!!selectedVisitor}
        onClose={() => setSelectedVisitor(null)}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </>
  );
}
