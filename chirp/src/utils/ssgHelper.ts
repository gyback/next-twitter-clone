import { createServerSideHelpers } from "@trpc/react-query/server";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";
import superjson from "superjson";

const generateSSGHelper = () =>
  createServerSideHelpers({
    router: appRouter,
    ctx: { db, sessionClaims: null },
    transformer: superjson, // optional - adds superjson serialization
  });

export default generateSSGHelper;
