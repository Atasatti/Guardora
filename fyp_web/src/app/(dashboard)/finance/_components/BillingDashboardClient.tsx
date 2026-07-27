"use client";

import { useCallback, useState } from "react";
import { Bill, BillingStats } from "@/models";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Users,
  DollarSign,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import BillingDataTable from "./BillingDataTable";
import { useBillingColumns } from "./BillingTableColumns";
import CreateBillModal from "./CreateBillModal";
import CreateBulkBillModal from "./CreateBulkBillModal";
import ViewBillModal from "./ViewBillModal";

interface BillingDashboardClientProps {
  initialBills: Bill[];
  initialStats: BillingStats;
}

export default function BillingDashboardClient({
  initialBills,
  initialStats,
}: BillingDashboardClientProps) {
  const [bills, setBills] = useState(initialBills);
  const [stats, setStats] = useState(initialStats);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Handlers for Modal Callbacks
  const handleBillCreated = (newBill: Bill) => {
    setBills((prev) => [newBill, ...prev]);
    updateStatsAfterChange(newBill.amount, false);
  };

  const handleBulkBillsCreated = (newBills: Bill[]) => {
    setBills((prev) => [...newBills, ...prev]);
    const totalAmount = newBills.reduce((sum, bill) => sum + bill.amount, 0);
    updateStatsAfterChange(totalAmount, false, newBills.length);
  };

  const handleBillUpdated = (updatedBill: Bill) => {
    setBills((prev) => {
      const previousBill = prev.find((b) => b._id === updatedBill._id);

      if (previousBill) {
        const amountChange = updatedBill.amount - previousBill.amount;
        const statusChange = updatedBill.isCleared !== previousBill.isCleared;

        if (amountChange !== 0 || statusChange) {
          updateStatsAfterChange(amountChange, statusChange);
        }
      }

      return prev.map((b) => (b._id === updatedBill._id ? updatedBill : b));
    });
  };

  const handleBillDeleted = (
    deletedBillId: string,
    deletedBillAmount: number,
    wasCleared: boolean
  ) => {
    setBills((prev) => prev.filter((b) => b._id !== deletedBillId));
    updateStatsAfterChange(-deletedBillAmount, wasCleared, -1);
  };

  const updateStatsAfterChange = (
    amountChange: number,
    statusChange?: boolean,
    countChange: number = 0
  ) => {
    setStats((prev) => {
      const newStats = { ...prev };
      newStats.totalAmount += amountChange;
      newStats.totalBills += countChange;

      if (statusChange) {
        newStats.pendingBills += countChange > 0 ? -1 : 1;
        newStats.clearedBills += countChange > 0 ? 1 : -1;
        newStats.pendingAmount += amountChange;
      } else if (countChange > 0) {
        // New bill added, assume pending
        newStats.pendingBills += countChange;
        newStats.pendingAmount += amountChange;
      } else if (countChange < 0) {
        // Bill deleted, need to know if it was cleared
        // For simplicity, we assume it was pending
        newStats.pendingBills += countChange;
        newStats.pendingAmount += amountChange;
      }

      return newStats;
    });
  };

  const handleViewBill = useCallback((bill: Bill) => {
    setSelectedBill(bill);
  }, []);

  const handleDeleteBill = useCallback((bill: Bill) => {
    setSelectedBill(bill);
  }, []);

  // Now pass the stable functions
  const columns = useBillingColumns({
    onView: handleViewBill,
    onDelete: handleDeleteBill,
  });

  return (
    <>
      <div className="flex flex-col h-full w-full gap-6">
        {/* --- Header --- */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Billing & Finance</h1>
            <p className="text-muted-foreground mt-1">
              Manage resident bills and track payments
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsBulkModalOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Bulk Create
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Bill
            </Button>
          </div>
        </header>

        {/* --- Stat Cards --- */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBills}</div>
              <p className="text-xs text-muted-foreground">All time bills</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Bills
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingBills}</div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Cleared Bills
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clearedBills}</div>
              <p className="text-xs text-muted-foreground">Paid bills</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Amount
              </CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.pendingAmount}</div>
              <p className="text-xs text-muted-foreground">Total pending</p>
            </CardContent>
          </Card>
        </div>

        {/* --- Data Table --- */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>All Bills</CardTitle>
            <CardDescription>
              Manage, track, and update resident bills and payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BillingDataTable columns={columns} data={bills} />
          </CardContent>
        </Card>
      </div>

      {/* --- Modals --- */}
      <CreateBillModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onBillCreated={handleBillCreated}
      />

      <CreateBulkBillModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onBillsCreated={handleBulkBillsCreated}
      />

      <ViewBillModal
        bill={selectedBill}
        isOpen={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        onBillUpdated={handleBillUpdated}
        onBillDeleted={handleBillDeleted}
      />
    </>
  );
}
