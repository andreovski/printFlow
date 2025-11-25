import { FastifyInstance } from 'fastify';

import { authenticateController } from './controllers/authenticate.controller';
import {
  createClientController,
  fetchClientsController,
  getClientController,
  updateClientController,
  deleteClientController,
} from './controllers/clients.controller';
import { getMetricsController } from './controllers/metrics.controller';
import { getOrganizationController } from './controllers/organizations.controller';
import {
  createProductController,
  fetchProductsController,
  getProductController,
  updateProductController,
  deleteProductController,
} from './controllers/products.controller';
import {
  createUserController,
  deleteUserController,
  fetchUsersController,
  getUserController,
  registerUserController,
  updateUserController,
} from './controllers/users.controller';
import { verifyJwt } from './middlewares/verify-jwt';
import { verifyUserRole } from './middlewares/verify-permissions';

export async function appRoutes(app: FastifyInstance) {
  app.post('/users', registerUserController);
  app.post('/sessions', authenticateController);

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
  });
}
