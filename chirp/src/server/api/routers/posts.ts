import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { filterUserForClient } from "~/utils/filterUserForClient";
import { ChirpPost } from ".prisma/client";

const rateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

const addUserData = async (posts: ChirpPost[]) => {
  const users = (
    await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })
  ).map(filterUserForClient);

  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);

    if (!author?.name) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Author for post not found",
      });
    }

    return {
      post,
      author: {
        ...author,
        name: author.name,
      },
    };
  });
};

export const postsRouter = createTRPCRouter({
  getLatest: publicProcedure.query(({ ctx }) => {
    return ctx.db.chirpPost.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.chirpPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return addUserData(posts);
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.chirpPost.findFirst({
        where: {
          id: input.id,
        },
      });
      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }
      return (await addUserData([post]))[0];
    }),

  getAllByUserId: publicProcedure.input(z.object({ userId: z.string() })).query(
    async ({ ctx, input }) =>
      await ctx.db.chirpPost
        .findMany({
          where: {
            authorId: input.userId,
          },
          take: 100,
          orderBy: { createdAt: "desc" },
        })
        .then(addUserData),
  ),

  create: privateProcedure
    .input(
      z.object({
        content: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { success } = await rateLimit.limit(ctx.userId);
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests",
        });
      }
      return ctx.db.chirpPost.create({
        data: {
          content: input.content,
          authorId: ctx.userId,
        },
      });
    }),
});
