"use client";

import * as React from "react";
import type { JobApplication, ApplicationStatus } from "@/lib/types";
import {
  updateApplicationStatusAction,
  deleteApplicationAction,
  submitJobApplicationAction,
} from "@/app/actions/applications";
import {
  Search,
  Filter,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  Calendar,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  DownloadCloud,
  ChevronRight,
  X,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { EmptyState, KpiCard } from "@/components/ui/feedback";

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  new: {
    label: "New",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Clock,
  },
  screening: {
    label: "Screening",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Eye,
  },
  interview: {
    label: "Interview",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Calendar,
  },
  offered: {
    label: "Offered",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
    icon: Sparkles,
  },
  hired: {
    label: "Hired",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    icon: UserX,
  },
};

export function ApplicationsClient({
  initialApplications,
}: {
  initialApplications: JobApplication[];
}) {
  const [applications, setApplications] = React.useState<JobApplication[]>(initialApplications);
  const [search, setSearch] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [selectedPosition, setSelectedPosition] = React.useState<string>("all");
  const [activeModalApp, setActiveModalApp] = React.useState<JobApplication | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<{ ok: boolean; text: string } | null>(null);

  // HR Notes state inside detail modal
  const [modalNotes, setModalNotes] = React.useState("");
  const [modalStatus, setModalStatus] = React.useState<ApplicationStatus>("new");

  React.useEffect(() => {
    if (activeModalApp) {
      setModalNotes(activeModalApp.hr_notes || "");
      setModalStatus(activeModalApp.status);
    }
  }, [activeModalApp]);

  // Extract unique positions for filter
  const positions = React.useMemo(() => {
    const set = new Set<string>(["Sales Executive", "Others"]);
    applications.forEach((a) => {
      if (a.position_applied) set.add(a.position_applied);
    });
    return Array.from(set);
  }, [applications]);

  // Filtered list
  const filtered = React.useMemo(() => {
    return applications.filter((app) => {
      // Status filter
      if (selectedStatus !== "all" && app.status !== selectedStatus) {
        return false;
      }
      // Position filter
      if (selectedPosition !== "all" && app.position_applied !== selectedPosition) {
        return false;
      }
      // Search term
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = app.full_name.toLowerCase().includes(query);
        const matchesEmail = app.email.toLowerCase().includes(query);
        const matchesSkills = app.skills.toLowerCase().includes(query);
        const matchesCity = app.current_city.toLowerCase().includes(query);
        const matchesInst = app.institution_or_employer.toLowerCase().includes(query);
        const matchesPos = app.position_applied.toLowerCase().includes(query);
        return matchesName || matchesEmail || matchesSkills || matchesCity || matchesInst || matchesPos;
      }
      return true;
    });
  }, [applications, selectedStatus, selectedPosition, search]);

  // Counts
  const totalCount = applications.length;
  const newCount = applications.filter((a) => a.status === "new").length;
  const inPipelineCount = applications.filter(
    (a) => a.status === "screening" || a.status === "interview"
  ).length;
  const hiredCount = applications.filter((a) => a.status === "hired" || a.status === "offered").length;

  // Handle status update
  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus, notes?: string) => {
    setIsUpdating(true);
    setActionMessage(null);
    try {
      const res = await updateApplicationStatusAction(appId, newStatus, notes);
      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: newStatus, hr_notes: notes ?? a.hr_notes } : a))
        );
        if (activeModalApp && activeModalApp.id === appId) {
          setActiveModalApp((prev) => (prev ? { ...prev, status: newStatus, hr_notes: notes ?? prev.hr_notes } : null));
        }
        setActionMessage({ ok: true, text: res.message || "Updated successfully." });
      } else {
        setActionMessage({ ok: false, text: res.message || "Failed to update." });
      }
    } catch {
      setActionMessage({ ok: false, text: "An error occurred while updating status." });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle deleting candidate
  const handleDelete = async (appId: string) => {
    if (!confirm("Are you sure you want to delete this applicant record?")) return;
    try {
      const res = await deleteApplicationAction(appId);
      if (res.ok) {
        setApplications((prev) => prev.filter((a) => a.id !== appId));
        if (activeModalApp?.id === appId) {
          setActiveModalApp(null);
        }
      } else {
        alert(res.message || "Failed to delete.");
      }
    } catch {
      alert("Error deleting record.");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (applications.length === 0) {
      alert("No applications to export.");
      return;
    }

    const headers = [
      "Full Name",
      "Email Address",
      "Mobile Number",
      "Current City",
      "College / Current Employer",
      "Educational Qualification",
      "Relevant Experience",
      "Skills and Competencies",
      "Position Applied",
      "Availability to Join",
      "LinkedIn Profile",
      "Why Join NexServe",
      "Status",
      "HR Notes",
      "Date Applied",
    ];

    const rows = applications.map((a) => [
      `"${a.full_name.replace(/"/g, '""')}"`,
      `"${a.email}"`,
      `"${a.mobile_number}"`,
      `"${a.current_city.replace(/"/g, '""')}"`,
      `"${a.institution_or_employer.replace(/"/g, '""')}"`,
      `"${a.educational_qualification.replace(/"/g, '""')}"`,
      `"${a.relevant_experience.replace(/"/g, '""')}"`,
      `"${a.skills.replace(/"/g, '""')}"`,
      `"${a.position_applied.replace(/"/g, '""')}"`,
      `"${a.availability.replace(/"/g, '""')}"`,
      `"${(a.linkedin_url || "").replace(/"/g, '""')}"`,
      `"${a.why_join.replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${a.status}"`,
      `"${(a.hr_notes || "").replace(/"/g, '""')}"`,
      `"${new Date(a.created_at).toLocaleDateString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NexServe_Candidates_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {actionMessage && (
        <div
          className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-semibold ${
            actionMessage.ok
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.ok ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <AlertCircle className="size-4 text-rose-600" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Total Applicants"
          value={totalCount}
          hint="All submissions received"
          icon={<UserCheck className="size-4" />}
        />
        <KpiCard
          label="New / Unreviewed"
          value={newCount}
          hint="Requires HR screening"
          icon={<Clock className="size-4 text-brand-teal" />}
        />
        <KpiCard
          label="In Screening / Interview"
          value={inPipelineCount}
          hint="Active evaluations"
          icon={<Calendar className="size-4 text-amber-600" />}
        />
        <KpiCard
          label="Offered & Hired"
          value={hiredCount}
          hint="Successful candidates"
          icon={<CheckCircle2 className="size-4 text-emerald-600" />}
        />
      </div>

      {/* Controls & Filter Bar */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute top-3 left-3 size-4 text-[#8aa3be]" />
              <input
                type="text"
                placeholder="Search candidates by name, email, skills, city, employer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#cbddeb] bg-white py-2 pr-4 pl-9 text-xs text-[#142f4c] placeholder:text-[#8aa3be] shadow-xs focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute top-2.5 right-3 text-[#8aa3be] hover:text-[#142f4c]"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Position filter & Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {positions.length > 0 && (
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="rounded-xl border border-[#cbddeb] bg-white py-2 px-3 text-xs font-medium text-[#142f4c] shadow-xs focus:border-[#185fa5] focus:outline-hidden"
                >
                  <option value="all">All Positions ({positions.length})</option>
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#cbddeb] bg-white px-3.5 py-2 text-xs font-semibold text-[#142f4c] shadow-xs transition hover:bg-[#f4f8fd] hover:text-[#185fa5]"
              >
                <DownloadCloud className="size-3.5 text-[#185fa5]" /> Export CSV
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#185fa5] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#144f8a]"
              >
                <Plus className="size-3.5" /> Add Candidate
              </button>
            </div>
          </div>

          {/* Status Tab Pills */}
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#cbddeb]/60 pt-3">
            {[
              { id: "all", label: "All Applicants", count: totalCount },
              { id: "new", label: "New", count: newCount },
              { id: "screening", label: "Screening", count: applications.filter((a) => a.status === "screening").length },
              { id: "interview", label: "Interview", count: applications.filter((a) => a.status === "interview").length },
              { id: "offered", label: "Offered", count: applications.filter((a) => a.status === "offered").length },
              { id: "hired", label: "Hired", count: applications.filter((a) => a.status === "hired").length },
              { id: "rejected", label: "Rejected", count: applications.filter((a) => a.status === "rejected").length },
            ].map((tab) => {
              const active = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-[#185fa5] text-white shadow-xs"
                      : "bg-[#f4f8fd] text-[#52677e] hover:bg-[#e1eefb] hover:text-[#185fa5]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      active ? "bg-white/20 text-white" : "bg-[#cbddeb] text-[#142f4c]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Candidates List / Table */}
      <Card>
        <CardHeader
          title={`Job Applicants (${filtered.length})`}
          description="Review applicant qualifications, download resumes, track candidate status, and record HR evaluation notes"
        />

        {filtered.length === 0 ? (
          <EmptyState
            title="No applicants found"
            description={
              search || selectedStatus !== "all" || selectedPosition !== "all"
                ? "No candidates matched your search criteria or filter."
                : "No job applications have been submitted yet. Share the careers link with prospective candidates."
            }
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <Tr>
                  <Th>Candidate & Contact</Th>
                  <Th>Position Applied</Th>
                  <Th>Experience & Education</Th>
                  <Th>Institution / Employer</Th>
                  <Th>Availability</Th>
                  <Th>Resume</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </thead>
              <tbody>
                {filtered.map((app) => {
                  const statusInfo = STATUS_CONFIG[app.status] || STATUS_CONFIG.new;
                  const StatusIcon = statusInfo.icon;
                  return (
                    <Tr key={app.id} className="hover:bg-[#f4f8fd]/70 transition-colors">
                      {/* Name & Contact */}
                      <Td>
                        <div>
                          <p className="font-bold text-[#142f4c] text-xs sm:text-sm">{app.full_name}</p>
                          <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-[#52677e]">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="size-3 text-[#8aa3be]" /> {app.email}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Phone className="size-3 text-[#8aa3be]" /> {app.mobile_number}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3 text-[#8aa3be]" /> {app.current_city}
                            </span>
                          </div>
                        </div>
                      </Td>

                      {/* Position */}
                      <Td>
                        <span className="inline-block rounded-md bg-[#185fa5]/10 px-2.5 py-1 text-xs font-semibold text-[#185fa5]">
                          {app.position_applied}
                        </span>
                        <p className="mt-1 text-[11px] text-[#8aa3be] line-clamp-1">
                          Skills: {app.skills}
                        </p>
                      </Td>

                      {/* Experience & Education */}
                      <Td>
                        <p className="font-semibold text-xs text-[#142f4c]">{app.relevant_experience}</p>
                        <p className="text-[11px] text-[#52677e]">{app.educational_qualification}</p>
                      </Td>

                      {/* Institution / Employer */}
                      <Td>
                        <p className="text-xs font-medium text-[#142f4c] line-clamp-2">
                          {app.institution_or_employer}
                        </p>
                        {app.linkedin_url && (
                          <a
                            href={app.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#185fa5] hover:underline"
                          >
                            <LinkedInIcon className="size-3" /> LinkedIn Profile
                          </a>
                        )}
                      </Td>

                      {/* Availability */}
                      <Td>
                        <span className="text-xs text-[#142f4c] font-medium">{app.availability}</span>
                      </Td>

                      {/* Resume */}
                      <Td>
                        {app.resume_data ? (
                          <a
                            href={app.resume_data}
                            download={app.resume_name || `${app.full_name.replace(/\s+/g, "_")}_Resume`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#cbddeb] bg-white px-2.5 py-1 text-xs font-semibold text-[#185fa5] shadow-2xs hover:bg-[#eaf3fc]"
                            title="Download candidate resume"
                          >
                            <Download className="size-3" />
                            <span className="max-w-[80px] truncate">{app.resume_name || "Resume"}</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-[#8aa3be] italic">Not attached</span>
                        )}
                      </Td>

                      {/* Status */}
                      <Td>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusInfo.badgeClass}`}
                        >
                          <StatusIcon className="size-3" />
                          {statusInfo.label}
                        </span>
                      </Td>

                      {/* Actions */}
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveModalApp(app)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#185fa5]/10 px-2.5 py-1.5 text-xs font-bold text-[#185fa5] hover:bg-[#185fa5]/20"
                            title="Review applicant profile"
                          >
                            <Eye className="size-3.5" /> Review
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(app.id)}
                            className="rounded-lg p-1.5 text-[#8aa3be] hover:bg-rose-50 hover:text-rose-600"
                            title="Delete applicant record"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>

      {/* DETAIL MODAL: CANDIDATE FULL PROFILE REVIEW */}
      {activeModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-3xl rounded-3xl border border-white/60 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#cbddeb] bg-gradient-to-r from-[#f4f8fd] to-white px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#185fa5]/10 text-[#185fa5]">
                  <User className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#142f4c]">{activeModalApp.full_name}</h3>
                  <p className="text-xs text-[#52677e]">
                    Applied for <span className="font-bold text-[#185fa5]">{activeModalApp.position_applied}</span> • {new Date(activeModalApp.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalApp(null)}
                className="rounded-xl p-2 text-[#8aa3be] hover:bg-[#eaf3fc] hover:text-[#142f4c]"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[75vh] space-y-6 overflow-y-auto p-6 text-xs">
              {/* Top Contact Strip */}
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#cbddeb]/60 bg-[#f4f8fd] p-4 sm:grid-cols-3">
                <div className="flex items-center gap-2.5">
                  <Mail className="size-4 text-[#185fa5]" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#8aa3be]">Email</p>
                    <a href={`mailto:${activeModalApp.email}`} className="font-semibold text-[#142f4c] hover:underline">
                      {activeModalApp.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Phone className="size-4 text-[#185fa5]" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#8aa3be]">Mobile Number</p>
                    <a href={`tel:${activeModalApp.mobile_number}`} className="font-semibold text-[#142f4c] hover:underline">
                      {activeModalApp.mobile_number}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <MapPin className="size-4 text-[#185fa5]" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#8aa3be]">Current City</p>
                    <p className="font-semibold text-[#142f4c]">{activeModalApp.current_city}</p>
                  </div>
                </div>
              </div>

              {/* 13 Checklist Details Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* College / Employer */}
                <div className="rounded-xl border border-[#cbddeb]/70 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa3be]">
                    College / University or Current Employer
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#142f4c]">
                    {activeModalApp.institution_or_employer}
                  </p>
                </div>

                {/* Educational Qualification */}
                <div className="rounded-xl border border-[#cbddeb]/70 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa3be]">
                    Educational Qualification
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#142f4c]">
                    {activeModalApp.educational_qualification}
                  </p>
                </div>

                {/* Relevant Work Experience */}
                <div className="rounded-xl border border-[#cbddeb]/70 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa3be]">
                    Relevant Work Experience
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#142f4c]">
                    {activeModalApp.relevant_experience}
                  </p>
                </div>

                {/* Availability to Join */}
                <div className="rounded-xl border border-[#cbddeb]/70 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa3be]">
                    Availability to Join
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#142f4c]">
                    {activeModalApp.availability}
                  </p>
                </div>
              </div>

              {/* Skills and Competencies */}
              <div className="rounded-xl border border-[#cbddeb]/70 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa3be]">
                  Skills and Competencies
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeModalApp.skills.split(",").map((skill, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-[#e1eefb] px-2.5 py-1 text-xs font-semibold text-[#185fa5]"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* LinkedIn & Resume Bar */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border border-[#cbddeb]/70 p-3.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa3be]">
                      LinkedIn Profile
                    </p>
                    <p className="mt-1 font-semibold text-[#142f4c]">
                      {activeModalApp.linkedin_url ? "Profile Provided" : "Not Provided"}
                    </p>
                  </div>
                  {activeModalApp.linkedin_url && (
                    <a
                      href={activeModalApp.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-[#185fa5]/10 px-3 py-1.5 text-xs font-bold text-[#185fa5] hover:bg-[#185fa5]/20"
                    >
                      <ExternalLink className="size-3.5" /> View
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#cbddeb]/70 p-3.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa3be]">
                      Resume / CV
                    </p>
                    <p className="mt-1 font-semibold text-[#142f4c] truncate max-w-[150px]">
                      {activeModalApp.resume_name || (activeModalApp.resume_data ? "Resume Document" : "Not Attached")}
                    </p>
                  </div>
                  {activeModalApp.resume_data && (
                    <a
                      href={activeModalApp.resume_data}
                      download={activeModalApp.resume_name || "Applicant_Resume"}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#185fa5] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#144f8a]"
                    >
                      <Download className="size-3.5" /> Download
                    </a>
                  )}
                </div>
              </div>

              {/* Why do you want to join NexServe? */}
              <div className="rounded-2xl border border-[#cbddeb]/70 bg-[#f4f8fd]/70 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#185fa5]">
                  Why do you want to join NexServe?
                </p>
                <blockquote className="mt-2 text-xs leading-relaxed text-[#142f4c] italic whitespace-pre-wrap">
                  "{activeModalApp.why_join}"
                </blockquote>
              </div>

              {/* HR Review & Pipeline Status Section */}
              <div className="rounded-2xl border-2 border-[#185fa5]/20 bg-white p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#cbddeb]/60 pb-3">
                  <h4 className="font-extrabold text-[#142f4c] text-sm flex items-center gap-2">
                    <UserCheck className="size-4 text-[#185fa5]" /> HR Evaluation & Pipeline Status
                  </h4>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      STATUS_CONFIG[modalStatus]?.badgeClass || ""
                    }`}
                  >
                    Current: {STATUS_CONFIG[modalStatus]?.label || modalStatus}
                  </span>
                </div>

                <div className="space-y-3">
                  <label className="block font-semibold text-[#142f4c]">
                    Advance / Change Candidate Stage:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "new",
                        "screening",
                        "interview",
                        "offered",
                        "hired",
                        "rejected",
                      ] as ApplicationStatus[]
                    ).map((st) => {
                      const cfg = STATUS_CONFIG[st];
                      const isSelected = modalStatus === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setModalStatus(st)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                            isSelected
                              ? "border-[#185fa5] bg-[#185fa5] text-white shadow-xs"
                              : "border-[#cbddeb] bg-white text-[#52677e] hover:bg-[#f4f8fd] hover:text-[#185fa5]"
                          }`}
                        >
                          <cfg.icon className="size-3.5" />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal_notes" className="block font-semibold text-[#142f4c]">
                    HR Internal Review Notes & Next Steps:
                  </label>
                  <textarea
                    id="modal_notes"
                    rows={3}
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder="Enter notes on candidate screening, technical interview round feedback, expected CTC, or recruiter thoughts..."
                    className="w-full rounded-xl border border-[#cbddeb] p-3 text-xs text-[#142f4c] focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalApp(null)}
                    className="rounded-xl border border-[#cbddeb] px-4 py-2 text-xs font-semibold text-[#52677e] hover:bg-[#f4f8fd]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(activeModalApp.id, modalStatus, modalNotes)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#185fa5] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#144f8a] disabled:opacity-60"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3.5" /> Save Evaluation & Status
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ADD CANDIDATE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-2xl rounded-3xl border border-white/60 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#cbddeb] bg-[#f4f8fd] px-6 py-4">
              <div className="flex items-center gap-2">
                <Plus className="size-5 text-[#185fa5]" />
                <h3 className="text-base font-bold text-[#142f4c]">Add Candidate Manually (HR Entry)</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl p-1.5 text-[#8aa3be] hover:bg-[#eaf3fc] hover:text-[#142f4c]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsUpdating(true);
                const formData = new FormData(e.currentTarget);
                try {
                  const res = await submitJobApplicationAction({}, formData);
                  if (res.ok) {
                    setIsAddModalOpen(false);
                    window.location.reload();
                  } else {
                    alert(res.message || "Failed to add candidate.");
                  }
                } catch {
                  alert("Error saving candidate.");
                } finally {
                  setIsUpdating(false);
                }
              }}
              className="max-h-[75vh] space-y-4 overflow-y-auto p-6 text-xs"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-[#142f4c]">Full Name *</label>
                  <input
                    name="full_name"
                    required
                    placeholder="Candidate full name"
                    className="mt-1 w-full rounded-xl border border-[#cbddeb] p-2.5 text-xs focus:border-[#185fa5] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#142f4c]">Email Address *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="candidate@example.com"
                    className="mt-1 w-full rounded-xl border border-[#cbddeb] p-2.5 text-xs focus:border-[#185fa5] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#142f4c]">Mobile Number *</label>
                  <input
                    name="mobile_number"
                    required
                    placeholder="+91 98765 43210"
                    className="mt-1 w-full rounded-xl border border-[#cbddeb] p-2.5 text-xs focus:border-[#185fa5] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#142f4c]">Current City *</label>
                  <input
                    name="current_city"
                    required
                    placeholder="City, State"
                    className="mt-1 w-full rounded-xl border border-[#cbddeb] p-2.5 text-xs focus:border-[#185fa5] focus:outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#142f4c]">
                    College / University or Current Employer *
                  </label>
                  <input
                    name="institution_or_employer"
                    required
                    placeholder="University or previous company"
                    className="mt-1 w-full rounded-xl border border-[#cbddeb] p-2.5 text-xs focus:border-[#185fa5] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#142f4c]">Educational Qualification *</label>
                  <input
                    name="educational_qualification"
                    required
                    placeholder="e.g. B.Tech CS, MBA, BCA"
                    className="mt-1 w-full rounded-xl border border-[#cbddeb] p-2.5 text-xs focus:border-[#185fa5] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#142f4c]">Relevant Work Experience *</label>
                  <input
                    name="relevant_experience"
                    required
                    placeholder="e.g. Fresher, 2 Years"
                    className="mt-1 w-full rounded-xl border border-[#cbddeb] p-2.5 text-xs focus:border-[#185fa5] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#142f4c]">Position Applied For *</label>
                  <select
                    name="position_applied"
                    required
                    defaultValue=""
                    className="mt-1 w-full rounded-xl border border-[#cbddeb] bg-white p-2.5 text-xs text-[#142f4c] focus:border-[#185fa5] focus:outline-hidden"
                  >
                    <option value="" disabled>Select a position</option>
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#142f4c]">Availability to Join *</label>
                  <input
                    name="availability"
                    required
                    placeholder="e.g. Immediate, 15 Days"
                    className="mt-1 w-full rounded-xl border border-[#cbddeb] p-2.5 text-xs focus:border-[#185fa5] focus:outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#142f4c]">Skills and Competencies *</label>
                  <input
                    name="skills"
                    required
                    placeholder="e.g. React, Next.js, Node.js"
                    className="mt-1 w-full rounded-xl border border-[#cbddeb] p-2.5 text-xs focus:border-[#185fa5] focus:outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#142f4c]">LinkedIn Profile (Optional)</label>
                  <input
                    name="linkedin_url"
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    className="mt-1 w-full rounded-xl border border-[#cbddeb] p-2.5 text-xs focus:border-[#185fa5] focus:outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#142f4c]">
                    Why do you want to join NexServe? *
                  </label>
                  <textarea
                    name="why_join"
                    required
                    rows={2}
                    placeholder="Candidate motivation or notes..."
                    className="mt-1 w-full rounded-xl border border-[#cbddeb] p-2.5 text-xs focus:border-[#185fa5] focus:outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#142f4c]">Resume File (Optional)</label>
                  <input
                    type="file"
                    name="resume"
                    accept=".pdf,.doc,.docx"
                    className="mt-1 w-full rounded-xl border border-[#cbddeb] p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#cbddeb]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-[#cbddeb] px-4 py-2 text-xs font-semibold text-[#52677e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#185fa5] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#144f8a]"
                >
                  {isUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
