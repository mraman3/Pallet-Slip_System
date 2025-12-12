// tests/slips.post.test.ts
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/prisma";

describe("POST /api/slips", () => {
  let activeClientId: number;
  let activeShipToId: number;
  let inactiveClientId: number;
  let clerkId: number;
  let palletType1Id: number;
  let palletType2Id: number;
  let inactivePalletTypeId: number;

  beforeAll(async () => {
    // ⚠️ This wipes real data - best to use a dedicated test DB later
    await prisma.slipItem.deleteMany({});
    await prisma.slip.deleteMany({});
    await prisma.clientAddress.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.clerk.deleteMany({});
    await prisma.palletType.deleteMany({});

    // Active client + ship-to
    const client = await prisma.client.create({
      data: {
        name: "Test Client Active",
        address: "123 Test St",
        city: "Brampton",
        province: "ON",
        postal: "L6T 0A0",
        active: true,
      },
    });
    activeClientId = client.id;

    const shipTo = await prisma.clientAddress.create({
      data: {
        client_id: activeClientId,
        location_name: "Main Dock",
        address: "456 Warehouse Rd",
        city: "Brampton",
        province: "ON",
        postal: "L6T 0B1",
        active: true,
      },
    });
    activeShipToId = shipTo.id;

    // Inactive client
    const inactiveClient = await prisma.client.create({
      data: {
        name: "Test Client Inactive",
        address: "999 Inactive St",
        city: "Nowhere",
        province: "ON",
        postal: "L0L 0L0",
        active: false,
      },
    });
    inactiveClientId = inactiveClient.id;

    // Clerk
    const clerk = await prisma.clerk.create({
      data: {
        name: "Test Clerk",
        active: true,
        created_at: new Date(),
      },
    });
    clerkId = clerk.id;

    // Pallet types
    const pt1 = await prisma.palletType.create({
      data: {
        name: '48" x 40" 4-way #1',
        active: true,
      },
    });
    palletType1Id = pt1.id;

    const pt2 = await prisma.palletType.create({
      data: {
        name: '48" x 40" 4-way #2',
        active: true,
      },
    });
    palletType2Id = pt2.id;

    const ptInactive = await prisma.palletType.create({
      data: {
        name: "Inactive Pallet",
        active: false,
      },
    });
    inactivePalletTypeId = ptInactive.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("creates a slip successfully with valid data", async () => {
    const res = await request(app)
      .post("/api/slips")
      .send({
        client_id: activeClientId,
        ship_to_address_id: activeShipToId,
        clerk_id: clerkId,
        date: "2025-02-10",
        customer_order: "PO-1001",
        date_shipped: "2025-02-11",
        shipped_via: "BPI",
        comments_line1: "Leave at dock 2",
        comments_line2: "Call on arrival",
        items: [
          {
            pallet_type_id: palletType1Id,
            qty_ordered: "100",
            qty_shipped: "95",
          },
          {
            pallet_type_id: palletType2Id,
            qty_ordered: "50",
            qty_shipped: "50",
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("slip_number");
    expect(res.body.client.id).toBe(activeClientId);
    expect(res.body.items.length).toBe(2);
  });

  test("fails when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/slips")
      .send({
        // client_id missing
        ship_to_address_id: activeShipToId,
        clerk_id: clerkId,
        date: "2025-02-10",
        // customer_order missing
        shipped_via: "BPI",
        items: [],
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("fails when shipped_via is invalid", async () => {
    const res = await request(app)
      .post("/api/slips")
      .send({
        client_id: activeClientId,
        ship_to_address_id: activeShipToId,
        clerk_id: clerkId,
        date: "2025-02-10",
        customer_order: "PO-1002",
        shipped_via: "UPS", // invalid
        items: [
          {
            pallet_type_id: palletType1Id,
            qty_ordered: "10",
            qty_shipped: "10",
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/shipped_via must be 'BPI' or 'P\/U'/);
  });

  test("fails when client is inactive", async () => {
    const res = await request(app)
      .post("/api/slips")
      .send({
        client_id: inactiveClientId,
        ship_to_address_id: activeShipToId,
        clerk_id: clerkId,
        date: "2025-02-10",
        customer_order: "PO-1003",
        shipped_via: "BPI",
        items: [
          {
            pallet_type_id: palletType1Id,
            qty_ordered: "10",
            qty_shipped: "10",
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Client not found or inactive/);
  });

  test("fails when ship-to does not belong to client", async () => {
    // Create another client + address not matching activeClientId
    const otherClient = await prisma.client.create({
      data: {
        name: "Other Client",
        address: "777 Other St",
        city: "Othercity",
        province: "ON",
        postal: "L9L 9L9",
        active: true,
      },
    });

    const otherAddress = await prisma.clientAddress.create({
      data: {
        client_id: otherClient.id,
        location_name: "Other Dock",
        address: "999 Elsewhere Rd",
        city: "Othercity",
        province: "ON",
        postal: "L9L 9L8",
        active: true,
      },
    });

    const res = await request(app)
      .post("/api/slips")
      .send({
        client_id: activeClientId,
        ship_to_address_id: otherAddress.id, // wrong client
        clerk_id: clerkId,
        date: "2025-02-10",
        customer_order: "PO-1004",
        shipped_via: "BPI",
        items: [
          {
            pallet_type_id: palletType1Id,
            qty_ordered: "10",
            qty_shipped: "10"
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(
      /Ship-to address not found for this client or is inactive/
    );
  });

  test("fails when a pallet type is inactive or invalid", async () => {
    const res = await request(app)
      .post("/api/slips")
      .send({
        client_id: activeClientId,
        ship_to_address_id: activeShipToId,
        clerk_id: clerkId,
        date: "2025-02-10",
        customer_order: "PO-1005",
        shipped_via: "BPI",
        items: [
          {
            pallet_type_id: inactivePalletTypeId, // inactive pallet type
            qty_ordered: "10",
            qty_shipped: "10",
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pallet types are invalid or inactive/);
  });
});
