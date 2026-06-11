/**
 * PageClassroomCollaborators — Figma node 3756-697
 *
 * Displays teacher-role members across the teacher's owned classes,
 * de-duplicated by user_id. Each row shows:
 *  - Avatar (pastel initials or photo)
 *  - Name + email
 *  - Role badge: "Owner" (class owner_id) or "Teacher"
 *  - Classes count: number of the teacher's owned classes this person belongs to
 *  - Status pill: always "Active" (no invited-collaborator backing in schema)
 *  - ⋮ row menu (styled; no mutation actions wired — no service for collaborator ops)
 *
 * Data reality:
 *  - Role    — REAL: Owner/Teacher derived from owner_id vs teacher-role member
 *  - Classes — REAL: counted from actual class memberships
 *  - Status  — PLACEHOLDER: always "Active"; no "Invited" state in schema
 *  - Invite button — PLACEHOLDER: opens a modal with the current user's
 *    invite links (one per owned class), reusing the invite-code pattern from
 *    classroom detail. No new mutations wired.
 */

import { useState } from "react";
import { Dropdown, Modal } from "antd";
import { AppShell } from "@/widgets/layouts";
import type { Classroom } from "~services/types/classroom";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CollaboratorRow = {
  user_id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  /** "Owner" = is owner_id of at least one class; "Teacher" = teacher-role member */
  role: "Owner" | "Teacher";
  /** How many of the teacher's owned classes this person belongs to */
  class_count: number;
};

type Props = {
  collaborators: CollaboratorRow[];
  /** The teacher's owned classrooms (for invite modal) */
  ownedClassrooms: Pick<Classroom, "id" | "name" | "invite_code">[];
};

// ── Avatar helpers ─────────────────────────────────────────────────────────────

const TINT_PAIRS: [string, string][] = [
  ["#F6CDD0", "#D94A56"],
  ["#E0EBFF", "#2A5BB1"],
  ["#E5F8EC", "#16A34A"],
  ["#F1EAFC", "#7C3AED"],
  ["#FEF4E2", "#B45309"],
  ["#F2FADD", "#5B8A00"],
  ["#EEF3FF", "#5281F9"],
];

const tintFor = (key: string): [string, string] =>
  TINT_PAIRS[[...key].reduce((a, c) => a + c.charCodeAt(0), 0) % TINT_PAIRS.length];

const avatarInitial = (name: string | null, email: string): string =>
  ((name || email || "?").trim().charAt(0).toUpperCase());

// ── Role badge ─────────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<"Owner" | "Teacher", string> = {
  Owner:   "bg-[#F2FADD] text-[#5B8A00] border border-[#B3E653]",
  Teacher: "bg-[#EEF3FF] text-[#5281F9] border border-[#C7D8FE]",
};

const RoleBadge = ({ role }: { role: "Owner" | "Teacher" }) => (
  <span
    className={`inline-flex h-[26px] items-center rounded-full px-[10px] text-[12px] font-semibold ${ROLE_STYLES[role]}`}
  >
    {role}
  </span>
);

// ── Status pill ────────────────────────────────────────────────────────────────

// Status is always "Active" — no invited-collaborator state in schema.
const ActivePill = () => (
  <span className="inline-flex items-center gap-[6px] rounded-full bg-[#E5F8EC] px-[10px] py-[5px] text-[12px] font-semibold text-[#16A34A] whitespace-nowrap">
    <span className="h-[6px] w-[6px] rounded-full bg-[#16A34A] flex-shrink-0" />
    Active
  </span>
);

// ── Collaborator table row ─────────────────────────────────────────────────────

const CollaboratorTableRow = ({ row }: { row: CollaboratorRow }) => {
  const [bg, fg] = tintFor(row.user_id);
  const displayName = row.name || row.email || "—";

  return (
    <div className="flex items-center gap-0 border-b border-[#E5E6E8] last:border-b-0 px-[20px] py-[16px] hover:bg-[#FAFAFA] transition-colors">
      {/* Name column */}
      <div className="flex items-center gap-[12px] flex-1 min-w-0">
        {row.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.avatar_url}
            alt=""
            className="h-[40px] w-[40px] rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <span
            className="flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-full text-[15px] font-bold"
            style={{ background: bg, color: fg }}
          >
            {avatarInitial(row.name, row.email)}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-inter font-semibold text-[14px] text-[#191D24] truncate leading-snug">
            {displayName}
          </p>
          <p className="font-inter font-normal text-[12px] text-[#6A7282] truncate leading-snug">
            {row.email}
          </p>
        </div>
      </div>

      {/* Role column — w-[140px] */}
      <div className="w-[140px] flex-shrink-0">
        <RoleBadge role={row.role} />
      </div>

      {/* Classes column — w-[140px] */}
      <div className="w-[140px] flex-shrink-0">
        <span className="font-inter font-medium text-[14px] text-[#191D24]">
          {row.class_count} {row.class_count === 1 ? "class" : "classes"}
        </span>
      </div>

      {/* Status column — w-[140px] */}
      <div className="w-[140px] flex-shrink-0">
        <ActivePill />
      </div>

      {/* ⋮ menu — w-[40px] */}
      <div className="w-[40px] flex-shrink-0 flex items-center justify-center">
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              { key: "view", label: "View profile" },
              { key: "change-role", label: "Change role", disabled: true },
              { type: "divider" },
              { key: "remove", label: "Remove", danger: true, disabled: true },
            ],
          }}
        >
          <button
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#6A7282] hover:bg-[#F3F4F6] transition-colors"
            aria-label="More actions"
          >
            <span className="material-symbols-rounded text-[20px]">more_vert</span>
          </button>
        </Dropdown>
      </div>
    </div>
  );
};

