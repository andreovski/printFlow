import {
  getBudgetParamsSchema,
  publicBudgetTokenParamsSchema,
  rejectBudgetBodySchema,
} from '@magic-system/schemas';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { BudgetsService } from '@/services/budgets.service';
import { shortUrlService } from '@/services/short-url.service';

/**
 * Get public budget by approval token (no auth required)
 */
export async function getPublicBudgetController(request: FastifyRequest, reply: FastifyReply) {
  const { token } = publicBudgetTokenParamsSchema.parse(request.params);

  const budgetsService = new BudgetsService();
  const budget = await budgetsService.findByApprovalToken(token);

  if (!budget) {
    return reply.status(404).send({ message: 'Budget not found or link is invalid' });
  }

  // Check if budget is still in SENT status (can be approved/rejected)
  if (budget.status !== 'SENT') {
    return reply.status(400).send({
      message: 'This budget has already been processed',
      status: budget.status,
    });
  }

  // Check if expired based on expirationDate
  const isExpired = budget.expirationDate ? new Date() > new Date(budget.expirationDate) : false;

  // Type assertion for the relations included by findByApprovalToken
  const budgetWithRelations = budget as typeof budget & {
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      salePrice: number | string;
      discountType: string | null;
      discountValue: number | string | null;
      total: number | string;
    }>;
    client: { name: string };
    organization: {
      name: string;
      fantasyName: string | null;
      mainPhone: string | null;
      mainEmail: string | null;
    };
  };

  // Return limited data for public access
  return reply.status(200).send({
    budget: {
      id: budgetWithRelations.id,
      code: budgetWithRelations.code,
      status: budgetWithRelations.status,
      expirationDate: budgetWithRelations.expirationDate,
      total: budgetWithRelations.total,
      subtotal: budgetWithRelations.subtotal,
      discountType: budgetWithRelations.discountType,
      discountValue: budgetWithRelations.discountValue,
      advancePayment: budgetWithRelations.advancePayment,
      paymentType: budgetWithRelations.paymentType,
      notes: budgetWithRelations.notes,
      items: budgetWithRelations.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        salePrice: item.salePrice,
        discountType: item.discountType,
        discountValue: item.discountValue,
        total: item.total,
      })),
      client: budgetWithRelations.client,
      organization: budgetWithRelations.organization,
    },
    isExpired,
  });
}

/**
 * Approve budget via public link (no auth required)
 */
export async function approvePublicBudgetController(request: FastifyRequest, reply: FastifyReply) {
  const { token } = publicBudgetTokenParamsSchema.parse(request.params);

  const budgetsService = new BudgetsService();
  const budget = await budgetsService.findByApprovalToken(token);

  if (!budget) {
    return reply.status(404).send({ message: 'Budget not found or link is invalid' });
  }

  // Check if budget is still in SENT status
  if (budget.status !== 'SENT') {
    return reply.status(400).send({
      message: 'This budget has already been processed',
      status: budget.status,
    });
  }

  // Check if expired
  if (budget.expirationDate && new Date() > new Date(budget.expirationDate)) {
    return reply.status(400).send({ message: 'This budget has expired' });
  }

  const updatedBudget = await budgetsService.approveByClient(budget.id);

  return reply.status(200).send({
    message: 'Budget approved successfully',
    budget: {
      id: updatedBudget.id,
      code: updatedBudget.code,
      status: updatedBudget.status,
    },
  });
}

/**
 * Reject budget via public link (no auth required)
 */
export async function rejectPublicBudgetController(request: FastifyRequest, reply: FastifyReply) {
  const { token } = publicBudgetTokenParamsSchema.parse(request.params);
  const { reason } = rejectBudgetBodySchema.parse(request.body || {});

  const budgetsService = new BudgetsService();
  const budget = await budgetsService.findByApprovalToken(token);

  if (!budget) {
    return reply.status(404).send({ message: 'Budget not found or link is invalid' });
  }

  // Check if budget is still in SENT status
  if (budget.status !== 'SENT') {
    return reply.status(400).send({
      message: 'This budget has already been processed',
      status: budget.status,
    });
  }

  // Check if expired
  if (budget.expirationDate && new Date() > new Date(budget.expirationDate)) {
    return reply.status(400).send({ message: 'This budget has expired' });
  }

  const updatedBudget = await budgetsService.rejectByClient(budget.id, reason);

  return reply.status(200).send({
    message: 'Budget rejected successfully',
    budget: {
      id: updatedBudget.id,
      code: updatedBudget.code,
      status: updatedBudget.status,
    },
  });
}

/**
 * Generate approval link for a budget (auth required)
 */
export async function generateApprovalLinkController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = getBudgetParamsSchema.parse(request.params);
  const { organizationId } = request.user as { organizationId: string };

  const budgetsService = new BudgetsService();

  const budget = await budgetsService.findById(id);
  if (!budget) {
    return reply.status(404).send({ message: 'Budget not found' });
  }

  // Verify organization ownership
  if (budget.organizationId !== organizationId) {
    return reply.status(403).send({ message: 'Access denied' });
  }

  if (budget.status !== 'SENT') {
    return reply.status(400).send({
      message: 'Cannot generate approval link for budget that is not SENT',
    });
  }

  const { token, expiresAt } = await budgetsService.generateApprovalToken(id);

  // Build the approval URL using the frontend URL from environment
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const approvalUrl = `${frontendUrl}/approval/${token}`;

  // Generate short URL
  const { shortUrl } = await shortUrlService.createShortUrl({
    targetUrl: `/approval/${token}`,
    budgetId: id,
    expiresAt: expiresAt || undefined,
  });

  return reply.status(200).send({
    approvalToken: token,
    approvalUrl,
    shortUrl,
    expiresAt,
  });
}

const shortCodeParamsSchema = z.object({
  code: z.string().min(1),
});

/**
 * Get target URL for a short code (no auth required)
 * Returns the target URL for frontend to redirect
 */
export async function getShortUrlController(request: FastifyRequest, reply: FastifyReply) {
  const { code } = shortCodeParamsSchema.parse(request.params);

  const targetUrl = await shortUrlService.getTargetUrl(code);

  if (!targetUrl) {
    return reply.status(404).send({ message: 'Link not found or expired' });
  }

  return reply.status(200).send({ targetUrl });
}
