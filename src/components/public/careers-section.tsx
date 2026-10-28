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
  Rocket,
  TrendingUp,
  Users2,
} from "lucide-react";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

const POSITIONS = [
  "Frontend Developer (React / Next.js)",
  "Backend Developer (Node.js / Python)",
  "Full Stack Software Engineer",
  "UI/UX & Product Designer",
  "Business Development & Sales Executive",
  "Digital Marketing Specialist",
  "Content Creator & Copywriter",
  "HR & Talent Acquisition Associate",
  "Other / Open Application",
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

export function CareersSection() {
  const [isPending, setIsPending] = React.useState(false);
  const [status, setStatus] = React.useState<{ ok: boolean; message: string } | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [position, setPosition] = React.useState("");
  const [customPosition, setCustomPosition] = React.useState("");
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

    const finalPosition = position === "Other / Open Application" && customPosition ? customPosition : position;
    if (finalPosition) {
      formData.set("position_applied", finalPosition);
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
        setCustomPosition("");
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
    <section
      id="careers"
      className="border-t border-[#225789]/20 bg-radial from-[#e1eefb]/50 via-[#f4f8fd] to-[#f4f8fd] px-6 py-20 sm:px-10 lg:px-16 lg:py-24"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Left Column: Careers Info */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#185fa5]/20 bg-white/80 px-3.5 py-1 text-[11px] font-bold tracking-widest text-[#185fa5] uppercase shadow-xs backdrop-blur-sm">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> WE'RE HIRING
            </span>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#142f4c] sm:text-4xl lg:text-5xl">
              Join our team and build
              <br />
              <span className="gradient-text">what's next.</span>
            </h2>

            <p className="mt-6 text-sm leading-relaxed text-[#52677e]">
              Looking for your next challenge? NexServe connects talented engineers, designers, sales specialists, and leaders to build high-impact digital solutions.
            </p>

            {/* Culture / Value points */}
            <div className="mt-8 space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-[#b3cce3] bg-white/80 p-3.5 text-xs text-[#142f4c] shadow-xs backdrop-blur-sm">
                <Rocket className="size-4 shrink-0 text-[#185fa5] mt-0.5" />
                <div>
                  <p className="font-bold text-[#185fa5]">High Impact & Modern Stack</p>
                  <p className="mt-0.5 text-[#52677e]">Work on Next.js, cloud systems, and real customer products.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-[#b3cce3] bg-white/80 p-3.5 text-xs text-[#142f4c] shadow-xs backdrop-blur-sm">
                <TrendingUp className="size-4 shrink-0 text-[#185fa5] mt-0.5" />
                <div>
                  <p className="font-bold text-[#185fa5]">Rapid Growth & Mentorship</p>
                  <p className="mt-0.5 text-[#52677e]">Clear evaluation metrics and direct promotion opportunities.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-[#b3cce3] bg-white/80 p-3.5 text-xs text-[#142f4c] shadow-xs backdrop-blur-sm">
                <Users2 className="size-4 shrink-0 text-[#185fa5] mt-0.5" />
                <div>
                  <p className="font-bold text-[#185fa5]">Supportive & Agile Team</p>
                  <p className="mt-0.5 text-[#52677e]">Thoughtful ideas, clear communication, and collaborative spirit.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-[#185fa5]/20 bg-[#185fa5]/5 p-4 text-xs text-[#185fa5]">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-[#185fa5]" /> Direct HR Intake
            </p>
            <p className="mt-1 text-[11px] text-[#52677e]">
              Every application submitted here is delivered directly into the NexServe HR recruitment portal for rapid review.
            </p>
          </div>
        </div>

        {/* Right Column: 13-field Application Form */}
        <div className="lg:col-span-7">
          <form
            id="jobApplicationForm"
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-2xl p-6 shadow-[0_20px_60px_rgba(12,36,72,0.08)] sm:p-10 space-y-6"
          >
            <div>
              <p className="text-[11px] font-bold tracking-widest text-[#185fa5] uppercase">
                JOB APPLICATION
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-[#142f4c] sm:text-3xl">
                Apply for an <span className="gradient-text">Open Position.</span>
              </h3>
              <p className="mt-2 text-xs text-[#52677e]">
                Submit your profile and resume. Our recruitment team will review your qualifications and contact you.
              </p>
            </div>

            {status && (
              <div
                role="status"
                aria-live="polite"
                className={`flex items-start gap-3 rounded-2xl p-4 text-xs font-semibold ${
                  status.ok
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {status.ok ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{status.ok ? "Application Received!" : "Error Submitting"}</p>
                  <p className="mt-0.5 font-normal opacity-90">{status.message}</p>
                </div>
              </div>
            )}

            {/* Field Section: Personal Details */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* 1. Full Name */}
              <div>
                <label htmlFor="careers_full_name" className="block text-xs font-semibold text-[#142f4c]">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <User className="pointer-events-none absolute top-3 left-3 size-3.5 text-[#8aa3be]" />
                  <input
                    id="careers_full_name"
                    name="full_name"
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl border border-[#cbddeb] bg-white py-2.5 pr-3 pl-9 text-xs text-[#142f4c] placeholder:text-[#8aa3be] focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 2. Email Address */}
              <div>
                <label htmlFor="careers_email" className="block text-xs font-semibold text-[#142f4c]">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute top-3 left-3 size-3.5 text-[#8aa3be]" />
                  <input
                    id="careers_email"
                    name="email"
                    type="email"
                    required
                    placeholder="e.g. rahul@example.com"
                    className="w-full rounded-xl border border-[#cbddeb] bg-white py-2.5 pr-3 pl-9 text-xs text-[#142f4c] placeholder:text-[#8aa3be] focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 3. Mobile Number */}
              <div>
                <label htmlFor="careers_mobile_number" className="block text-xs font-semibold text-[#142f4c]">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <Phone className="pointer-events-none absolute top-3 left-3 size-3.5 text-[#8aa3be]" />
                  <input
                    id="careers_mobile_number"
                    name="mobile_number"
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    className="w-full rounded-xl border border-[#cbddeb] bg-white py-2.5 pr-3 pl-9 text-xs text-[#142f4c] placeholder:text-[#8aa3be] focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 4. Current City */}
              <div>
                <label htmlFor="careers_current_city" className="block text-xs font-semibold text-[#142f4c]">
                  Current City <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <MapPin className="pointer-events-none absolute top-3 left-3 size-3.5 text-[#8aa3be]" />
                  <input
                    id="careers_current_city"
                    name="current_city"
                    type="text"
                    required
                    placeholder="e.g. Bengaluru, Karnataka"
                    className="w-full rounded-xl border border-[#cbddeb] bg-white py-2.5 pr-3 pl-9 text-xs text-[#142f4c] placeholder:text-[#8aa3be] focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 5. College / university or current employer */}
              <div className="sm:col-span-2">
                <label htmlFor="careers_institution" className="block text-xs font-semibold text-[#142f4c]">
                  College / University or Current Employer <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <GraduationCap className="pointer-events-none absolute top-3 left-3 size-3.5 text-[#8aa3be]" />
                  <input
                    id="careers_institution"
                    name="institution_or_employer"
                    type="text"
                    required
                    placeholder="e.g. IIT Bombay, Delhi University, or Infosys Technologies"
                    className="w-full rounded-xl border border-[#cbddeb] bg-white py-2.5 pr-3 pl-9 text-xs text-[#142f4c] placeholder:text-[#8aa3be] focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 6. Educational Qualification */}
              <div>
                <label htmlFor="careers_qualification" className="block text-xs font-semibold text-[#142f4c]">
                  Educational Qualification <span className="text-rose-500">*</span>
                </label>
                <select
                  id="careers_qualification"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-[#cbddeb] bg-white py-2.5 px-3 text-xs text-[#142f4c] focus:border-[#185fa5] focus:outline-hidden"
                >
                  <option value="" disabled>Select highest qualification</option>
                  {QUALIFICATIONS.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>

                {qualification === "Self-Taught / Other Qualification" && (
                  <input
                    type="text"
                    placeholder="Specify qualification"
                    value={customQualification}
                    onChange={(e) => setCustomQualification(e.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-[#cbddeb] bg-white py-2 px-3 text-xs text-[#142f4c] focus:border-[#185fa5] focus:outline-hidden"
                  />
                )}
              </div>

              {/* 7. Relevant Work Experience */}
              <div>
                <label htmlFor="careers_experience" className="block text-xs font-semibold text-[#142f4c]">
                  Relevant Work Experience <span className="text-rose-500">*</span>
                </label>
                <select
                  id="careers_experience"
                  name="relevant_experience"
                  required
                  defaultValue=""
                  className="mt-1 w-full rounded-xl border border-[#cbddeb] bg-white py-2.5 px-3 text-xs text-[#142f4c] focus:border-[#185fa5] focus:outline-hidden"
                >
                  <option value="" disabled>Select experience level</option>
                  {EXPERIENCES.map((exp) => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>
              </div>

              {/* 8. Position Applied For */}
              <div>
                <label htmlFor="careers_position" className="block text-xs font-semibold text-[#142f4c]">
                  Position Applied For <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <Briefcase className="pointer-events-none absolute top-3 left-3 size-3.5 text-[#8aa3be]" />
                  <select
                    id="careers_position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#cbddeb] bg-white py-2.5 pr-3 pl-9 text-xs text-[#142f4c] focus:border-[#185fa5] focus:outline-hidden"
                  >
                    <option value="" disabled>Select position</option>
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {position === "Other / Open Application" && (
                  <input
                    type="text"
                    placeholder="Specify role"
                    value={customPosition}
                    onChange={(e) => setCustomPosition(e.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-[#cbddeb] bg-white py-2 px-3 text-xs text-[#142f4c] focus:border-[#185fa5] focus:outline-hidden"
                  />
                )}
              </div>

              {/* 9. Availability to Join */}
              <div>
                <label htmlFor="careers_availability" className="block text-xs font-semibold text-[#142f4c]">
                  Availability to Join <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <Calendar className="pointer-events-none absolute top-3 left-3 size-3.5 text-[#8aa3be]" />
                  <select
                    id="careers_availability"
                    name="availability"
                    required
                    defaultValue=""
                    className="w-full rounded-xl border border-[#cbddeb] bg-white py-2.5 pr-3 pl-9 text-xs text-[#142f4c] focus:border-[#185fa5] focus:outline-hidden"
                  >
                    <option value="" disabled>Select notice period</option>
                    {AVAILABILITY_OPTIONS.map((av) => (
                      <option key={av} value={av}>{av}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 10. Skills and Competencies */}
              <div className="sm:col-span-2">
                <label htmlFor="careers_skills" className="block text-xs font-semibold text-[#142f4c]">
                  Skills and Competencies <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <Award className="pointer-events-none absolute top-3 left-3 size-3.5 text-[#8aa3be]" />
                  <input
                    id="careers_skills"
                    name="skills"
                    type="text"
                    required
                    placeholder="e.g. React, Next.js, TypeScript, PostgreSQL, UI/UX, Sales Negotiation"
                    className="w-full rounded-xl border border-[#cbddeb] bg-white py-2.5 pr-3 pl-9 text-xs text-[#142f4c] placeholder:text-[#8aa3be] focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 11. LinkedIn Profile (optional) */}
              <div className="sm:col-span-2">
                <label htmlFor="careers_linkedin" className="block text-xs font-semibold text-[#142f4c]">
                  LinkedIn Profile <span className="font-normal text-[#8aa3be]">(Optional)</span>
                </label>
                <div className="relative mt-1">
                  <LinkedInIcon className="pointer-events-none absolute top-3 left-3 size-3.5 text-[#8aa3be]" />
                  <input
                    id="careers_linkedin"
                    name="linkedin_url"
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                    className="w-full rounded-xl border border-[#cbddeb] bg-white py-2.5 pr-3 pl-9 text-xs text-[#142f4c] placeholder:text-[#8aa3be] focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 12. Resume / CV Upload */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#142f4c]">
                  Resume / CV Upload <span className="font-normal text-[#8aa3be]">(PDF, DOC, DOCX up to 10MB)</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  name="resume"
                  id="careers_resume_file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#b3cce3] bg-[#f4f8fd] p-4 text-center transition hover:border-[#185fa5] hover:bg-[#eaf3fc]"
                  >
                    <Upload className="size-4 text-[#185fa5]" />
                    <p className="mt-1 text-xs font-semibold text-[#142f4c]">Click to upload Resume / CV</p>
                    <p className="text-[10px] text-[#8aa3be]">PDF, DOC, DOCX (Max 10MB)</p>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center justify-between rounded-xl border border-[#b3cce3] bg-[#f4f8fd] p-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <FileText className="size-4 text-[#185fa5]" />
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
                      className="rounded-lg p-1 text-[#8aa3be] hover:text-rose-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* 13. Why do you want to join NexServe? */}
              <div className="sm:col-span-2">
                <label htmlFor="careers_why_join" className="block text-xs font-semibold text-[#142f4c]">
                  Why do you want to join NexServe? <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="careers_why_join"
                  name="why_join"
                  rows={3}
                  required
                  minLength={10}
                  maxLength={5000}
                  placeholder="Share what interests you about NexServe and how your background aligns..."
                  className="mt-1 w-full rounded-xl border border-[#cbddeb] bg-white p-3 text-xs text-[#142f4c] placeholder:text-[#8aa3be] focus:border-[#185fa5] focus:ring-2 focus:ring-[#185fa5]/20 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#185fa5] via-[#225789] to-[#0c2448] px-6 py-3.5 text-xs font-bold text-white shadow-[0_10px_25px_rgba(24,95,165,0.25)] transition hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-white" />
                    <span>Submitting Application to HR...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Job Application</span>
                    <HeartHandshake className="size-4 transition-transform group-hover:scale-110" />
                  </>
                )}
              </button>
              <p className="mt-2 text-center text-[10px] text-[#8aa3be]">
                Applications are delivered immediately to the NexServe HR recruitment portal.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
