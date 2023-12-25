import Head from "next/head";
import { api } from "~/utils/api";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import { clerkClient } from "@clerk/nextjs";
import PageLayout from "~/components/PageLayout.component";
import Image from "next/image";
import { LoadingPage } from "~/components/Loading.component";
import PostView from "~/components/PostView.component";
import generateSSGHelper from "~/utils/ssgHelper";

type PageProps = {
  username: string;
} & InferGetStaticPropsType<typeof getStaticProps>;

const ProfileFeed = (props: { userId: string }) => {
  const { data, isLoading } = api.posts.getAllByUserId.useQuery({
    userId: props.userId,
  });
  if (isLoading) return <LoadingPage />;
  if (!data || data.length === 0) return <div>User has not posted</div>;
  return (
    <section className="flex flex-col">
      {data.map((fullPost) => PostView(fullPost))}
    </section>
  );
};
const ProfilePage: NextPage<PageProps> = ({ username }) => {
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
    username,
  });

  if (isLoading) return <div>Loading...</div>;

  if (!data) return <div>Something went wrong...</div>;

  return (
    <>
      <Head>
        <title>Profile</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <div className=" relative h-36 bg-slate-600">
          <Image
            src={data.profilePicture}
            alt={`@${data.name ? data.name + "'s" : ""} profile picture`}
            width={128}
            height={128}
            className="absolute bottom-0 -mb-16 ml-4 rounded-full border-2 border-black bg-black align-bottom"
          />
        </div>
        <div className="mt-16 flex flex-col gap-3 p-4 text-2xl font-bold">
          <p className="">@{data.name}</p>
        </div>
        <div className="w-full border-b border-slate-400" />
        <ProfileFeed userId={data.id} />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const helper = generateSSGHelper();

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("slug is not a string");

  const username = slug.replace("@", "");

  await helper.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      trpcState: helper.dehydrate(),
      username,
    },
  };
};

export default ProfilePage;

export const getStaticPaths = async () => {
  const users = await clerkClient.users.getUserList();
  return {
    paths: users.map((user) => ({ params: { slug: `@${user.username}` } })),
    fallback: true,
  };
};
