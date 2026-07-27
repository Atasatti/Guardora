"use client";

interface FacilityModalTabsProps {
  activeTab: "details" | "reservations";
  onTabChange: (tab: "details" | "reservations") => void;
  reservationsCount: number;
}

export default function FacilityModalTabs({
  activeTab,
  onTabChange,
  reservationsCount,
}: FacilityModalTabsProps) {
  return (
    <div className="border-b">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => onTabChange("details")}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === "details"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Facility Details
        </button>
        <button
          onClick={() => onTabChange("reservations")}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === "reservations"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Reservations ({reservationsCount})
        </button>
      </nav>
    </div>
  );
}
