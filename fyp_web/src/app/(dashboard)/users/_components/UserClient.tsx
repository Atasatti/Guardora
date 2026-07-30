"use client";

import React, { useState, useMemo } from "react";
import { User, Report } from "@/models";
import { getAllUsers } from "@/lib/actions";
import { getAllReports } from "@/lib/actions/reports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { PlusCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";

import UserTableRow from "./UserTableRow";
import CreateUserModal from "./CreateUserModal";
import EditUserModal from "./EditUserModal";
import ViewUserModal from "./ViewUserModal";
import DeleteUserDialog from "./DeleteUserDialog";
import ReportedUsersTable from "./ReportedUsersTable";
const ITEMS_PER_PAGE = 10;

interface UserClientProps {
  initialUsers: User[];
  initialReports: Report[];
}

export default function UserClient({
  initialUsers,
  initialReports,
}: UserClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.unitNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const refreshData = async () => {
    const [usersRes, reportsRes] = await Promise.all([
      getAllUsers(),
      getAllReports(),
    ]);

    if (usersRes.success) setUsers(usersRes.users || []);
    if (reportsRes.success) {
      setReports(reportsRes.reports?.filter((r) => r.type === "PERSON") || []);
    }

    if (usersRes.success && reportsRes.success) {
      toast.success("Data refreshed");
    }
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
        <h1 className="page-title">Resident Management</h1>
        <p className="page-description">
          Manage resident profiles, access, roles, and reported accounts.
        </p>
        </div>
      </header>

      <Tabs defaultValue="all-users" className="flex-grow flex flex-col">
        <TabsList className="mb-4 w-full sm:w-auto grid grid-cols-2 sm:flex">
          <TabsTrigger value="all-users">All Users</TabsTrigger>
          <TabsTrigger value="reported-users">
            Reported Users
            {reports.length > 0 && (
              <span className="ml-2 bg-destructive/10 text-destructive px-2 py-0.5 rounded-full text-xs font-medium">
                {reports.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* --- ALL USERS TAB --- */}
        <TabsContent value="all-users" className="flex-grow flex flex-col">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or unit..."
                className="pl-9"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>

          <div className="rounded-lg border flex-grow overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Contact
                  </TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <UserTableRow
                      key={user._id}
                      user={user}
                      onView={() => setViewUser(user)}
                      onEdit={() => setEditUser(user)}
                      onDelete={() => setDeleteUser(user)}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        {/* --- REPORTED USERS TAB --- */}
        <TabsContent value="reported-users" className="flex-grow flex flex-col">
          <ReportedUsersTable reports={reports} onRefresh={refreshData} />
        </TabsContent>
      </Tabs>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={refreshData}
      />
      {editUser && (
        <EditUserModal
          user={editUser}
          isOpen={!!editUser}
          onClose={() => setEditUser(null)}
          onUserUpdated={refreshData}
        />
      )}
      {viewUser && (
        <ViewUserModal
          user={viewUser}
          isOpen={!!viewUser}
          onClose={() => setViewUser(null)}
        />
      )}
      {deleteUser && (
        <DeleteUserDialog
          user={deleteUser}
          isOpen={!!deleteUser}
          onClose={() => setDeleteUser(null)}
          onUserDeleted={refreshData}
        />
      )}
    </div>
  );
}
