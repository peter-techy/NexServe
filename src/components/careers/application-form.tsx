"use client";

import * as React from "react";
import { submitJobApplicationAction } from "@/app/actions/applications";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  Upload,
  Calendar,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  X,
  Sparkles,
} from "lucide-react";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

const POSITIONS = [
  "Sales Executive",
  "Others",
];

const QUALIFICATIONS = [
  "B.Tech / B.E. (Computer Science / IT)",
  "B.Tech / B.E. (Other Specializations)",
  "BCA / MCA",
  "B.Sc / M.Sc (Computer Science / IT)",
  "MBA / PGDM",
  "BBA / B.Com / Bachelor's Degree",
  "Master's Degree",
  "Diploma / Associate Degree",
  "Self-Taught / Other Qualification",
];

const EXPERIENCES = [
  "Fresher / Entry Level (< 1 year)",
  "1 - 2 Years",
  "3 - 5 Years",
  "5+ Years",
];

const AVAILABILITY_OPTIONS = [
  "Immediate (Within 7 days)",
  "15 Days Notice",
  "30 Days Notice",
  "60 Days Notice",
  "90 Days Notice",
  "Flexible / Open to Discussion",
];

export function JobApplicationForm({ defaultPosition }: { defaultPosition?: string }) {
  const [isPending, setIsPending] = React.useState(false);
  const [status, setStatus] = React.useState<{ ok: boolean; message: string } | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [position, setPosition] = React.useState(defaultPosition || "");
  const [qualification, setQualification] = React.useState("");
  const [customQualification, setCustomQualification] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit. Please choose a smaller resume file.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setStatus(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (position) {
      formData.set("position_applied", position);
    }

    const finalQual = qualification === "Self-Taught / Other Qualification" && customQualification ? customQualification : qualification;
    if (finalQual) {
      formData.set("educational_qualification", finalQual);
    }

    if (selectedFile) {
      formData.set("resume", selectedFile);
    }

    try {
      const res = await submitJobApplicationAction({}, formData);
      setStatus({ ok: Boolean(res.ok), message: res.message || "" });
      if (res.ok) {
        form.reset();
        setSelectedFile(null);
        setPosition("");
        setQualification("");
        setCustomQualification("");
      }
    } catch {
      setStatus({
        ok: false,
        message: "Something went wrong while submitting your application. Please check your network and try again.",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="relative rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(12,36,72,0.08)] backdrop-blur-2xl sm:p-10">
      {/* Decorative gradient corner */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-gradient-to-br from-[#185fa5]/15 to-[#5fb3c7]/20 blur-2xl" />

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#185fa5]/10 px-3.5 py-1 text-xs font-semibold text-[#185fa5]">
          <Sparkles className="size-3.5 text-[#185fa5]" /> NexServe Careers & Recruitment
        </div>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#142f4c] sm:text-3xl">
          Candidate <span className="gradient-text">Application Form</span>
        </h2>
        <p className="mt-2 text-xs text-[#52677e] sm:text-sm">
          Please fill out the details below. Our HR team reviews every application thoroughly.
        </p>
      </div>

      {status && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-8 flex items-start gap-3 rounded-2xl p-5 text-sm font-medium transition-all ${
            status.ok
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sm"
              : "border border-rose-200 bg-rose-50 text-rose-900 shadow-sm"
          }`}
        >
          {status.ok ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="size-5 shrink-0 text-rose-600 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{status.ok ? "Application Submitted!" : "Submission Failed"}</p>
            <p className="mt-0.5 text-xs text-inherit opacity-90">{status.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Personal Details */}
        <div className="space-y-4">
          <div className="border-b border-[#cbddeb] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#185fa5]">
              1. Personal Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-xs font-semibold text-[#142f4c]">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute top-3 left-3.5 size-4 text-[#8aa3be]" />
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-[#cbddeb] bg-white/90 py-2.5 pr-4 pl-10 text-xs font-medium text-[#142f4c] placeholder:text-[#8aa3be] shadow-xs focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#142f4c]">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute top-3 left-3.5 size-4 text-[#8aa3be]" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="e.g. rahul@example.com"
                  className="w-full rounded-xl border border-[#cbddeb] bg-white/90 py-2.5 pr-4 pl-10 text-xs font-medium text-[#142f4c] placeholder:text-[#8aa3be] shadow-xs focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label htmlFor="mobile_number" className="block text-xs font-semibold text-[#142f4c]">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <Phone className="pointer-events-none absolute top-3 left-3.5 size-4 text-[#8aa3be]" />
                <input
                  id="mobile_number"
                  name="mobile_number"
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  className="w-full rounded-xl border border-[#cbddeb] bg-white/90 py-2.5 pr-4 pl-10 text-xs font-medium text-[#142f4c] placeholder:text-[#8aa3be] shadow-xs focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Current City */}
            <div>
              <label htmlFor="current_city" className="block text-xs font-semibold text-[#142f4c]">
                Current City <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <MapPin className="pointer-events-none absolute top-3 left-3.5 size-4 text-[#8aa3be]" />
                <input
                  id="current_city"
                  name="current_city"
                  type="text"
                  required
                  placeholder="e.g. Bengaluru, Karnataka"
                  className="w-full rounded-xl border border-[#cbddeb] bg-white/90 py-2.5 pr-4 pl-10 text-xs font-medium text-[#142f4c] placeholder:text-[#8aa3be] shadow-xs focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Education & Experience */}
        <div className="space-y-4">
          <div className="border-b border-[#cbddeb] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#185fa5]">
              2. Education & Background
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* College / University or Current Employer */}
            <div className="sm:col-span-2">
              <label htmlFor="institution_or_employer" className="block text-xs font-semibold text-[#142f4c]">
                College / University or Current Employer <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <GraduationCap className="pointer-events-none absolute top-3 left-3.5 size-4 text-[#8aa3be]" />
                <input
                  id="institution_or_employer"
                  name="institution_or_employer"
                  type="text"
                  required
                  placeholder="e.g. IIT Bombay, Delhi University, or Infosys Technologies"
                  className="w-full rounded-xl border border-[#cbddeb] bg-white/90 py-2.5 pr-4 pl-10 text-xs font-medium text-[#142f4c] placeholder:text-[#8aa3be] shadow-xs focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Educational Qualification */}
            <div>
              <label htmlFor="educational_qualification_select" className="block text-xs font-semibold text-[#142f4c]">
                Educational Qualification <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <select
                  id="educational_qualification_select"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#cbddeb] bg-white/90 py-2.5 px-3 text-xs font-medium text-[#142f4c] shadow-xs focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                >
                  <option value="" disabled>Select highest qualification</option>
                  {QUALIFICATIONS.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              {qualification === "Self-Taught / Other Qualification" && (
                <input
                  type="text"
                  placeholder="Please specify your qualification"
                  value={customQualification}
                  onChange={(e) => setCustomQualification(e.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-[#cbddeb] bg-white/90 py-2 px-3 text-xs font-medium text-[#142f4c] shadow-xs focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                />
              )}
            </div>

            {/* Relevant Work Experience */}
            <div>
              <label htmlFor="relevant_experience" className="block text-xs font-semibold text-[#142f4c]">
                Relevant Work Experience <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <select
                  id="relevant_experience"
                  name="relevant_experience"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-[#cbddeb] bg-white/90 py-2.5 px-3 text-xs font-medium text-[#142f4c] shadow-xs focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                >
                  <option value="" disabled>Select experience bracket</option>
                  {EXPERIENCES.map((exp) => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Role & Availability */}
        <div className="space-y-4">
          <div className="border-b border-[#cbddeb] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#185fa5]">
              3. Position & Availability
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Position Applied For */}
            <div>
              <label htmlFor="position_applied_select" className="block text-xs font-semibold text-[#142f4c]">
                Position Applied For <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <Briefcase className="pointer-events-none absolute top-3 left-3.5 size-4 text-[#8aa3be]" />
                <select
                  id="position_applied_select"
                  name="position_applied"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#cbddeb] bg-white/90 py-2.5 pr-4 pl-10 text-xs font-medium text-[#142f4c] shadow-xs focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                >
                  <option value="" disabled>Select a position</option>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Availability to Join */}
            <div>
              <label htmlFor="availability" className="block text-xs font-semibold text-[#142f4c]">
                Availability to Join <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <Calendar className="pointer-events-none absolute top-3 left-3.5 size-4 text-[#8aa3be]" />
                <select
                  id="availability"
                  name="availability"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-[#cbddeb] bg-white/90 py-2.5 pr-4 pl-10 text-xs font-medium text-[#142f4c] shadow-xs focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                >
                  <option value="" disabled>Select your notice period</option>
                  {AVAILABILITY_OPTIONS.map((av) => (
                    <option key={av} value={av}>{av}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* LinkedIn Profile */}
            <div className="sm:col-span-2">
              <label htmlFor="linkedin_url" className="block text-xs font-semibold text-[#142f4c]">
                LinkedIn Profile <span className="font-normal text-[#8aa3be]">(Optional)</span>
              </label>
              <div className="relative mt-1.5">
                <LinkedInIcon className="pointer-events-none absolute top-3 left-3.5 size-4 text-[#8aa3be]" />
                <input
                  id="linkedin_url"
                  name="linkedin_url"
                  type="url"
                  placeholder="https://linkedin.com/in/your-profile"
                  className="w-full rounded-xl border border-[#cbddeb] bg-white/90 py-2.5 pr-4 pl-10 text-xs font-medium text-[#142f4c] placeholder:text-[#8aa3be] shadow-xs focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Skills & Resume */}
        <div className="space-y-4">
          <div className="border-b border-[#cbddeb] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#185fa5]">
              4. Competencies & Resume
            </h3>
          </div>

          <div className="space-y-4">
            {/* Skills and Competencies */}
            <div>
              <label htmlFor="skills" className="block text-xs font-semibold text-[#142f4c]">
                Skills and Competencies <span className="text-rose-500">*</span>
              </label>
              <p className="mt-0.5 text-[11px] text-[#52677e]">
                List your core technical and professional skills (e.g. Next.js, TypeScript, PostgreSQL, Client Communication, Sales Pitching).
              </p>
              <div className="relative mt-1.5">
                <Award className="pointer-events-none absolute top-3 left-3.5 size-4 text-[#8aa3be]" />
                <input
                  id="skills"
                  name="skills"
                  type="text"
                  required
                  placeholder="e.g. React, Next.js, Node.js, Tailwind CSS, REST APIs, Git"
                  className="w-full rounded-xl border border-[#cbddeb] bg-white/90 py-2.5 pr-4 pl-10 text-xs font-medium text-[#142f4c] placeholder:text-[#8aa3be] shadow-xs focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Resume / CV Upload */}
            <div>
              <label className="block text-xs font-semibold text-[#142f4c]">
                Resume / CV Upload <span className="font-normal text-[#8aa3be]">(PDF, DOC, DOCX up to 10MB)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                name="resume"
                id="resume_file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#b3cce3] bg-[#f4f8fd]/70 p-6 text-center transition hover:border-[#185fa5] hover:bg-[#eaf3fc]"
                >
                  <div className="flex size-11 items-center justify-center rounded-full bg-[#185fa5]/10 text-[#185fa5]">
                    <Upload className="size-5" />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-[#142f4c]">
                    Click to select your Resume / CV
                  </p>
                  <p className="mt-1 text-[11px] text-[#8aa3be]">
                    Supports PDF, DOC, DOCX (Max 10MB)
                  </p>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between rounded-xl border border-[#b3cce3] bg-[#f4f8fd] p-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#185fa5]/15 text-[#185fa5]">
                      <FileText className="size-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#142f4c]">{selectedFile.name}</p>
                      <p className="text-[10px] text-[#52677e]">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="rounded-lg p-1 text-[#8aa3be] hover:bg-rose-50 hover:text-rose-600"
                    title="Remove file"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 5: Motivation */}
        <div className="space-y-4">
          <div className="border-b border-[#cbddeb] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#185fa5]">
              5. Why NexServe?
            </h3>
          </div>

          <div>
            <label htmlFor="why_join" className="block text-xs font-semibold text-[#142f4c]">
              Why do you want to join NexServe? <span className="text-rose-500">*</span>
            </label>
            <p className="mt-0.5 text-[11px] text-[#52677e]">
              Tell us what excites you about our company, projects, and culture, and how you see yourself growing with us.
            </p>
            <div className="relative mt-2">
              <textarea
                id="why_join"
                name="why_join"
                rows={4}
                required
                minLength={10}
                maxLength={5000}
                placeholder="I want to join NexServe because..."
                className="w-full rounded-2xl border border-[#cbddeb] bg-white/90 p-4 text-xs font-medium text-[#142f4c] placeholder:text-[#8aa3be] shadow-xs focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#185fa5] via-[#225789] to-[#0c2448] px-8 py-3.5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(24,95,165,0.25)] transition duration-200 hover:shadow-[0_15px_35px_rgba(24,95,165,0.35)] hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin text-white" />
                <span>Submitting Your Application...</span>
              </>
            ) : (
              <>
                <span>Submit Job Application to HR</span>
                <HeartHandshake className="size-4 transition-transform group-hover:scale-110" />
              </>
            )}
          </button>
          <p className="mt-3 text-center text-[11px] text-[#8aa3be]">
            By submitting this form, you confirm that the details provided are accurate to the best of your knowledge.
          </p>
        </div>
      </form>
    </div>
  );
}
