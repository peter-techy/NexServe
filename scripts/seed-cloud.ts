import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
  "User-Agent": "NexServe-Backend/1.0",
};

async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error [${res.status}] ${path}: ${text}`);
  }
  return res.json().catch(() => ({}));
}

async function main() {
  console.log("Seeding initial corporate users to cloud Supabase...");

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

    // Check if user already exists in auth
    const list = await api("/auth/v1/admin/users");
    const existing = (list.users || []).find((x: any) => x.email === u.email);

    if (existing) {
      authUserId = existing.id;
    } else {
      const created = await api("/auth/v1/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.fullName, employee_id: u.employeeId },
        }),
      });
      authUserId = created.id;
    }

    // Upsert Profile via REST
    const prof = await api("/rest/v1/profiles", {
      method: "POST",
      headers: {
        Prefer: "return=representation,resolution=merge-duplicates",
      },
      body: JSON.stringify({
        auth_user_id: authUserId,
        employee_id: u.employeeId,
        full_name: u.fullName,
        department: u.department,
        role: u.role,
        email: u.email,
        phone: u.phone,
        is_active: true,
      }),
    });

    const profId = prof[0]?.id;
    profileMap[u.email] = profId;
    console.log(`Created user ${u.email} -> profile ${profId} (${u.role})`);
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
    const res = await api("/rest/v1/clients", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(c),
    });
    const client = res[0];
    if (!client) continue;

    if (c.business_name === "Apex Retail Solutions") {
      await api("/rest/v1/client_activities", {
        method: "POST",
        body: JSON.stringify({
          client_id: client.id,
          employee_id: amanId,
          contact_source: "LinkedIn",
          client_review: "Client interested in omni-channel marketing campaigns and monthly content retainer.",
          work_status: "Done",
          criteria: ["Digital Marketing", "Content Creation"],
          criteria_description: "Focus on social media presence and lead nurturing pipelines.",
          deal_outcome: "won",
        }),
      });
    } else if (c.business_name === "Global Logistics Corp") {
      await api("/rest/v1/client_activities", {
        method: "POST",
        body: JSON.stringify({
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
        }),
      });
    } else {
      await api("/rest/v1/client_activities", {
        method: "POST",
        body: JSON.stringify({
          client_id: client.id,
          employee_id: amanId,
          contact_source: "Phone Call",
          client_review: "Preliminary inquiry regarding seasonal promotional campaign.",
          work_status: "Cancelled",
          criteria: ["Digital Marketing"],
          criteria_description: "Client postponed Q4 marketing spend.",
        }),
      });
    }
  }

  // Seed sample completed attendance session for Aman
  await api("/rest/v1/attendance_sessions", {
    method: "POST",
    body: JSON.stringify({
      employee_id: amanId,
      check_in_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      check_out_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    }),
  });

  console.log("Cloud Supabase database seeded successfully!");
}

main().catch((err) => {
  console.error("Cloud seed error:", err);
  process.exit(1);
});
