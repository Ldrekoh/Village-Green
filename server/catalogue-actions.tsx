"use server";

import { db } from "@/db/drizzle";
import { products } from "@/db/schema";
import { and, eq, ilike, sql } from "drizzle-orm";

export const getCategoryTreeAction = async () => {
  try {
    const allCategories = await db.query.categories.findMany();

    const parents = allCategories.filter((c) => !c.parentId);

    const tree = parents.map((parent) => ({
      ...parent,
      children: allCategories.filter((c) => c.parentId === parent.id),
    }));

    return {
      success: true,
      data: tree,
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      data: [],
      message: "Impossible de charger les catécories",
    };
  }
};

interface FilterParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export const getProductsAction = async (filters: FilterParams) => {
  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const offset = (page - 1) * limit;

  try {
    const conditions = [eq(products.isActive, true)];
    if (filters.search) {
      conditions.push(ilike(products.labelShort, `%${filters.search}`));
    }

    if (filters.category) {
      conditions.push(eq(products.categoryId, filters.category));
    }

    const whereClause = and(...conditions);

    const [data, totalResult] = await Promise.all([
      db.query.products.findMany({
        where: whereClause,
        limit: limit,
        offset: offset,
        orderBy: (products, { desc }) => [desc(products.createdAt)],
        with: {
          category: true,
        },
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereClause),
    ]);

    const totalItems = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      success: true,
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
      },
    };
  } catch (error) {
    console.error("Error fetching products :", error);
    return {
      success: false,
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
      },
    };
  }
};

export const getProductByIdAction = async (id: string) => {
  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        category: true,
        provider: true,
      },
    });

    return {
      success: true,
      data: product || null,
    };
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return {
      success: false,
      data: null,
    };
  }
};
