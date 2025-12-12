// tests/slips.get.test.ts
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/prisma";

describe("GET /api/slips (filters)", () => {
  let clientAId: number;
  let clientBId: number;
  let shipToA1Id: number;
  let shipToB1Id: number;
  let clerk1Id: number;
  let clerk2Id: number;
  let palletType1Id: number;

  let slip1Id: number;
  let slip2Id: number;
  let slip3Id: number;

  beforeAll(async () => {
    // Clean test DB
    await prisma.slipItem.deleteMany({});
    await prisma.slip.deleteMany({});
    await prisma.clientAddress.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.clerk.deleteMany({});
    await prisma.palletType.deleteMany({});

    // Seed shared data
    const clientA = await prisma.client.create({
      data: {
        name: "Client A",
        address: "1 Main St",
        city: "Brampton",
        province: "ON",
        postal: "L6T 0A0",
        active: true,
      },
    });
    clientAId = clientA.id;

    const clientB = await prisma.client.create({
      data: {
        name: "Client B",
        address: "2 Second St",
        city: "Mississauga",
        province: "ON",
        postal: "L5T 1B1",
        active: true,
      },
    });
    clientBId = clientB.id;

    const shipToA1 = await prisma.clientAddress.create({
      data: {
        client_id: clientAId,
        location_name: "Client A Dock",
        address: "1 Main St",
        city: "Brampton",
        province: "ON",
        postal: "L6T 0A0",
        active: true,
      },
    });
    shipToA1Id = shipToA1.id;

    const shipToB1 = await prisma.clientAddress.create({
      data: {
        client_id: clientBId,
        location_name: "Client B Dock",
        address: "2 Second St",
        city: "Mississauga",
        province: "ON",
        postal: "L5T 1B1",
        active: true,
      },
    });
    shipToB1Id = shipToB1.id;

    const clerk1 = await prisma.clerk.create({
      data: { name: "Clerk One", active: true, created_at: new Date() },
    });
    clerk1Id = clerk1.id;

    const clerk2 = await prisma.clerk.create({
      data: { name: "Clerk Two", active: true, created_at: new Date() },
    });
    clerk2Id = clerk2.id;

    const pt1 = await prisma.palletType.create({
      data: { name: '48" x 40" #1', active: true },
    });
    palletType1Id = pt1.id;

    // Seed three slips with different dates / clients / clerk / shipped_via / orders

    // Slip 1 - Client A, BPI, Clerk1, Feb 10
    const slip1 = await prisma.slip.create({
      data: {
        slip_number: "1",
        client_id: clientAId,
        ship_to_address_id: shipToA1Id,
        clerk_id: clerk1Id,
        date: new Date("2025-02-10"),
        customer_order: "PO-1001",
        shipped_via: "BPI",
        comments_line1: "First slip",
        comments_line2: null,
        items: {
          create: [
            {
              pallet_type_id: palletType1Id,
              qty_ordered: "10",
              qty_shipped: "10",
            },
          ],
        },
      },
    });
    slip1Id = slip1.id;

    // Slip 2 - Client A, P/U, Clerk2, Feb 15
    const slip2 = await prisma.slip.create({
      data: {
        slip_number: "2",
        client_id: clientAId,
        ship_to_address_id: shipToA1Id,
        clerk_id: clerk2Id,
        date: new Date("2025-02-15"),
        customer_order: "PO-2002",
        shipped_via: "P/U",
        comments_line1: "Second slip",
        comments_line2: null,
        items: {
          create: [
            {
              pallet_type_id: palletType1Id,
              qty_ordered: "5",
              qty_shipped: "5",
            },
          ],
        },
      },
    });
    slip2Id = slip2.id;

    // Slip 3 - Client B, BPI, Clerk1, Mar 01
    const slip3 = await prisma.slip.create({
      data: {
        slip_number: "3",
        client_id: clientBId,
        ship_to_address_id: shipToB1Id,
        clerk_id: clerk1Id,
        date: new Date("2025-03-01"),
        customer_order: "INV-3003",
        shipped_via: "BPI",
        comments_line1: "Third slip",
        comments_line2: null,
        items: {
          create: [
            {
              pallet_type_id: palletType1Id,
              qty_ordered: "20",
              qty_shipped: "18",
            },
          ],
        },
      },
    });
    slip3Id = slip3.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns all slips when no filters supplied", async () => {
    const res = await request(app).get("/api/slips");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // we seeded 3 slips
    expect(res.body.length).toBe(3);
  });

  test("filters by client_id", async () => {
    const res = await request(app).get(
      `/api/slips?client_id=${clientAId}`
    );

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    for (const slip of res.body) {
      expect(slip.client_id).toBe(clientAId);
    }
  });

  test("filters by shipped_via", async () => {
    const res = await request(app).get(
      `/api/slips?shipped_via=BPI`
    );

    expect(res.status).toBe(200);
    // Slip 1 and 3 are BPI
    const numbers = res.body.map((s: any) => s.slip_number).sort();
    expect(numbers).toEqual(["1", "3"]);
  });

  test("filters by clerk_id", async () => {
    const res = await request(app).get(
      `/api/slips?clerk_id=${clerk2Id}`
    );

    expect(res.status).toBe(200);
    // Only slip 2 has clerk2
    expect(res.body.length).toBe(1);
    expect(res.body[0].slip_number).toBe("2");
  });

  test("filters by slip_number exact match", async () => {
    const res = await request(app).get(
      `/api/slips?slip_number=3`
    );

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].slip_number).toBe("3");
  });

  test("filters by customer_order substring", async () => {
    // "INV-3003" contains "INV"
    const res = await request(app).get(
      `/api/slips?customer_order=inv`
    );

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].customer_order).toBe("INV-3003");
  });

  test("filters by date range (from_date, to_date)", async () => {
    // from 2025-02-11 to 2025-02-28 -> should catch slip2 only (Feb 15)
    const res = await request(app).get(
      `/api/slips?from_date=2025-02-11&to_date=2025-02-28`
    );

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].slip_number).toBe("2");
  });

  test("returns 400 for invalid client_id", async () => {
    const res = await request(app).get(`/api/slips?client_id=abc`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/client_id must be a number/);
  });

  test("returns 400 for invalid shipped_via", async () => {
    const res = await request(app).get(`/api/slips?shipped_via=UPS`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/shipped_via must be 'BPI' or 'P\/U'/);
  });

  test("returns 400 for invalid from_date", async () => {
    const res = await request(app).get(
      `/api/slips?from_date=not-a-date`
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid from_date/);
  });
});
