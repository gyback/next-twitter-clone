import { PropsWithChildren } from "react";

const PageLayout = ({ children }: PropsWithChildren) => (
  <main className="flex h-screen justify-center">
    <div className="h-full w-full border-x border-slate-400 md:max-w-2xl">
      {children}
    </div>
  </main>
);

export default PageLayout;
