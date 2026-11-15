import { describe, it, expect } from "vitest";
import { navFor } from "./navigation";
import { ROLES, ROLE_LABELS } from "./types";

describe("Unified Portal Navigation & Roles", () => {
  it("includes finance in roles and labels", () => {
    expect(ROLES).toContain("finance");
    expect(ROLE_LABELS.finance).toBe("Finance");
  });

  it("Sales portal navigation contains Payments", () => {
    const salesNav = navFor("sales");
    const salesItems = salesNav.flatMap((g) => g.items);
    const paymentsItem = salesItems.find((i) => i.href === "/sales/payments");
    expect(paymentsItem).toBeDefined();
    expect(paymentsItem?.label).toBe("Payments");
    expect(paymentsItem?.icon).toBe("payments");
  });

  it("Finance portal navigation has Dashboard and Clients", () => {
    const financeNav = navFor("finance");
    const financeItems = financeNav.flatMap((g) => g.items);
    
    const dashboardItem = financeItems.find((i) => i.href === "/finance/dashboard");
    const clientsItem = financeItems.find((i) => i.href === "/finance/clients");

    expect(dashboardItem).toBeDefined();
    expect(dashboardItem?.label).toBe("Dashboard");

    expect(clientsItem).toBeDefined();
    expect(clientsItem?.label).toBe("Clients");
  });

  it("HR portal navigation has Clients directory", () => {
    const hrNav = navFor("hr");
    const hrItems = hrNav.flatMap((g) => g.items);
    const clientsItem = hrItems.find((i) => i.href === "/hr/clients");
    expect(clientsItem).toBeDefined();
    expect(clientsItem?.label).toBe("Clients");
  });

  it("Super Admin navigation includes Sales, Finance, HR, and Administration", () => {
    const adminNav = navFor("super_admin");
    const groupLabels = adminNav.map((g) => g.label).filter(Boolean);
    expect(groupLabels).toContain("Sales");
    expect(groupLabels).toContain("Finance");
    expect(groupLabels).toContain("HR");
    expect(groupLabels).toContain("Administration");
  });
});
