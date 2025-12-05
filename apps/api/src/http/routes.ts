import { FastifyInstance } from 'fastify';

import {
  createBudgetAttachmentsController,
  fetchBudgetAttachmentsController,
  deleteBudgetAttachmentController,
  createCardAttachmentsController,
  fetchCardAttachmentsController,
  deleteCardAttachmentController,
} from './controllers/attachments.controller';
import { authenticateController } from './controllers/authenticate.controller';
import {
  createBoardController,
  fetchBoardsController,
  createCardController,
  moveCardController,
  updateCardController,
  deleteCardController,
  createColumnController,
  deleteColumnController,
  moveColumnController,
  fetchApprovedBudgetsController,
  toggleChecklistItemController,
} from './controllers/boards.controller';
import {
  createBudgetController,
  fetchBudgetsController,
  fetchArchivedBudgetsController,
  getBudgetController,
  updateBudgetController,
  updateBudgetStatusController,
  deleteBudgetController,
  archiveBudgetController,
} from './controllers/budgets.controller';
import {
  createClientController,
  fetchClientsController,
  getClientController,
  updateClientController,
  deleteClientController,
} from './controllers/clients.controller';
import { getMetricsController } from './controllers/metrics.controller';
import {
  getOrganizationController,
  updateOrganizationController,
  createOrganizationController,
} from './controllers/organizations.controller';
import {
  createProductController,
  fetchProductsController,
  getProductController,
  updateProductController,
  deleteProductController,
} from './controllers/products.controller';
import {
  getPublicBudgetController,
  approvePublicBudgetController,
  rejectPublicBudgetController,
  generateApprovalLinkController,
  getShortUrlController,
} from './controllers/public-budgets.controller';
import {
  createTagController,
  fetchTagsController,
  getTagController,
  updateTagController,
  deleteTagController,
} from './controllers/tags.controller';
import {
  createTemplateController,
  fetchTemplatesController,
  getTemplateController,
  updateTemplateController,
  deleteTemplateController,
} from './controllers/templates.controller';
import {
  createUserController,
  deleteUserController,
  fetchUsersController,
  getUserController,
  getProfileController,
  registerUserController,
  updateUserController,
  updateProfileController,
  changePasswordController,
} from './controllers/users.controller';
import { verifyJwt } from './middlewares/verify-jwt';
import { verifyUserRole } from './middlewares/verify-permissions';

export async function appRoutes(app: FastifyInstance) {
  app.post('/users', registerUserController);
  app.post('/sessions', authenticateController);

  // Public routes (no authentication required)
  app.get('/public/budgets/:token', getPublicBudgetController);
  app.post('/public/budgets/:token/approve', approvePublicBudgetController);
  app.post('/public/budgets/:token/reject', rejectPublicBudgetController);

  // Short URL redirect
  app.get('/short-url/:code', getShortUrlController);

  // Authenticated routes
  app.register(async (authRoutes) => {
    authRoutes.addHook('onRequest', verifyJwt);

    // Metrics
    authRoutes.get('/metrics', getMetricsController);

    // Clients
    authRoutes.post('/clients', createClientController);
    authRoutes.get('/clients', fetchClientsController);
    authRoutes.get('/clients/:id', getClientController);
    authRoutes.delete('/clients/:id', deleteClientController);
    authRoutes.put('/clients/:id', updateClientController);

    // Products
    authRoutes.post('/products', createProductController);
    authRoutes.get('/products', fetchProductsController);
    authRoutes.get('/products/:id', getProductController);
    authRoutes.put('/products/:id', updateProductController);
    authRoutes.delete('/products/:id', deleteProductController);

    // Users Management (Admin/Master only)
    authRoutes.get(
      '/users',
      { onRequest: [verifyUserRole(['ADMIN', 'MASTER'])] },
      fetchUsersController
    );
    authRoutes.get(
      '/users/:id',
      { onRequest: [verifyUserRole(['ADMIN', 'MASTER'])] },
      getUserController
    );
    authRoutes.post(
      '/users/create',
      { onRequest: [verifyUserRole(['ADMIN', 'MASTER'])] },
      createUserController
    );
    authRoutes.put(
      '/users/:id',
      { onRequest: [verifyUserRole(['ADMIN', 'MASTER'])] },
      updateUserController
    );
    authRoutes.delete(
      '/users/:id',
      { onRequest: [verifyUserRole(['ADMIN', 'MASTER'])] },
      deleteUserController
    );

    // Organization
    authRoutes.get('/organization', getOrganizationController);
    authRoutes.post('/organizations/create', createOrganizationController);
    authRoutes.put(
      '/organization',
      { onRequest: [verifyUserRole(['ADMIN', 'MASTER'])] },
      updateOrganizationController
    );

    // Profile (current user)
    authRoutes.get('/profile', getProfileController);
    authRoutes.put('/profile', updateProfileController);
    authRoutes.put('/profile/password', changePasswordController);

    // Budgets
    authRoutes.post('/budgets', createBudgetController);
    authRoutes.get('/budgets', fetchBudgetsController);
    authRoutes.get('/budgets/archived', fetchArchivedBudgetsController);
    authRoutes.get('/budgets/:id', getBudgetController);
    authRoutes.put('/budgets/:id', updateBudgetController);
    authRoutes.patch('/budgets/:id/status', updateBudgetStatusController);
    authRoutes.delete('/budgets/:id', deleteBudgetController);
    authRoutes.patch('/budgets/:id/archive', archiveBudgetController);
    authRoutes.post('/budgets/:id/generate-link', generateApprovalLinkController);

    // Boards (Kanban)
    authRoutes.post('/boards', createBoardController);
    authRoutes.get('/boards', fetchBoardsController);
    authRoutes.get('/boards/approved-budgets', fetchApprovedBudgetsController);
    authRoutes.post('/columns', createColumnController);
    authRoutes.delete('/columns/:columnId', deleteColumnController);
    authRoutes.patch('/columns/move', moveColumnController);
    authRoutes.post('/columns/:columnId/cards', createCardController);
    authRoutes.patch('/cards/move', moveCardController);
    authRoutes.put('/cards/:id', updateCardController);
    authRoutes.delete('/cards/:id', deleteCardController);
    authRoutes.patch('/cards/:cardId/checklist/:itemId/toggle', toggleChecklistItemController);

    // Etiquetas
    authRoutes.post('/tags', createTagController);
    authRoutes.get('/tags', fetchTagsController);
    authRoutes.get('/tags/:id', getTagController);
    authRoutes.put('/tags/:id', updateTagController);
    authRoutes.delete('/tags/:id', deleteTagController);

    // Templates
    authRoutes.post('/templates', createTemplateController);
    authRoutes.get('/templates', fetchTemplatesController);
    authRoutes.get('/templates/:id', getTemplateController);
    authRoutes.put('/templates/:id', updateTemplateController);
    authRoutes.delete('/templates/:id', deleteTemplateController);

    // Attachments - Budget
    authRoutes.post('/budgets/:budgetId/attachments', createBudgetAttachmentsController);
    authRoutes.get('/budgets/:budgetId/attachments', fetchBudgetAttachmentsController);
    authRoutes.delete(
      '/budgets/:budgetId/attachments/:attachmentId',
      deleteBudgetAttachmentController
    );

    // Attachments - Card
    authRoutes.post('/cards/:cardId/attachments', createCardAttachmentsController);
    authRoutes.get('/cards/:cardId/attachments', fetchCardAttachmentsController);
    authRoutes.delete('/cards/:cardId/attachments/:attachmentId', deleteCardAttachmentController);
  });
}
