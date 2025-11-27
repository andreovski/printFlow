import {
  createProductBodySchema,
  getProductParamsSchema,
  updateProductParamsSchema,
  updateProductBodySchema,
  paginationQuerySchema,
} from '@magic-system/schemas';
import { FastifyReply, FastifyRequest } from 'fastify';

import { ProductsRepository } from '@/repositories/products.repository';

export async function createProductController(request: FastifyRequest, reply: FastifyReply) {
  const { title, description, code, unitType, costPrice, salePrice, stock, category, active } =
    createProductBodySchema.parse(request.body);
  const { organizationId } = request.user as { organizationId: string };

  const productsRepository = new ProductsRepository();

  const product = await productsRepository.create({
    title,
    description,
    code,
    unitType,
    costPrice,
    salePrice,
    stock,
    category,
    active,
    organization: {
      connect: { id: organizationId },
    },
  });

  return reply.status(201).send({ product });
}

export async function fetchProductsController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };
  const { page, pageSize, search } = paginationQuerySchema.parse(request.query);

  const productsRepository = new ProductsRepository();

  const { data, total } = await productsRepository.findMany(organizationId, page, pageSize, search);

  const totalPages = Math.ceil(total / pageSize);

  return reply.status(200).send({
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
    },
  });
}

export async function getProductController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = getProductParamsSchema.parse(request.params);

  const productsRepository = new ProductsRepository();

  const product = await productsRepository.findById(id);

  if (!product) {
    return reply.status(404).send({ message: 'Product not found' });
  }

  return reply.status(200).send({ product });
}

export async function updateProductController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = updateProductParamsSchema.parse(request.params);
  const { title, description, code, unitType, costPrice, salePrice, stock, category, active } =
    updateProductBodySchema.parse(request.body);

  const productsRepository = new ProductsRepository();

  const product = await productsRepository.update(id, {
    title,
    description,
    code,
    unitType,
    costPrice,
    salePrice,
    stock,
    category,
    active,
  });

  return reply.status(200).send({ product });
}

export async function deleteProductController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = updateProductParamsSchema.parse(request.params);

  const productsRepository = new ProductsRepository();

  await productsRepository.delete(id);

  return reply.status(204).send();
}
