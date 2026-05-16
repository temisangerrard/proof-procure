import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getSessionUser } from "@/lib/auth";
import { d1 } from "@/lib/db";
import {
  deployAgreementOnChain,
  fundAgreementOnChain,
  approveDeliveryOnChain,
  rejectDeliveryOnChain,
  markDeliveredOnChain,
} from "@/lib/chain";

interface Agreement {
  id: string;
  buyer_id: string;
  supplier_email: string;
  item: string;
  quantity: string;
  price: string;
  total: string;
  delivery_window: string | null;
  confirmation_window: number | null;
  expiry: string | null;
  contract_address: string | null;
  status: string;
}

interface ActionBody {
  action: "deploy" | "fund" | "approve" | "reject" | "deliver";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = (await req.json()) as ActionBody;
    const { action } = body;

    // Load agreement
    const result = await d1.query("SELECT * FROM agreements WHERE id = ?", [
      id,
    ]);
    if (!result.results.length)
      return NextResponse.json(
        { error: "Agreement not found" },
        { status: 404 },
      );

    const agreement = result.results[0] as unknown as Agreement;

    // Auth check for buyer actions
    const buyerActions = ["deploy", "fund", "approve", "reject"];
    if (buyerActions.includes(action) && agreement.buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (
      action === "deliver" &&
      agreement.buyer_id !== user.id &&
      agreement.supplier_email.toLowerCase() !== user.email.toLowerCase()
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let txHash = "";

    switch (action) {
      case "deploy": {
        const agreementHash = ethers.id(id);

        // Delivery deadline: parse from delivery_window field or default to 30 days
        let deliveryDeadline: number;
        if (agreement.delivery_window) {
          const parsed = Date.parse(agreement.delivery_window);
          if (!isNaN(parsed)) {
            deliveryDeadline = Math.floor(parsed / 1000);
          } else {
            deliveryDeadline = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
          }
        } else {
          deliveryDeadline = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
        }

        const confirmationWindow =
          Number(agreement.confirmation_window) || 7 * 24 * 3600;

        const expiryTimestamp = agreement.expiry
          ? Math.floor(Date.parse(agreement.expiry) / 1000)
          : Math.floor(Date.now() / 1000) + 60 * 24 * 3600;

        const quantity = agreement.quantity
          ? parseInt(agreement.quantity, 10) || 1
          : 1;
        const pricePerUnit = agreement.price
          ? BigInt(Math.round(parseFloat(agreement.price) * 1_000_000))
          : BigInt(0);
        const totalAmount = agreement.total
          ? BigInt(Math.round(parseFloat(agreement.total) * 1_000_000))
          : BigInt(0);

        const { contractAddress, txHash: deployTxHash } =
          await deployAgreementOnChain({
            buyerEmail: user.email,
            supplierEmail: agreement.supplier_email,
            item: agreement.item,
            quantity,
            pricePerUnit: quantity > 1 ? pricePerUnit : BigInt(0),
            totalAmount,
            deliveryDeadline,
            confirmationWindow,
            confirmationType: 0,
            agreementHash,
            expiryTimestamp,
          });

        txHash = deployTxHash;

        await d1.run(
          "UPDATE agreements SET contract_address = ?, status = 'ratified', agreement_hash = ?, updated_at = datetime('now') WHERE id = ?",
          [contractAddress, agreementHash, id],
        );

        await d1.run(
          "INSERT INTO audit_events (agreement_id, event_type, actor_id, actor_email, detail, tx_hash) VALUES (?, 'deployed', ?, ?, ?, ?)",
          [
            id,
            user.id,
            user.email,
            `Agreement deployed to ${contractAddress}`,
            txHash,
          ],
        );
        break;
      }

      case "fund": {
        if (!agreement.contract_address) {
          return NextResponse.json(
            { error: "Agreement not deployed yet" },
            { status: 400 },
          );
        }
        const totalAmount = agreement.total
          ? BigInt(Math.round(parseFloat(agreement.total) * 1_000_000))
          : BigInt(0);

        const { txHash: fundTxHash } = await fundAgreementOnChain({
          buyerEmail: user.email,
          contractAddress: agreement.contract_address,
          totalAmount,
        });

        txHash = fundTxHash;

        await d1.run(
          "UPDATE agreements SET status = 'funded', updated_at = datetime('now') WHERE id = ?",
          [id],
        );

        await d1.run(
          "INSERT INTO audit_events (agreement_id, event_type, actor_id, actor_email, detail, tx_hash) VALUES (?, 'funded', ?, ?, ?, ?)",
          [id, user.id, user.email, "Agreement funded with USDC", txHash],
        );
        break;
      }

      case "approve": {
        if (!agreement.contract_address) {
          return NextResponse.json(
            { error: "Agreement not deployed yet" },
            { status: 400 },
          );
        }

        const { txHash: approveTxHash } = await approveDeliveryOnChain({
          buyerEmail: user.email,
          contractAddress: agreement.contract_address,
        });

        txHash = approveTxHash;

        await d1.run(
          "UPDATE agreements SET status = 'payment_released', updated_at = datetime('now') WHERE id = ?",
          [id],
        );

        await d1.run(
          "INSERT INTO audit_events (agreement_id, event_type, actor_id, actor_email, detail, tx_hash) VALUES (?, 'delivery_approved', ?, ?, ?, ?)",
          [
            id,
            user.id,
            user.email,
            "Delivery approved, payment released",
            txHash,
          ],
        );
        break;
      }

      case "reject": {
        if (!agreement.contract_address) {
          return NextResponse.json(
            { error: "Agreement not deployed yet" },
            { status: 400 },
          );
        }

        const { txHash: rejectTxHash } = await rejectDeliveryOnChain({
          buyerEmail: user.email,
          contractAddress: agreement.contract_address,
        });

        txHash = rejectTxHash;

        await d1.run(
          "UPDATE agreements SET status = 'rejected', updated_at = datetime('now') WHERE id = ?",
          [id],
        );

        await d1.run(
          "INSERT INTO audit_events (agreement_id, event_type, actor_id, actor_email, detail, tx_hash) VALUES (?, 'delivery_rejected', ?, ?, ?, ?)",
          [id, user.id, user.email, "Delivery rejected", txHash],
        );
        break;
      }

      case "deliver": {
        if (!agreement.contract_address) {
          return NextResponse.json(
            { error: "Agreement not deployed yet" },
            { status: 400 },
          );
        }

        const { txHash: deliverTxHash } = await markDeliveredOnChain({
          supplierEmail: agreement.supplier_email,
          contractAddress: agreement.contract_address,
        });

        txHash = deliverTxHash;

        await d1.run(
          "UPDATE agreements SET status = 'delivered', delivered_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
          [id],
        );

        await d1.run(
          "INSERT INTO audit_events (agreement_id, event_type, actor_id, actor_email, detail, tx_hash) VALUES (?, 'delivered', ?, ?, ?, ?)",
          [id, user.id, user.email, "Delivery marked on-chain", txHash],
        );
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, txHash });
  } catch (err) {
    console.error("Action error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
