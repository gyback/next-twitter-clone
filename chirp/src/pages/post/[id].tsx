import Head from "next/head";
import { api } from "~/utils/api";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import { clerkClient } from "@clerk/nextjs";
import PageLayout from "~/components/PageLayout.component";
import generateSSGHelper from "~/utils/ssgHelper";
import PostView from "~/components/PostView.component";

type PageProps = {
  id: string;
} & InferGetStaticPropsType<typeof getStaticProps>;

const SinglePostPage: NextPage<PageProps> = ({ id }) => {
  const { data, isLoading } = api.posts.getById.useQuery({
    id,
  });

  if (isLoading) return <div>Loading...</div>;

  if (!data) return <div>Something went wrong...</div>;

  return (
    <>
      <Head>
        <title>{`${data.post.content} - @${data.author.name}`}</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <PostView {...data} />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const helper = generateSSGHelper();

  const id = context.params?.id;

  if (typeof id !== "string") throw new Error("id is not a string");

  await helper.posts.getById.prefetch({ id });

  return {
    props: {
      trpcState: helper.dehydrate(),
      id,
    },
  };
};

export default SinglePostPage;

export const getStaticPaths = async () => {
  const users = await clerkClient.users.getUserList();
  return {
    paths: users.map((user) => ({ params: { id: `@${user.username}` } })),
    fallback: true,
  };
};
