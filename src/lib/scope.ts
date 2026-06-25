// Data scope helpers — filter data based on user's permission scope
// This ensures parents only see their own children, teachers only see their class students, etc.

import { db } from "@/lib/db";
import { getSession, SessionUser } from "@/lib/session";

export interface UserScope {
  userId: string;
  tenantId: string;
  phone: string;
  roles: string[];
  isFullAccess: boolean; // Super Admin / Principal
  isParent: boolean;
  isStudent: boolean;
  isTeacher: boolean;
  // For parents: list of their children's student IDs
  childStudentIds: string[];
  // For students: their own student ID
  ownStudentId: string | null;
  // For teachers: list of class IDs they teach
  teacherClassIds: string[];
  // For teachers: list of academic level IDs they teach
  teacherLevelIds: string[];
}

/**
 * Get the current user's data scope for filtering.
 * This is the foundation of row-level security.
 */
export async function getUserScope(req?: Request): Promise<UserScope | null> {
  const session = await getSession();
  if (!session) return null;

  const isFullAccess = session.roles.includes("Super Admin") || session.roles.includes("Principal");
  const isParent = session.roles.includes("Parent");
  const isStudent = session.roles.includes("Student");
  const isTeacher = session.roles.includes("Teacher") || session.roles.includes("Warden");

  // For parents: find all children linked via Student guardianPhone
  let childStudentIds: string[] = [];
  if (isParent) {
    const parentRecords = await db.student.findMany({
      where: { guardianPhone: session.phone, tenantId: session.tenantId },
      select: { id: true },
    });
    childStudentIds = parentRecords.map((p) => p.id);
  }

  // For students: find their own student profile
  let ownStudentId: string | null = null;
  if (isStudent) {
    const student = await db.student.findFirst({
      where: { phone: session.phone, tenantId: session.tenantId },
      select: { id: true },
    });
    ownStudentId = student?.id ?? null;
  }

  // For teachers: find classes they teach
  let teacherClassIds: string[] = [];
  let teacherLevelIds: string[] = [];
  if (isTeacher) {
    const teacher = await db.teacher.findFirst({
      where: { phone: session.phone, tenantId: session.tenantId },
    });
    if (teacher) {
      const classes = await db.class.findMany({
        where: { teacherId: teacher.id, tenantId: session.tenantId },
        select: { id: true, academicLevelId: true },
      });
      teacherClassIds = classes.map((c) => c.id);
      teacherLevelIds = [...new Set(classes.map((c) => c.academicLevelId).filter(Boolean) as string[])];
    }
  }

  return {
    userId: session.userId,
    tenantId: session.tenantId,
    phone: session.phone,
    roles: session.roles,
    isFullAccess,
    isParent,
    isStudent,
    isTeacher,
    childStudentIds,
    ownStudentId,
    teacherClassIds,
    teacherLevelIds,
  };
}

/**
 * Get a Prisma where clause for filtering students based on user scope.
 * - Full access: no filter (sees all)
 * - Parent: only their children
 * - Student: only themselves
 * - Teacher: only students in their classes
 */
export function getStudentFilter(scope: UserScope) {
  if (scope.isFullAccess) return {}; // see all

  if (scope.isParent && scope.childStudentIds.length > 0) {
    return { id: { in: scope.childStudentIds } };
  }

  if (scope.isStudent && scope.ownStudentId) {
    return { id: scope.ownStudentId };
  }

  if (scope.isTeacher && scope.teacherClassIds.length > 0) {
    return { classId: { in: scope.teacherClassIds } };
  }

  // Fallback: no access
  return { id: "___NO_ACCESS___" };
}

/**
 * Get a Prisma where clause for filtering transactions/fees based on user scope.
 */
export function getTransactionFilter(scope: UserScope) {
  if (scope.isFullAccess) return {};

  if (scope.isParent && scope.childStudentIds.length > 0) {
    return { relatedStudentId: { in: scope.childStudentIds } };
  }

  if (scope.isStudent && scope.ownStudentId) {
    return { relatedStudentId: scope.ownStudentId };
  }

  // Teachers: see transactions for students in their classes
  if (scope.isTeacher && scope.teacherClassIds.length > 0) {
    return { student: { classId: { in: scope.teacherClassIds } } };
  }

  return { id: "___NO_ACCESS___" };
}

/**
 * Check if a user can access a specific student's data.
 */
export async function canAccessStudent(scope: UserScope, studentId: string): Promise<boolean> {
  if (scope.isFullAccess) return true;
  if (scope.isParent) return scope.childStudentIds.includes(studentId);
  if (scope.isStudent) return scope.ownStudentId === studentId;
  if (scope.isTeacher) {
    if (scope.teacherClassIds.length === 0) return false;
    const student = await db.student.findFirst({
      where: { id: studentId, classId: { in: scope.teacherClassIds }, tenantId: scope.tenantId },
      select: { id: true },
    });
    return !!student;
  }
  return false;
}
