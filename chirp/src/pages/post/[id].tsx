import Head from "next/head";
import PageLayout from "~/components/PageLayout.component";

export default function SinglePostPage() {
  return (
    <>
      <Head>
        <title>Post</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>A Single Post</PageLayout>
    </>
  );
}