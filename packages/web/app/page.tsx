import AgentChat from "@/components/agent/AgentChat";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-5xl flex-col items-center py-8 px-4 bg-white dark:bg-black sm:px-8">
        <div className="flex flex-col items-center gap-6 text-center w-full mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
            Claude Code Agent with AWS Bedrock
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            AWS Bedrock Agent Coreにデプロイされた Claude Code Agentと対話できます。
            ログインして、エージェントに質問してみましょう。
          </p>
        </div>
        <div className="w-full mt-8">
          <AgentChat />
        </div>
      </main>
    </div>
  );
}
