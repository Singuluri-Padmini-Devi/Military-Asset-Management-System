const BASE_URL = process.env.API_BASE_URL || "http://localhost:5000/api";

const uid = Date.now();
const commanderEmail = `commander.${uid}@military.local`;
const logisticsEmail = `logistics.${uid}@military.local`;
const defaultPassword = "Pass@123";

const state = {
  adminToken: "",
  commanderToken: "",
  logisticsToken: "",
  assetName: `APC-${uid}`,
  purchaseId: "",
  transferId: "",
  assignmentId: "",
};

const report = [];

async function request(method, path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_err) {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

function record(name, passed, detail) {
  report.push({ name, passed, detail });
  const tag = passed ? "PASS" : "FAIL";
  console.log(`[${tag}] ${name}${detail ? ` - ${detail}` : ""}`);
}

async function test(name, fn) {
  try {
    await fn();
    record(name, true, "");
  } catch (error) {
    record(name, false, error.message);
  }
}

function expectStatus(res, expected, context) {
  if (res.status !== expected) {
    throw new Error(`${context}: expected ${expected}, got ${res.status}`);
  }
}

async function run() {
  console.log(`Running API smoke tests against ${BASE_URL}`);

  await test("Auth login (admin)", async () => {
    const res = await request("POST", "/auth/login", {
      email: "admin@military.local",
      password: "Admin@123",
    });
    expectStatus(res, 200, "admin login");
    if (!res.data?.token) throw new Error("token missing");
    state.adminToken = res.data.token;
  });

  await test("Auth me (admin)", async () => {
    const res = await request("GET", "/auth/me", null, state.adminToken);
    expectStatus(res, 200, "auth/me");
    if (res.data?.role !== "Admin") throw new Error("expected Admin role");
  });

  await test("Register Base Commander", async () => {
    const res = await request("POST", "/auth/register", {
      name: "Commander One",
      email: commanderEmail,
      password: defaultPassword,
      role: "Base Commander",
      base: "Base Alpha",
    });
    expectStatus(res, 201, "register commander");
  });

  await test("Register Logistics Officer", async () => {
    const res = await request("POST", "/auth/register", {
      name: "Logistics One",
      email: logisticsEmail,
      password: defaultPassword,
      role: "Logistics Officer",
      base: "Base Alpha",
    });
    expectStatus(res, 201, "register logistics");
  });

  await test("Auth login (commander)", async () => {
    const res = await request("POST", "/auth/login", {
      email: commanderEmail,
      password: defaultPassword,
    });
    expectStatus(res, 200, "commander login");
    state.commanderToken = res.data.token;
  });

  await test("Auth login (logistics)", async () => {
    const res = await request("POST", "/auth/login", {
      email: logisticsEmail,
      password: defaultPassword,
    });
    expectStatus(res, 200, "logistics login");
    state.logisticsToken = res.data.token;
  });

  await test("POST /purchases (logistics allowed)", async () => {
    const res = await request(
      "POST",
      "/purchases",
      {
        assetName: state.assetName,
        category: "Vehicle",
        base: "Base Alpha",
        quantity: 20,
        unitCost: 100000,
        note: "Initial stock",
      },
      state.logisticsToken
    );
    expectStatus(res, 201, "create purchase");
    state.purchaseId = res.data?._id;
  });

  await test("POST /purchases (commander forbidden)", async () => {
    const res = await request(
      "POST",
      "/purchases",
      {
        assetName: state.assetName,
        category: "Vehicle",
        base: "Base Alpha",
        quantity: 1,
      },
      state.commanderToken
    );
    expectStatus(res, 403, "commander purchase");
  });

  await test("POST /transfers (commander allowed)", async () => {
    const res = await request(
      "POST",
      "/transfers",
      {
        assetName: state.assetName,
        category: "Vehicle",
        fromBase: "Base Alpha",
        toBase: "Base Bravo",
        quantity: 5,
        note: "Shift to Bravo",
      },
      state.commanderToken
    );
    expectStatus(res, 201, "create transfer");
    state.transferId = res.data?._id;
  });

  await test("POST /assignments (commander allowed)", async () => {
    const res = await request(
      "POST",
      "/assignments",
      {
        assetName: state.assetName,
        category: "Vehicle",
        base: "Base Alpha",
        quantity: 3,
        actionType: "assignment",
        assignedTo: "Unit Zulu",
        note: "Mission prep",
      },
      state.commanderToken
    );
    expectStatus(res, 201, "create assignment");
    state.assignmentId = res.data?._id;
  });

  await test("PUT /purchases/:id (admin update)", async () => {
    const res = await request(
      "PUT",
      `/purchases/${state.purchaseId}`,
      {
        quantity: 25,
        note: "Updated by admin",
      },
      state.adminToken
    );
    expectStatus(res, 200, "update purchase");
  });

  await test("PUT /transfers/:id (admin update)", async () => {
    const res = await request(
      "PUT",
      `/transfers/${state.transferId}`,
      {
        quantity: 4,
        note: "Updated transfer",
      },
      state.adminToken
    );
    expectStatus(res, 200, "update transfer");
  });

  await test("PUT /assignments/:id (admin update)", async () => {
    const res = await request(
      "PUT",
      `/assignments/${state.assignmentId}`,
      {
        quantity: 2,
        assignedTo: "Unit Omega",
      },
      state.adminToken
    );
    expectStatus(res, 200, "update assignment");
  });

  await test("DELETE /assignments/:id (admin delete)", async () => {
    const res = await request("DELETE", `/assignments/${state.assignmentId}`, null, state.adminToken);
    expectStatus(res, 200, "delete assignment");
  });

  await test("DELETE /transfers/:id (admin delete)", async () => {
    const res = await request("DELETE", `/transfers/${state.transferId}`, null, state.adminToken);
    expectStatus(res, 200, "delete transfer");
  });

  await test("DELETE /purchases/:id (admin delete)", async () => {
    const res = await request("DELETE", `/purchases/${state.purchaseId}`, null, state.adminToken);
    expectStatus(res, 200, "delete purchase");
  });

  await test("GET /dashboard", async () => {
    const res = await request("GET", "/dashboard", null, state.adminToken);
    expectStatus(res, 200, "dashboard");
    if (!Array.isArray(res.data?.assets)) throw new Error("assets not returned");
  });

  await test("GET /assets", async () => {
    const res = await request("GET", "/assets", null, state.adminToken);
    expectStatus(res, 200, "assets");
    if (!Array.isArray(res.data)) throw new Error("assets payload not array");
  });

  await test("GET /purchases", async () => {
    const res = await request("GET", "/purchases", null, state.adminToken);
    expectStatus(res, 200, "purchases list");
    if (!Array.isArray(res.data)) throw new Error("purchases payload not array");
  });

  await test("GET /transfers", async () => {
    const res = await request("GET", "/transfers", null, state.adminToken);
    expectStatus(res, 200, "transfers list");
    if (!Array.isArray(res.data)) throw new Error("transfers payload not array");
  });

  await test("GET /assignments", async () => {
    const res = await request("GET", "/assignments", null, state.adminToken);
    expectStatus(res, 200, "assignments list");
    if (!Array.isArray(res.data)) throw new Error("assignments payload not array");
  });

  const failed = report.filter((x) => !x.passed);
  console.log("\n--- Smoke Test Summary ---");
  console.log(`Total: ${report.length}`);
  console.log(`Passed: ${report.length - failed.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("Unexpected test runner error:", error.message);
  process.exit(1);
});