// ── Table header ───────────────────────────────────────────────────────────────

const TableHeader = () => (
  <div className="flex items-center gap-0 border-b border-[#E5E6E8] px-[20px] py-[11px] bg-[#FAFAFA] rounded-t-[16px]">
    <div className="flex-1 min-w-0">
      <span className="font-inter font-semibold text-[11px] uppercase tracking-widest text-[#6A7282]">
        Name
      </span>
    </div>
    <div className="w-[140px] flex-shrink-0">
      <span className="font-inter font-semibold text-[11px] uppercase tracking-widest text-[#6A7282]">
        Role
      </span>
    </div>
    <div className="w-[140px] flex-shrink-0">
      <span className="font-inter font-semibold text-[11px] uppercase tracking-widest text-[#6A7282]">
        Classes
      </span>
    </div>
    <div className="w-[140px] flex-shrink-0">
      <span className="font-inter font-semibold text-[11px] uppercase tracking-widest text-[#6A7282]">
        Status
      </span>
    </div>
    <div className="w-[40px] flex-shrink-0" />
  </div>
);

// ── Invite modal ───────────────────────────────────────────────────────────────

type InviteModalProps = {
  open: boolean;
  onClose: () => void;
  ownedClassrooms: Pick<Classroom, "id" | "name" | "invite_code">[];
};

const InviteModal = ({ open, onClose, ownedClassrooms }: InviteModalProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = (classroom: Pick<Classroom, "id" | "name" | "invite_code">) => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${classroom.invite_code}?role=teacher`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedId(classroom.id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    } else {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(classroom.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={520}
      centered
      styles={{ content: { borderRadius: 16, padding: 32 } }}
      destroyOnClose
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-display font-bold text-[20px] text-[#191D24]">
            Invite a collaborator
          </h3>
          <p className="mt-1 font-inter text-[14px] text-[#6A7282]">
            Share a teacher invite link from one of your classes.
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6A7282] hover:bg-[#E5E7EB] transition-colors"
          aria-label="Close"
        >
          <span className="material-symbols-rounded text-[20px]">close</span>
        </button>
      </div>

      {ownedClassrooms.length === 0 ? (
        <p className="font-inter text-[14px] text-[#6A7282]">
          You don&apos;t own any classes yet. Create a class first.
        </p>
      ) : (
        <div className="space-y-[10px]">
          {ownedClassrooms.map((c) => {
            const url = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${c.invite_code}?role=teacher`;
            const isCopied = copiedId === c.id;
            return (
              <div
                key={c.id}
                className="rounded-[12px] border border-[#E5E6E8] bg-[#FAFAFA] px-4 py-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-inter font-semibold text-[13px] text-[#191D24] truncate">
                    {c.name}
                  </p>
                  <p className="font-inter text-[11px] text-[#6A7282] truncate mt-0.5">
                    {url}
                  </p>
                </div>
                <button
                  onClick={() => copyLink(c)}
                  className={`flex-shrink-0 rounded-full px-[14px] py-[7px] text-[13px] font-bold font-inter transition-colors ${
                    isCopied
                      ? "bg-[#E5F8EC] text-[#16A34A]"
                      : "bg-[#B3E653] text-[#191D24] hover:bg-[#9AD534]"
                  }`}
                >
                  {isCopied ? "Copied!" : "Copy link"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-right">
        <button
          onClick={onClose}
          className="rounded-full border border-[#E5E6E8] bg-white px-6 py-2.5 font-inter text-[14px] font-bold text-[#374151] hover:bg-[#F6F7F4] transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export const PageClassroomCollaborators = ({ collaborators, ownedClassrooms }: Props) => {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="space-y-[28px]">
      {/* ── Page heading — Figma 3756-697 top area ── */}
      <div>
        <h1 className="font-display font-bold text-[26px] tracking-[-0.52px] text-[#191D24] leading-none">
          Collaborators
        </h1>
        <p className="mt-[6px] font-inter font-normal text-[15px] text-[#6A7282]">
          Teachers and assistants helping across your classes.
        </p>
      </div>

      {/* ── Section header: title + "+ Invite collaborator" — Figma 3756-697 ── */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display font-bold text-[22px] tracking-[-0.4px] text-[#191D24] leading-none">
          Collaborators
        </h2>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-[8px] rounded-full bg-[#B3E653] px-[20px] py-[10px] font-inter font-bold text-[14px] text-[#191D24] hover:bg-[#9AD534] transition-colors"
        >
          <span className="material-symbols-rounded text-[18px] leading-none">add</span>
          Invite collaborator
        </button>
      </div>

      {/* ── Collaborators table ── */}
      <div className="rounded-[16px] border border-[#E5E6E8] bg-white shadow-[0_1px_3px_0_rgba(25,29,36,0.06)] overflow-hidden">
        <TableHeader />

        {collaborators.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-[48px] text-center px-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F6F7F4]">
              <span className="material-symbols-rounded text-[28px] text-[#6A7282]">group</span>
            </span>
            <p className="font-display font-bold text-[17px] text-[#191D24]">
              No collaborators yet
            </p>
            <p className="font-inter text-[14px] text-[#6A7282] max-w-[340px]">
              Invite other teachers to help manage your classes.
            </p>
          </div>
        ) : (
          <div>
            {collaborators.map((row) => (
              <CollaboratorTableRow key={row.user_id} row={row} />
            ))}
          </div>
        )}
      </div>

      {/* ── Invite modal ── */}
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        ownedClassrooms={ownedClassrooms}
      />
    </div>
  );
};

PageClassroomCollaborators.Layout = AppShell;
