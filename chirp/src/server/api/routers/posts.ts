import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {clerkClient} from "@clerk/nextjs";
import type {User} from "@clerk/backend";
import {TRPCError} from "@trpc/server";

const filterUserforClient = (user: User) => (
  {
    id: user.id,
    name: user.username,
    profilePicture: user.imageUrl
  });
export const postsRouter = createTRPCRouter({

  create: publicProcedure
    .input(z.object({ content: z.string().min(1), authorId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // simulate a slow db call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return ctx.db.post.create({
        data: {
          content: input.content,
          authorId: input.authorId,
        },
      });
    }),

  getLatest: publicProcedure
    .query(({ ctx }) => {
    return ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }),

  getAll: publicProcedure
    .query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
    });

    const users = (await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })).map(filterUserforClient);

    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId);

      if (!author || !author.name) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: 'Author for post not found'});
      }

      return {
        post,
        author: {
          ...author,
          name: author.name
        },
      };
    });
  }),
});
