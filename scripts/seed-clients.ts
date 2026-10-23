import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: aman } = await supabase.from("profiles").select("id").eq("email", "sales@nexserve.com").single();
  if (!aman) return;

  const clients = [
    {
      person_name: "Rahul Verma",
      business_name: "Apex Retail Solutions",
      location: "Bangalore, KA",
      client_number: "+91 98111 22334",
      created_by: aman.id,
      assigned_to: aman.id,
    },
    {
      person_name: "Sarah Jenkins",
      business_name: "Global Logistics Corp",
      location: "Mumbai, MH",
      client_number: "+91 98222 33445",
      created_by: aman.id,
      assigned_to: aman.id,
    },
    {
      person_name: "Vikram Malhotra",
      business_name: "Zenith Software Systems",
      location: "Hyderabad, TS",
      client_number: "+91 98333 44556",
      created_by: aman.id,
      assigned_to: aman.id,
    },
  ];

  for (const c of clients) {
    const { data: client, error: cErr } = await supabase
      .from("clients")
      .insert(c)
      .select("id, business_name")
      .single();

    if (cErr) {
      console.warn("Client insert error:", cErr.message);
      continue;
    }

    if (c.business_name === "Apex Retail Solutions") {
      await supabase.from("client_activities").insert({
        client_id: client.id,
        employee_id: aman.id,
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
        employee_id: aman.id,
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
        employee_id: aman.id,
        contact_source: "Phone Call",
        client_review: "Preliminary inquiry regarding seasonal promotional campaign.",
        work_status: "Cancelled",
        criteria: ["Digital Marketing"],
        criteria_description: "Client postponed Q4 marketing spend.",
      });
    }
  }

  console.log("Clients & activities inserted successfully!");
}

main();
