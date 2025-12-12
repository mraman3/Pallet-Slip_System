// tests/slips.put.test.ts
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/prisma";

describe("PUT /api/slips/:id", () => {
  let clientId: number;
  let shipTo1Id: number;
  let shipTo2Id: number;
  let otherClientId: number;
  let otherShipToId: number;
  let clerk1Id: number;
  let clerk2Id: number;
  let palletType1Id: number;
  let palletType2Id: number;
  let inactivePalletTypeId: number;
  let slipId: number;

  beforeAll(async () => {
    // Clean everything in test DB
    await prisma.slipItem.deleteMany({});
    await prisma.slip.deleteMany({});
    await prisma.clientAddress.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.clerk.deleteMany({});
    await prisma.palletType.deleteMany({});

    // Seed base data
    const client = await prisma.client.create({
      data: {
        name: "Client A",
        address: "1 Main St",
        city: "Brampton",
        province: "ON",
        postal: "L6T 0A0",
        active: true,
      },
    });
    clientId = client.id;

    const shipTo1 = await prisma.clientAddress.create({
      data: {
        client_id: clientId,
        location_name: "Dock 1",
        address: "1 Main St",
        city: "Brampton",
        province: "ON",
        postal: "L6T 0A0",
        active: true,
      },
    });
    shipTo1Id = shipTo1.id;

    const shipTo2 = await prisma.clientAddress.create({
      data: {
        client_id: clientId,
        location_name: "Dock 2",
        address: "2 Side St",
        city: "Brampton",
        province: "ON",
        postal: "L6T 0B0",
        active: true,
      },
    });
    shipTo2Id = shipTo2.id;

    // Other client + address (for invalid ship-to test)
    const otherClient = await prisma.client.create({
      data: {
        name: "Other Client",
        address: "99 Other Rd",
        city: "Mississauga",
        province: "ON",
        postal: "L5T 1X1",
        active: true,
      },
    });
    otherClientId = otherClient.id;

    const otherShipTo = await prisma.clientAddress.create({
      data: {
        client_id: otherClientId,
        location_name: "Other Dock",
        address: "100 Elsewhere",
        city: "Mississauga",
        province: "ON",
        postal: "L5T 1X2",
        active: true,
      },
    });
    otherShipToId = otherShipTo.id;

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

    const pt2 = await prisma.palletType.create({
      data: { name: '48" x 40" #2', active: true },
    });
    palletType2Id = pt2.id;

    const ptInactive = await prisma.palletType.create({
      data: { name: "Inactive PT", active: false },
    });
    inactivePalletTypeId = ptInactive.id;

    // Create an initial slip with items
    const createdSlip = await prisma.slip.create({
      data: {
        slip_number: "1",
        client_id: clientId,
        ship_to_address_id: shipTo1Id,
        clerk_id: clerk1Id,
        date: new Date("2025-02-10"),
        customer_order: "PO-INIT",
        shipped_via: "BPI",
        comments_line1: "Initial comment",
        comments_line2: "Second line",
        items: {
          create: [
            {
              pallet_type_id: palletType1Id,
              qty_ordered: "10",
              qty_shipped: "9",
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });

    slipId = createdSlip.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("updates slip header and items successfully", async () => {
    const res = await request(app)
      .put(`/api/slips/${slipId}`)
      .send({
        client_id: clientId,
        ship_to_address_id: shipTo2Id, // change ship-to
        clerk_id: clerk2Id, // change clerk
        date: "2025-02-15",
        customer_order: "PO-UPDATED",
        date_shipped: "2025-02-16",
        shipped_via: "P/U",
        comments_line1: "Updated line 1",
        comments_line2: "Updated line 2",
        items: [
          {
            pallet_type_id: palletType2Id,
            qty_ordered: "20",
            qty_shipped: "20",
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(slipId);
    // slip_number should stay the same
    expect(res.body.slip_number).toBe("1");
    expect(res.body.client.id).toBe(clientId);
    expect(res.body.ship_to_address.id).toBe(shipTo2Id);
    expect(res.body.clerk.id).toBe(clerk2Id);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].pallet_type.id).toBe(palletType2Id);
    expect(res.body.items[0].qty_ordered).toBe("20");
  });

  test("returns 400 when shipped_via is invalid", async () => {
    const res = await request(app)
      .put(`/api/slips/${slipId}`)
      .send({
        client_id: clientId,
        ship_to_address_id: shipTo1Id,
        clerk_id: clerk1Id,
        date: "2025-02-15",
        customer_order: "PO-BAD-SHIPPED-VIA",
        shipped_via: "UPS",
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

  test("returns 400 when ship-to does not belong to client", async () => {
    const res = await request(app)
      .put(`/api/slips/${slipId}`)
      .send({
        client_id: clientId,
        ship_to_address_id: otherShipToId, // address of otherClient
        clerk_id: clerk1Id,
        date: "2025-02-15",
        customer_order: "PO-BAD-SHIPTO",
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
    expect(res.body.error).toMatch(
      /Ship-to address not found for this client or is inactive/
    );
  });

  test("returns 400 when pallet type is inactive", async () => {
    const res = await request(app)
      .put(`/api/slips/${slipId}`)
      .send({
        client_id: clientId,
        ship_to_address_id: shipTo1Id,
        clerk_id: clerk1Id,
        date: "2025-02-15",
        customer_order: "PO-BAD-PT",
        shipped_via: "BPI",
        items: [
          {
            pallet_type_id: inactivePalletTypeId,
            qty_ordered: "10",
            qty_shipped: "10",
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pallet types are invalid or inactive/);
  });

  test("returns 404 when slip does not exist", async () => {
    const res = await request(app)
      .put(`/api/slips/999999`)
      .send({
        client_id: clientId,
        ship_to_address_id: shipTo1Id,
        clerk_id: clerk1Id,
        date: "2025-02-15",
        customer_order: "PO-NOT-FOUND",
        shipped_via: "BPI",
        items: [
          {
            pallet_type_id: palletType1Id,
            qty_ordered: "10",
            qty_shipped: "10",
          },
        ],
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Slip not found/);
  });

  test("returns 400 when id is not a number", async () => {
    const res = await request(app)
      .put(`/api/slips/not-a-number`)
      .send({
        client_id: clientId,
        ship_to_address_id: shipTo1Id,
        clerk_id: clerk1Id,
        date: "2025-02-15",
        customer_order: "PO-BAD-ID",
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
    expect(res.body.error).toMatch(/Invalid slip id/);
  });
});
