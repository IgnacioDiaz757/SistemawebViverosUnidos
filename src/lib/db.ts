// DB stub (reemplazo de Prisma) para entorno solo-UI
type AnyRecord = Record<string, any>;

function createNoopModel() {
  return {
    create: async (_args?: AnyRecord) => ({}),
    upsert: async (_args?: AnyRecord) => ({}),
    findUnique: async (_args?: AnyRecord) => null,
    findMany: async (_args?: AnyRecord) => [],
    update: async (_args?: AnyRecord) => ({}),
    delete: async (_args?: AnyRecord) => ({}),
  };
}

export const prisma: AnyRecord = {
  usuario: createNoopModel(),
  asociado: createNoopModel(),
  contratista: createNoopModel(),
  $disconnect: async () => {},
};

export default prisma;


