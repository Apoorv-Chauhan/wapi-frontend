/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import AgentForm from "@/src/components/agent/AgentForm";
import { useCreateAgentMutation } from "@/src/redux/api/agentApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const AgentCreatePage = () => {
  const router = useRouter();
  const [createAgent, { isLoading }] = useCreateAgentMutation();
  const handleSave = async (data: any) => {
    try {
      await createAgent(data).unwrap();
      toast.success("Agent activated successfully");
      router.push("/agents");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to onboard agent");
    }
  };

  return (
    <div className="sm:p-8 p-6 min-h-screen bg-slate-50/30 dark:bg-transparent transition-all">
      <AgentForm onSave={handleSave} onCancel={() => router.push("/agents")} isLoading={isLoading} />
    </div>
  );
};

export default AgentCreatePage;
