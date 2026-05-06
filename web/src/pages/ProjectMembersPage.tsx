import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, extractErrorMessage } from '../lib/api';
import { useProjectContext } from '../layout/ProjectShell';
import type { ProjectDetail, Role, UserSummary } from '../types/api';
import { Avatar } from '../ui/Avatar';
import { RoleBadge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { useToast } from '../ui/ToastProvider';

interface MemberRow {
  id: string;
  userId: string;
  role: Role;
  joinedAt: string;
  user: UserSummary;
}

export function ProjectMembersPage() {
  const { project } = useProjectContext();
  const queryClient = useQueryClient();
  const toast = useToast();

  const membersQuery = useQuery({
    queryKey: ['project-members', project.id],
    queryFn: async () => {
      const { data } = await api.get<{ members: MemberRow[] }>(`/projects/${project.id}/members`);
      return data.members;
    },
    initialData: project.members,
  });

  const invite = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: Role }) => {
      const { data } = await api.post<{ member: MemberRow }>(`/projects/${project.id}/members`, {
        email,
        role,
      });
      return data.member;
    },
    onSuccess: () => {
      toast.push('Invitation sent', 'success');
      queryClient.invalidateQueries({ queryKey: ['project-members', project.id] });
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
    },
    onError: (err) => toast.push(extractErrorMessage(err, 'Could not invite'), 'error'),
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) => {
      await api.patch(`/projects/${project.id}/members/${userId}`, { role });
    },
    onSuccess: () => {
      toast.push('Role updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['project-members', project.id] });
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
    },
    onError: (err) => toast.push(extractErrorMessage(err, 'Could not update role'), 'error'),
  });

  const remove = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/projects/${project.id}/members/${userId}`);
    },
    onSuccess: () => {
      toast.push('Member removed', 'success');
      queryClient.invalidateQueries({ queryKey: ['project-members', project.id] });
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
    },
    onError: (err) => toast.push(extractErrorMessage(err, 'Could not remove member'), 'error'),
  });

  const isAdmin = project.myRole === 'ADMIN';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="card overflow-hidden">
        <header className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-ink-800">Team</h2>
            <p className="text-xs text-ink-500">
              {membersQuery.data?.length ?? 0} member
              {(membersQuery.data?.length ?? 0) === 1 ? '' : 's'}
            </p>
          </div>
        </header>
        {membersQuery.isLoading ? (
          <div className="grid h-32 place-items-center">
            <Spinner />
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {membersQuery.data?.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={m.user.name} />
                  <div>
                    <div className="text-sm font-medium text-ink-800">{m.user.name}</div>
                    <div className="text-xs text-ink-500">{m.user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isAdmin && m.userId !== project.ownerId ? (
                    <select
                      className="input w-32"
                      value={m.role}
                      onChange={(e) =>
                        updateRole.mutate({ userId: m.userId, role: e.target.value as Role })
                      }
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  ) : (
                    <RoleBadge role={m.role} />
                  )}
                  {isAdmin && m.userId !== project.ownerId && (
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={() => {
                        if (confirm(`Remove ${m.user.name} from this project?`)) {
                          remove.mutate(m.userId);
                        }
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin ? (
        <InvitePanel
          onInvite={(email, role) => invite.mutate({ email, role })}
          submitting={invite.isPending}
          project={project}
        />
      ) : (
        <aside className="card p-5 text-sm text-ink-500">
          Only project admins can invite or remove members.
        </aside>
      )}
    </div>
  );
}

function InvitePanel({
  onInvite,
  submitting,
  project,
}: {
  onInvite: (email: string, role: Role) => void;
  submitting: boolean;
  project: ProjectDetail;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('MEMBER');

  return (
    <aside className="card p-5">
      <h2 className="text-sm font-semibold text-ink-800">Invite a teammate</h2>
      <p className="mt-1 text-xs text-ink-500">
        They must have a Stride account on the same email. {project.members.length} on the team
        right now.
      </p>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.trim()) return;
          onInvite(email.trim().toLowerCase(), role);
          setEmail('');
        }}
      >
        <div>
          <label className="label" htmlFor="invite-email">
            Email
          </label>
          <input
            id="invite-email"
            type="email"
            className="input mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@team.app"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="invite-role">
            Role
          </label>
          <select
            id="invite-role"
            className="input mt-1"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="MEMBER">Member — works the board</option>
            <option value="ADMIN">Admin — manages the project</option>
          </select>
        </div>
        <button type="submit" disabled={submitting || !email.trim()} className="btn-primary w-full justify-center">
          {submitting ? 'Sending invite…' : 'Send invite'}
        </button>
      </form>
    </aside>
  );
}
