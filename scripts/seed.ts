import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Seeding initial corporate users...");

  const users = [
    {
      email: "admin@nexserve.com",
      password: "Password123!",
      fullName: "Alexander Vance",
      employeeId: "EMP-001",
      role: "super_admin",
      department: "Administration",
      phone: "+91 98765 43210",
    },
    {
      email: "hr@nexserve.com",
      password: "Password123!",
      fullName: "Elena Rostova",
      employeeId: "EMP-002",
      role: "hr",
      department: "HR",
      phone: "+91 98765 43211",
    },
    {
      email: "sales@nexserve.com",
      password: "Password123!",
      fullName: "Aman Sharma",
      employeeId: "EMP-003",
      role: "sales",
      department: "Sales",
      phone: "+91 98765 43212",
    },
    {
      email: "priya@nexserve.com",
      password: "Password123!",
      fullName: "Priya Nair",
      employeeId: "EMP-004",
      role: "sales",
      department: "Sales",
      phone: "+91 98765 43213",
    },
  ];

  const profileMap: Record<string, string> = {};

  for (const u of users) {
    let authUserId: string;
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.fullName, employee_id: u.employeeId },
    });

    if (createError) {
      if (createError.message.includes("already been registered")) {
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list.users.find((x) => x.email === u.email);
        if (!existing) throw new Error("Could not find user " + u.email);
        authUserId = existing.id;
      } else {
        throw createError;
      }
    } else {
      authUserId = created.user.id;
    }

    const { data: prof, error: profError } = await supabase
      .from("profiles")
      .upsert(
        {
          auth_user_id: authUserId,
          employee_id: u.employeeId,
          full_name: u.fullName,
          department: u.department,
          role: u.role,
          email: u.email,
          phone: u.phone,
          is_active: true,
        },
        { onConflict: "auth_user_id" }
      )
      .select("id")
      .single();

    if (profError) throw profError;
    profileMap[u.email] = prof.id;
    console.log(`Created user ${u.email} -> profile ${prof.id} (${u.role})`);
  }

  // Seed sample clients for Aman Sharma (Sales)
  const amanId = profileMap["sales@nexserve.com"];
  console.log("Seeding clients for Sales employee...");

  const clients = [
    {
      person_name: "Rahul Verma",
      business_name: "Apex Retail Solutions",
      location: "Bangalore, KA",
      client_number: "+91 98111 22334",
      created_by: amanId,
      assigned_to: amanId,
    },
    {
      person_name: "Sarah Jenkins",
      business_name: "Global Logistics Corp",
      location: "Mumbai, MH",
      client_number: "+91 98222 33445",
      created_by: amanId,
      assigned_to: amanId,
    },
    {
      person_name: "Vikram Malhotra",
      business_name: "Zenith Software Systems",
      location: "Hyderabad, TS",
      client_number: "+91 98333 44556",
      created_by: amanId,
      assigned_to: amanId,
    },
  ];

  for (const c of clients) {
    const { data: client, error: cErr } = await supabase
      .from("clients")
      .upsert(c, { onConflict: "assigned_to,client_number_norm" })
      .select("id, business_name")
      .single();

    if (cErr) {
      console.warn("Client seed warning:", cErr.message);
      continue;
    }

    // Add activity record
    if (c.business_name === "Apex Retail Solutions") {
      await supabase.from("client_activities").insert({
        client_id: client.id,
        employee_id: amanId,
        contact_source: "LinkedIn",
        client_review: "Client interested in omni-channel marketing campaigns and monthly content retainer.",
        work_status: "Done",
        criteria: ["Digital Marketing", "Content Creation"],
        criteria_description: "Focus on social media presence and lead nurturing pipelines.",
        deal_outcome: "won",
      });
    } else if (c.business_name === "Global Logistics Corp") {
      await supabase.from("client_activities").insert({
        client_id: client.id,
        employee_id: amanId,
        contact_source: "Referral",
        client_review: "Discussion on high-volume email workflows and rebranding kit.",
        work_status: "Followup",
        criteria: ["Content Creation", "Special Demand"],
        special_demand_description: "Custom enterprise branding collateral and compliance documentation.",
        follow_up_required: true,
        follow_up_at: new Date(Date.now() + 86400000 * 2).toISOString(),
        follow_up_notes: "Follow up with commercial proposal and tier pricing.",
      });
    } else {
      await supabase.from("client_activities").insert({
        client_id: client.id,
        employee_id: amanId,
        contact_source: "Phone Call",
        client_review: "Preliminary inquiry regarding seasonal promotional campaign.",
        work_status: "Cancelled",
        criteria: ["Digital Marketing"],
        criteria_description: "Client postponed Q4 marketing spend.",
      });
    }
  }

  // Seed sample completed attendance session for Aman
  await supabase.from("attendance_sessions").insert({
    employee_id: amanId,
    check_in_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    check_out_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  });

  console.log("Database seeded successfully!");
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
