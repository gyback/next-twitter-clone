import Head from "next/head";

import { api } from "~/utils/api";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { LoadingPage, LoadingSpinner } from "~/components/Loading.component";
import { useState } from "react";
import toast from "react-hot-toast";
import { TRPCClientError } from "@trpc/client";
import PageLayout from "~/components/PageLayout.component";
import PostView from "~/components/PostView.component";

const CreatePostWizard = () => {
  const [input, setInput] = useState("");

  const ctx = api.useUtils();

  const { mutate: createPost, isLoading: isCreatingPost } =
    api.posts.create.useMutation({
      onSuccess: () => {
        // Clear the input
        setInput("");
        // Invalidate the query
        void ctx.posts.getAll.invalidate();
      },
      onError: (err) => {
        const errorMessage = err.data?.zodError?.fieldErrors.content?.[0];
        console.log("Error", err);
        switch (true) {
          case err instanceof TRPCClientError:
            toast.error(err.message);
            break;
          case typeof errorMessage === "string":
            toast.error(errorMessage as unknown as string);
            break;
          default:
            toast.error("Failed to post. Please retry again later.");
        }
      },
    });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createPost({ content: input });
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-row gap-3">
      <input
        placeholder="Chirp something"
        className="w-fill flex-grow border-none bg-transparent p-2 outline-0"
        type="text"
        name="content"
        value={input}
        onChange={handleChange}
        required
        disabled={isCreatingPost}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (!input) return;
            createPost({ content: input });
          }
        }}
      />
      <button type="submit" className="text-white" disabled={isCreatingPost}>
        {isCreatingPost ? <LoadingSpinner /> : "Post"}
      </button>
    </form>
  );
};

const User = () => {
  const { user } = useUser();
  if (user) return <UserButton />;
  return (
    <div className="flex w-full flex-col gap-3">
      <SignInButton />
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;
  if (!data) return <div>Something went wrong...</div>;
  return (
    <section className="flex flex-col">{data.map((p) => PostView(p))}</section>
  );
};
export default function Home() {
  // Early fetch
  api.posts.getAll.useQuery();
  useUser();

  return (
    <>
      <Head>
        <title>Chirp</title>
        <meta name="description" content="Next js Twitter clone" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <div className="row-auto flex w-full justify-start gap-3 border-b border-slate-400 p-4">
          <User />
          <CreatePostWizard />
        </div>
        <Feed />
      </PageLayout>
    </>
  );
}
