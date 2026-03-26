/* eslint-disable no-console */
const BASE_URL = process.env.API_BASE_URL || "http://localhost:5000/api";

const runId = Date.now();
const logisticsEmail = `neg.logistics.${runId}@military.local`;
const commanderEmail = `neg.commander.${runId}@military.local`;
const password = "Pass@123";
const assetName = `NEG-ASSET-${runId}`;

const state = {
  adminToken: "",
  logisticsToken: "",
  commanderToken: "",
};

const results = [];

async function request(method, path, body, token, contentType = "application/json") {
  const headers = {};
  if (contentType) headers["Content-Type"] = contentType;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined
      ? { body: contentType === "application/json" ? JSON.stringify(body) : body }
      : {}),
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_e) {
    data = null;
  }
  return { status: res.status, data };
}

function logResult(name, passed, detail = "") {
  results.push({ name, passed, detail });
  console.log(`[${passed ? "PASS" : "FAIL"}] ${name}${detail ? ` - ${detail}` : ""}`);
}

function assertStatus(res, expected, label) {
  if (res.status !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${res.status}`);
  }
}

async function test(name, fn) {
  try {
    await fn();
    logResult(name, true);
  } catch (err) {
    logResult(name, false, err.message);
  }
}

async function setupUsers() {
  const adminLogin = await request("POST", "/auth/login", {
    email: "admin@military.local",
    password: "Admin@123",
  });
  assertStatus(adminLogin, 200, "admin login");
  state.adminToken = adminLogin.data.token;

  const regLog = await request("POST", "/auth/register", {
    name: "Negative Logistics",
    email: logisticsEmail,
    password,
    role: "Logistics Officer",
    base: "Base Neg",
  });
  assertStatus(regLog, 201, "register logistics");

  const regCmd = await request("POST", "/auth/register", {
    name: "Negative Commander",
    email: commanderEmail,
    password,
    role: "Base Commander",
    base: "Base Neg",
  });
  assertStatus(regCmd, 201, "register commander");

  const logLogin = await request("POST", "/auth/login", {
    email: logisticsEmail,
    password,
  });
  assertStatus(logLogin, 200, "logistics login");
  state.logisticsToken = logLogin.data.token;

  const cmdLogin = await request("POST", "/auth/login", {
    email: commanderEmail,
    password,
  });
  assertStatus(cmdLogin, 200, "commander login");
  state.commanderToken = cmdLogin.data.token;
}

async function run() {
  console.log(`Running negative API tests against ${BASE_URL}`);
  await setupUsers();

  await test("Invalid token -> GET /auth/me returns 401", async () => {
    const res = await request("GET", "/auth/me", undefined, "invalid.token.value");
    assertStatus(res, 401, "invalid token auth/me");
  });

  await test("Missing token -> GET /purchases returns 401", async () => {
    const res = await request("GET", "/purchases");
    assertStatus(res, 401, "missing token purchases");
  });

  await test("Wrong password -> login returns 400", async () => {
    const res = await request("POST", "/auth/login", {
      email: "admin@military.local",
      password: "WrongPassword!",
    });
    assertStatus(res, 400, "wrong password login");
  });

  await test("Duplicate email -> register returns 400", async () => {
    const res = await request("POST", "/auth/register", {
      name: "Dup User",
      email: logisticsEmail,
      password,
      role: "Logistics Officer",
      base: "Base Neg",
    });
    assertStatus(res, 400, "duplicate register");
  });

  await test("Forbidden role -> commander cannot POST /purchases", async () => {
    const res = await request(
      "POST",
      "/purchases",
      {
        assetName: assetName,
        category: "Weapon",
        base: "Base Neg",
        quantity: 1,
      },
      state.commanderToken
    );
    assertStatus(res, 403, "commander forbidden purchase");
  });

  await test("Bad payload -> purchase with quantity 0 returns 400", async () => {
    const res = await request(
      "POST",
      "/purchases",
      {
        assetName: assetName,
        category: "Weapon",
        base: "Base Neg",
        quantity: 0,
      },
      state.logisticsToken
    );
    assertStatus(res, 400, "invalid purchase payload");
  });

  await test("Seed stock for insufficient-stock tests", async () => {
    const res = await request(
      "POST",
      "/purchases",
      {
        assetName: assetName,
        category: "Weapon",
        base: "Base Neg",
        quantity: 2,
        unitCost: 5000,
      },
      state.logisticsToken
    );
    assertStatus(res, 201, "seed purchase");
  });

  await test("Insufficient stock -> transfer too much returns 400", async () => {
    const res = await request(
      "POST",
      "/transfers",
      {
        assetName: assetName,
        category: "Weapon",
        fromBase: "Base Neg",
        toBase: "Base X",
        quantity: 99,
      },
      state.commanderToken
    );
    assertStatus(res, 400, "insufficient stock transfer");
  });

  await test("Insufficient stock -> assignment too much returns 400", async () => {
    const res = await request(
      "POST",
      "/assignments",
      {
        assetName: assetName,
        category: "Weapon",
        base: "Base Neg",
        quantity: 99,
        actionType: "assignment",
        assignedTo: "Unit Negative",
      },
      state.commanderToken
    );
    assertStatus(res, 400, "insufficient stock assignment");
  });

  await test("Bad payload -> transfer same base returns 400", async () => {
    const res = await request(
      "POST",
      "/transfers",
      {
        assetName: assetName,
        category: "Weapon",
        fromBase: "Base Neg",
        toBase: "Base Neg",
        quantity: 1,
      },
      state.commanderToken
    );
    assertStatus(res, 400, "same-base transfer");
  });

  await test("Malformed JSON -> endpoint returns 400", async () => {
    const res = await request(
      "POST",
      "/purchases",
      '{"assetName":"X", bad_json',
      state.logisticsToken,
      "application/json"
    );
    assertStatus(res, 400, "malformed json");
  });

  const failed = results.filter((r) => !r.passed);
  console.log("\n--- Negative Test Summary ---");
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${results.length - failed.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error("Negative runner failed:", err.message);
  process.exit(1);
});
