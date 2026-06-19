// Health module shared types
export type HealthRecord = {
  id: string;
  recordType: string;
  date: string;
  description: string;
  diagnosis: string | null;
  treatment: string | null;
  medication: string | null;
  doctorName: string | null;
  followUpDate: string | null;
  severity: string;
  status: string;
  student: { id: string; name: string; rollNo: string | null };
};

export type Vaccination = {
  id: string;
  vaccineName: string;
  doseNumber: number;
  dateAdministered: string;
  nextDue: string | null;
  administeredBy: string | null;
  batchNumber: string | null;
  student: { id: string; name: string; rollNo: string | null };
};

export type HealthData = {
  records: HealthRecord[];
  vaccinations: Vaccination[];
  kpis: {
    totalRecords: number;
    vaccinationRate: number;
    vaccinatedStudents: number;
    followupsDue: number;
    activeStudents: number;
  };
};
