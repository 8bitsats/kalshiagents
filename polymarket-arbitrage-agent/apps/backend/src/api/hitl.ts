import type { FastifyRequest, FastifyReply } from "fastify";
import { HitlProposalStore } from "../execution/hitl_gate.js";

export function createHitlRoutes(store: HitlProposalStore) {
  return {
    list: async (req: FastifyRequest, reply: FastifyReply) => {
      const limit = Math.max(1, Math.min(200, Number((req.query as any).limit ?? 50)));
      return reply.send({ ok: true, proposals: store.list(limit) });
    },

    approve: async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as any;
      const id = String(body?.id ?? "");
      if (!id) {
        return reply.status(400).send({ ok: false, error: "missing id" });
      }

      const p = store.approve(id);
      if (!p) {
        return reply.status(404).send({ ok: false, error: "not found" });
      }

      if (p.status !== "APPROVED") {
        return reply.status(409).send({ ok: false, status: p.status, proposal: p });
      }

      // Return the exact action object to execute (NO SHAPE CHANGE)
      return reply.send({ ok: true, proposal: p, action: p.action });
    },

    reject: async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as any;
      const id = String(body?.id ?? "");
      const reason = body?.reason ? String(body.reason) : undefined;
      if (!id) {
        return reply.status(400).send({ ok: false, error: "missing id" });
      }

      const p = store.reject(id, reason);
      if (!p) {
        return reply.status(404).send({ ok: false, error: "not found" });
      }

      return reply.send({ ok: true, proposal: p });
    },
  };
}

