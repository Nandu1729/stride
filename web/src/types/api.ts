export type Role = 'ADMIN' | 'MEMBER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface UserSummary {
  id: string;
  email: string;
  name: string;
}

export interface MeResponse {
  user: UserSummary;
}

export interface AuthResult {
  user: UserSummary & { createdAt: string };
  token: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  role: Role;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number; members: number };
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  myRole: Role;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    id: string;
    userId: string;
    role: Role;
    joinedAt: string;
    user: UserSummary;
  }>;
  counts: { tasks: number; members: number };
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  position: number;
  createdById: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: UserSummary | null;
  createdBy: UserSummary;
  _count?: { comments: number };
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  body: string;
  createdAt: string;
  user: UserSummary;
}

export interface Dashboard {
  counts: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
    dueThisWeek: number;
  };
  byPriority: { low: number; medium: number; high: number };
  completion: number;
  overdue: Task[];
  recent: Task[];
  topAssignees: Array<{ user: UserSummary | null; count: number }>;
}
