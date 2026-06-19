// Sample CSV templates — used by the "Download Template" button in the import cards.
// Each template is a string with the header row + 2 sample data rows.
// Exported as constants so they can be reused and edited in one place.

export const STUDENTS_CSV_TEMPLATE = `name,nameArabic,rollNo,gender,phone,guardianName,guardianPhone,guardianRelation,address,bloodGroup,className
Abdullah Rahman,عبد الله,101,male,01711111111,Md. Rahman,01711111122,father,"123 Madrasa Road, Dhaka",O+,Maktab - Level 1
Ayesha Siddiqua,عائشة,102,female,01722222233,Mrs. Siddiqua,01722222244,mother,"456 College Street, Dhaka",A+,Hifz - Level 1
`;

export const TEACHERS_CSV_TEMPLATE = `name,nameArabic,phone,email,gender,designation,specialization,salary,joinDate,address
Maulana Yusuf Ahmed,يوسف,01733333344,yusuf@madrasa.edu,male,Ustadh,hifz,15000,2024-01-15,"789 Teacher Lane, Dhaka"
Maulana Ibrahim Khan,إبراهيم,01744444455,ibrahim@madrasa.edu,male,Mudarris,fiqh,18000,2023-07-01,"101 Scholar Road, Dhaka"
`;

export const STUDENTS_COLUMNS = [
  "name", "nameArabic", "rollNo", "gender", "phone",
  "guardianName", "guardianPhone", "guardianRelation",
  "address", "bloodGroup", "className",
];

export const TEACHERS_COLUMNS = [
  "name", "nameArabic", "phone", "email", "gender",
  "designation", "specialization", "salary", "joinDate", "address",
];

// Helper: trigger a browser download of a text file with the given filename + content.
export function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
