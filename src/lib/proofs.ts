import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export type ProofCategory = "chat_photo" | "call_recording" | "document" | "other";

export interface ProofItem {
  id: string;
  category: ProofCategory;
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  createdAt: string;
  createdByName?: string;
}

const BUCKET_NAME = "nexserve-files";

function detectCategory(mimeType: string, fileName: string): ProofCategory {
  const lowerName = fileName.toLowerCase();
  if (
    mimeType.startsWith("image/") ||
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".webp") ||
    lowerName.endsWith(".svg")
  ) {
    return "chat_photo";
  }
  if (
    mimeType.startsWith("audio/") ||
    lowerName.endsWith(".mp3") ||
    lowerName.endsWith(".wav") ||
    lowerName.endsWith(".m4a") ||
    lowerName.endsWith(".ogg") ||
    lowerName.endsWith(".aac")
  ) {
    return "call_recording";
  }
  return "document";
}

/**
 * Uploads a proof file (e.g. chat screenshot, call recording) to Supabase Storage.
 */
export async function uploadProofFile(
  file: File,
  folderPrefix: string,
  categoryOverride?: ProofCategory
): Promise<ProofItem | null> {
  try {
    const admin = createAdminClient();
    const id = crypto.randomUUID();
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const mimeType = file.type || "application/octet-stream";
    const category = categoryOverride || detectCategory(mimeType, file.name);
    const storagePath = `proofs/${folderPrefix}/${Date.now()}_${cleanName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await admin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) {
      console.error("[proofs] Storage upload failed:", uploadErr.message);
      // Fallback: If smaller than 3MB, generate data URL
      if (buffer.length < 3 * 1024 * 1024) {
        return {
          id,
          category,
          name: file.name,
          url: `data:${mimeType};base64,${buffer.toString("base64")}`,
          size: file.size,
          mimeType,
          createdAt: new Date().toISOString(),
        };
      }
      return null;
    }

    const { data: publicUrlData } = admin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return {
      id,
      category,
      name: file.name,
      url: publicUrlData.publicUrl,
      size: file.size,
      mimeType,
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[proofs] uploadProofFile error:", err);
    return null;
  }
}

/**
 * Retrieves all proof items attached to a specific client activity.
 */
export async function getProofsForActivity(activityId: string): Promise<ProofItem[]> {
  try {
    const admin = createAdminClient();
    const { data: logs, error } = await admin
      .from("audit_logs")
      .select("id, action, metadata, created_at")
      .eq("entity_type", "client_activity")
      .eq("entity_id", activityId)
      .in("action", ["client.proof_uploaded", "client.proof_deleted"])
      .order("created_at", { ascending: true });

    if (error || !logs) return [];

    const deletedIds = new Set<string>();
    const proofMap = new Map<string, ProofItem>();

    for (const log of logs) {
      const meta = (log.metadata as any) || {};
      if (log.action === "client.proof_deleted" && meta.proof_id) {
        deletedIds.add(meta.proof_id);
      } else if (log.action === "client.proof_uploaded") {
        if (meta.proof) {
          proofMap.set(meta.proof.id, meta.proof);
        } else if (Array.isArray(meta.proofs)) {
          meta.proofs.forEach((p: ProofItem) => proofMap.set(p.id, p));
        }
      }
    }

    return Array.from(proofMap.values()).filter((p) => !deletedIds.has(p.id));
  } catch (err) {
    console.error("[proofs] getProofsForActivity error:", err);
    return [];
  }
}

/**
 * Saves uploaded proof record in audit logs linked to the activity.
 */
export async function recordProofsInActivity(
  activityId: string,
  actorProfileId: string,
  actorName: string,
  proofs: ProofItem[]
): Promise<boolean> {
  if (proofs.length === 0) return true;
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("audit_logs").insert({
      actor_user_id: actorProfileId,
      action: "client.proof_uploaded",
      entity_type: "client_activity",
      entity_id: activityId,
      metadata: {
        proofs: proofs.map((p) => ({
          ...p,
          createdByName: actorName,
        })),
        uploaded_by_name: actorName,
        uploaded_at: new Date().toISOString(),
      },
    });

    // Optionally tag notes so list queries know proofs exist without extra queries
    try {
      const { data: currentAct } = await admin
        .from("client_activities")
        .select("notes")
        .eq("id", activityId)
        .single();

      if (currentAct && !currentAct.notes?.includes("[PROOFS ATTACHED]")) {
        const updatedNotes = currentAct.notes
          ? `${currentAct.notes}\n[PROOFS ATTACHED]`
          : "[PROOFS ATTACHED]";
        await admin
          .from("client_activities")
          .update({ notes: updatedNotes })
          .eq("id", activityId);
      }
    } catch {
      // Non-fatal
    }

    return !error;
  } catch (err) {
    console.error("[proofs] recordProofsInActivity error:", err);
    return false;
  }
}

/**
 * Deletes a proof from an activity.
 */
export async function deleteProofFromActivity(
  activityId: string,
  actorProfileId: string,
  proofId: string
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("audit_logs").insert({
      actor_user_id: actorProfileId,
      action: "client.proof_deleted",
      entity_type: "client_activity",
      entity_id: activityId,
      metadata: {
        proof_id: proofId,
        deleted_at: new Date().toISOString(),
      },
    });

    return !error;
  } catch (err) {
    console.error("[proofs] deleteProofFromActivity error:", err);
    return false;
  }
}
