import { FastifyReply, FastifyRequest } from 'fastify';
import {
  createProductBodySchema,
  getProductParamsSchema,
  updateProductParamsSchema,
  updateProductBodySchema,
} from '@magic-system/schemas';
import { ProductsRepository } from '@/repositories/products.repository';

export async function createProductController(request: FastifyRequest, reply: FastifyReply) {
  const { name, price } = createProductBodySchema.parse(request.body);
  const { organizationId } = request.user as { organizationId: string };

  const productsRepository = new ProductsRepository();

  const product = await productsRepository.create({
    name,
    price,
    organization: {
      connect: { id: organizationId },
    },
  });

  return reply.status(201).send({ product });
}

export async function fetchProductsController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };

  const productsRepository = new ProductsRepository();

  const products = await productsRepository.findMany(organizationId);

  return reply.status(200).send({ products });
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
  const { name, price } = updateProductBodySchema.parse(request.body);

  const productsRepository = new ProductsRepository();

  const product = await productsRepository.update(id, {
    name,
    price,
  });

  return reply.status(200).send({ product });
}
