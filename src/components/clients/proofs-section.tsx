"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import {
  Image as ImageIcon,
  Mic,
  FileText,
  Upload,
  Download,
  Trash2,
  ExternalLink,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Volume2,
} from "lucide-react";
import type { ProofItem, ProofCategory } from "@/lib/proofs";
import { uploadClientProofAction, deleteClientProofAction } from "@/app/actions/clients";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProofsSectionProps {
  activityId?: string;
  initialProofs?: ProofItem[];
  readOnly?: boolean;
}

export function ProofsSection({
  activityId,
  initialProofs = [],
  readOnly = false,
}: ProofsSectionProps) {
  const [proofs, setProofs] = React.useState<ProofItem[]>(initialProofs);
  const [isUploading, setIsUploading] = React.useState(false);
  const [previewImage, setPreviewImage] = React.useState<{ url: string; name: string } | null>(null);

  const chatPhotos = proofs.filter((p) => p.category === "chat_photo");
  const callRecordings = proofs.filter((p) => p.category === "call_recording");
  const documents = proofs.filter((p) => p.category === "document" || p.category === "other");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: ProofCategory) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activityId) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("proof_file", file);
        formData.append("category", category);

        const res = await uploadClientProofAction(activityId, formData);
        if (res.ok && (res as any).proof) {
          const newProof = (res as any).proof as ProofItem;
          setProofs((prev) => [...prev, newProof]);
          toast.success(`Uploaded ${file.name} successfully.`);
        } else {
          toast.error(res.message || `Failed to upload ${file.name}.`);
        }
      }
    } catch {
      toast.error("An error occurred during proof upload.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (proofId: string) => {
    if (!activityId) return;
    if (!confirm("Are you sure you want to remove this proof?")) return;

    try {
      const res = await deleteClientProofAction(activityId, proofId);
      if (res.ok) {
        setProofs((prev) => prev.filter((p) => p.id !== proofId));
        toast.success("Proof removed.");
      } else {
        toast.error(res.message || "Failed to delete proof.");
      }
    } catch {
      toast.error("Error deleting proof.");
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Interaction Proofs & Verification (Chat Photos & Call Recordings)"
        description="Authentic records of client conversations, chat screenshots, call audio, and signed notes"
        actions={
          <div className="flex items-center gap-1.5">
            <Badge tone="teal" className="text-xs">
              {proofs.length} {proofs.length === 1 ? "Proof Attached" : "Proofs Attached"}
            </Badge>
          </div>
        }
      />

      <CardBody className="space-y-6">
        {/* Upload Buttons Banner (Only if not read-only and activityId is present) */}
        {!readOnly && activityId && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-brand-navy-50/60 to-brand-teal-50/60 border border-brand-teal/20">
            {/* Chat Photo Upload */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-line-strong/30 hover:border-brand-teal cursor-pointer shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <ImageIcon className="size-4.5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-ink">Upload Chat Screenshot</p>
                  <p className="text-[11px] text-ink-muted">WhatsApp, LinkedIn, Email screenshot</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 text-white text-[11px] font-semibold">
                <Upload className="size-3" /> Select Image
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={isUploading}
                onChange={(e) => handleFileUpload(e, "chat_photo")}
                className="hidden"
              />
            </label>

            {/* Call Recording Upload */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-line-strong/30 hover:border-brand-teal cursor-pointer shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Mic className="size-4.5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-ink">Upload Call Recording</p>
                  <p className="text-[11px] text-ink-muted">MP3, M4A, WAV, Voice Note</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-semibold">
                <Upload className="size-3" /> Select Audio
              </span>
              <input
                type="file"
                accept="audio/*,.m4a,.mp3,.wav,.ogg"
                multiple
                disabled={isUploading}
                onChange={(e) => handleFileUpload(e, "call_recording")}
                className="hidden"
              />
            </label>
          </div>
        )}

        {isUploading && (
          <div className="flex items-center justify-center gap-2 p-3 text-xs font-semibold text-brand-teal bg-brand-teal-50/50 rounded-xl border border-brand-teal/20 animate-pulse">
            <Loader2 className="size-4 animate-spin" />
            <span>Uploading and verifying proof files...</span>
          </div>
        )}

        {proofs.length === 0 && !isUploading && (
          <div className="p-8 text-center rounded-2xl border border-dashed border-line bg-white/40">
            <div className="mx-auto size-12 rounded-full bg-brand-navy/5 flex items-center justify-center text-ink-subtle mb-3">
              <ImageIcon className="size-6" />
            </div>
            <p className="font-semibold text-xs text-ink">No proofs attached yet</p>
            <p className="text-[11px] text-ink-muted mt-1 max-w-sm mx-auto">
              Upload WhatsApp chat screenshots, meeting notes, or call recordings as verifiable proof of client interaction.
            </p>
          </div>
        )}

        {/* SECTION 1: Chat Screenshots / Photos */}
        {chatPhotos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-line pb-1.5">
              <ImageIcon className="size-4 text-sky-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                Chat Screenshots & Photos ({chatPhotos.length})
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {chatPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative rounded-xl border border-line bg-white p-2.5 shadow-2xs hover:shadow-sm transition"
                >
                  <div
                    onClick={() => setPreviewImage({ url: photo.url, name: photo.name })}
                    className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-100 cursor-pointer group-hover:brightness-95 transition"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                      <Eye className="size-5" />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-xs text-ink truncate" title={photo.name}>
                        {photo.name}
                      </p>
                      <p className="text-[10px] text-ink-subtle">
                        {photo.size ? `${(photo.size / 1024).toFixed(1)} KB` : "Image"} •{" "}
                        {new Date(photo.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md p-1 text-ink-subtle hover:text-brand-navy hover:bg-slate-100"
                        title="Open full size"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                      {!readOnly && activityId && (
                        <button
                          type="button"
                          onClick={() => handleDelete(photo.id)}
                          className="rounded-md p-1 text-ink-subtle hover:text-danger hover:bg-danger-50"
                          title="Delete photo"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: Call Recordings */}
        {callRecordings.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-line pb-1.5">
              <Mic className="size-4 text-amber-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                Call Recordings & Audio Notes ({callRecordings.length})
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {callRecordings.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div className="size-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Volume2 className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-ink truncate" title={rec.name}>
                          {rec.name}
                        </p>
                        <p className="text-[10px] text-ink-muted">
                          {rec.size ? `${(rec.size / (1024 * 1024)).toFixed(2)} MB` : "Audio"} •{" "}
                          {new Date(rec.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={rec.url}
                        download={rec.name}
                        className="rounded-md p-1.5 text-amber-700 hover:bg-amber-100/70"
                        title="Download audio"
                      >
                        <Download className="size-3.5" />
                      </a>
                      {!readOnly && activityId && (
                        <button
                          type="button"
                          onClick={() => handleDelete(rec.id)}
                          className="rounded-md p-1.5 text-ink-subtle hover:text-danger hover:bg-danger-50"
                          title="Delete audio"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* HTML5 Native Audio Player */}
                  <div className="pt-1">
                    <audio
                      controls
                      preload="metadata"
                      src={rec.url}
                      className="w-full h-8 rounded-lg accent-amber-600"
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: Documents & Other Proofs */}
        {documents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-line pb-1.5">
              <FileText className="size-4 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                Documents & Attachments ({documents.length})
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl border border-line bg-white p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-ink truncate">{doc.name}</p>
                      <p className="text-[10px] text-ink-muted">
                        {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : "File"} •{" "}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md p-1.5 text-ink-subtle hover:text-brand-navy hover:bg-slate-100"
                      title="View file"
                    >
                      <Download className="size-3.5" />
                    </a>
                    {!readOnly && activityId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        className="rounded-md p-1.5 text-ink-subtle hover:text-danger hover:bg-danger-50"
                        title="Delete file"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardBody>

      {/* LIGHTBOX MODAL FOR PREVIEWING CHAT PHOTOS */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5 bg-slate-50">
              <p className="font-bold text-xs text-ink truncate max-w-md">{previewImage.name}</p>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-1.5 text-ink-subtle hover:bg-slate-200"
                  title="Open original"
                >
                  <ExternalLink className="size-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="rounded-lg p-1.5 text-ink-subtle hover:bg-slate-200"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-center bg-slate-900/5 max-h-[80vh] overflow-auto">
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
