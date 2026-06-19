// Shared types for the Transport module
export type Vehicle = {
  id: string;
  registration: string;
  type: string;
  capacity: number;
  driverName: string;
  driverPhone: string | null;
  routeName: string | null;
  isActive: boolean;
  occupancy: number;
};

export type Route = {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  distanceKm: number;
  monthlyFee: number;
  stops: string[];
  allocatedCount: number;
};

export type Allocation = {
  id: string;
  isActive: boolean;
  pickupPoint: string | null;
  allocatedAt: string;
  student: { id: string; name: string; rollNo: string | null };
  vehicle: { id: string; registration: string; type: string };
  route: { id: string; name: string; monthlyFee: number };
};

export type TransportData = {
  vehicles: Vehicle[];
  routes: Route[];
  allocations: Allocation[];
  kpis: {
    activeVehicles: number;
    totalRoutes: number;
    allocatedStudents: number;
    totalCapacity: number;
    activeStudents: number;
  };
};
