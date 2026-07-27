"use client";

import { useState } from "react";
import { Facility } from "@/models";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Users, Clock, DollarSign } from "lucide-react";
import FacilitiesDataTable from "./FacilitiesDataTable";
import { columns } from "./FacilitiesTableColumns";
import CreateFacilityModal from "./CreateFacilityModal";
import ViewFacilityModal from "./ViewFacilityModal";

export default function FacilitiesDashboardClient({
  initialFacilities,
}: {
  initialFacilities: Facility[];
}) {
  const [facilities, setFacilities] = useState(initialFacilities);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null
  );

  // Calculate stats
  const totalFacilities = facilities.length;
  const paidFacilities = facilities.filter((f) => f.isPaidService).length;
  const totalCapacity = facilities.reduce((sum, f) => sum + f.totalCapacity, 0);
  const availableCapacity = facilities.reduce(
    (sum, f) => sum + f.availableCapacity,
    0
  );

  // Handlers for Modal Callbacks
  const handleFacilityCreated = (newFacility: Facility) => {
    setFacilities((prev) => [...prev, newFacility]);
  };

  const handleFacilityUpdated = (updatedFacility: Facility) => {
    setFacilities((prev) =>
      prev.map((f) => (f._id === updatedFacility._id ? updatedFacility : f))
    );
  };

  const handleFacilityDeleted = (deletedFacilityId: string) => {
    setFacilities((prev) => prev.filter((f) => f._id !== deletedFacilityId));
  };

  return (
    <>
      <div className="flex flex-col h-full w-full gap-6">
        {/* --- Header --- */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Facilities Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage residential society facilities and their availability
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Facility
          </Button>
        </header>

        {/* --- Stat Cards --- */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Facilities
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFacilities}</div>
              <p className="text-xs text-muted-foreground">
                Available facilities
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Paid Services
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paidFacilities}</div>
              <p className="text-xs text-muted-foreground">
                Premium facilities
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Capacity
              </CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCapacity}</div>
              <p className="text-xs text-muted-foreground">Maximum occupancy</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Slots
              </CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableCapacity}</div>
              <p className="text-xs text-muted-foreground">
                Current availability
              </p>
            </CardContent>
          </Card>
        </div>

        {/* --- Data Table --- */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>All Facilities</CardTitle>
            <CardDescription>
              Manage, update, and track all residential society facilities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FacilitiesDataTable
              columns={columns({
                onView: setSelectedFacility,
                onDelete: setSelectedFacility,
              })}
              data={facilities}
            />
          </CardContent>
        </Card>
      </div>

      {/* --- Modals --- */}
      <CreateFacilityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onFacilityCreated={handleFacilityCreated}
      />

      <ViewFacilityModal
        facility={selectedFacility}
        isOpen={!!selectedFacility}
        onClose={() => setSelectedFacility(null)}
        onFacilityUpdated={handleFacilityUpdated}
        onFacilityDeleted={handleFacilityDeleted}
      />
    </>
  );
}
