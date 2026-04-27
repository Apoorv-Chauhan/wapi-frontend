/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Badge } from "@/src/elements/ui/badge";
import { Button } from "@/src/elements/ui/button";
import { Card, CardContent } from "@/src/elements/ui/card";
import { useConnectionMutation } from "@/src/redux/api/whatsappApi";
import { useGetWorkspacesQuery } from "@/src/redux/api/workspaceApi";
import { useAppDispatch, useAppSelector } from "@/src/redux/hooks";
import { setWorkspace } from "@/src/redux/reducers/workspaceSlice";
import { useEmbeddedSignup } from "@/src/utils/hooks/useEmbeddedSignup";
import { ExternalLink, Link2, MessageCircle, Plug } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ManualConnectionKeys from "./ManualConnectionKeys";
import QRCodeConnection from "./QRCodeConnection";
import WabaSetupGuide from "./WabaSetupGuide";
import WebhookConfiguration from "./WebhookConfiguration";
import { cn } from "@/src/lib/utils";

const ConnectWABA = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [isLoading, setIsLoading] = useState(false);
  const [connection] = useConnectionMutation();
  const { selectedWorkspace } = useAppSelector((state: any) => state.workspace);
  const { data: workspacesData, refetch: refetchWorkspaces } = useGetWorkspacesQuery();
  const dispatch = useAppDispatch();

  const latestWorkspace = workspacesData?.data?.find((ws: any) => ws._id === selectedWorkspace?._id);
  const isBaileys = (latestWorkspace?.waba_type || selectedWorkspace?.waba_type) === "baileys";
  const currentStatus = latestWorkspace?.connection_status || selectedWorkspace?.connection_status;
  const currentWabaId = latestWorkspace?.waba_id || selectedWorkspace?.waba_id;

  const isConnected = isBaileys ? !!currentWabaId && currentStatus === "connected" : !!currentWabaId;
  const [activeTab, setActiveTab] = useState<"manual" | "qrcode">(isBaileys ? "qrcode" : "manual");

  useEffect(() => {
    if (tabParam === "manual" || tabParam === "qrcode") {
      setActiveTab(tabParam as "manual" | "qrcode");
    }
  }, [tabParam]);

  const handleFinish = useCallback(
    async (code: string, signupData: any) => {
      try {
        setIsLoading(true);

        const response: any = await connection({
          code,
          signupData,
          workspace_id: selectedWorkspace?._id,
        }).unwrap();

        if (response.success) {
          const { data: updatedWorkspaces } = await refetchWorkspaces();
          if (updatedWorkspaces?.data) {
            const currentWs = updatedWorkspaces.data.find((ws: any) => ws._id === selectedWorkspace?._id);
            if (currentWs) {
              dispatch(setWorkspace(currentWs));
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [connection, selectedWorkspace, refetchWorkspaces, dispatch]
  );

  const { startSignup, fbReady } = useEmbeddedSignup(handleFinish);

  return (
    <div className="p-4 sm:p-8 max-w-400 mx-auto space-y-6 sm:space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 border border-(--light-border) rounded-lg bg-(--light-primary) dark:bg-(--card-color) dark:border-(--card-border-color)">
          <Plug className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Integrations</h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Connect your WhatsApp Business Account to start messaging.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Connection Forms */}
        <div className="xl:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-gray-100 dark:bg-(--card-color) dark:border-(--card-border-color) shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-(--dark-sidebar) flex items-center justify-center text-primary shadow-inner">
                    <MessageCircle size={28} />
                  </div>
                  {isConnected ? (
                    <Badge variant="success" className="px-2.5 py-1 gap-1.5 flex items-center bg-green-50 dark:bg-(--page-body-bg) dark:border-(--card-border-color) dark:hover:bg-(--table-hover) text-primary border-green-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="px-2.5 py-1 gap-1.5 dark:bg-(--dark-body) flex items-center">
                      Not Connected
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-300">WhatsApp Business</h3>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 dark:text-gray-400">Connect with customers on their favorite messaging app. Send updates, support messages, and more directly...</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full h-11 font-semibold border-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:border-none dark:hover:text-amber-50" onClickCapture={() => router.push("/manage_waba")} disabled={!isConnected}>
                    <ExternalLink className="mr-2" size={16} />
                    Manage
                  </Button>
                  {/* <Button className="w-full h-11 font-semibold shadow-lg dark:text-amber-50 shadow-primary/20" onClick={startSignup} disabled={!fbReady || !!isConnected || isLoading}>
                    <Link2 className="mr-2" size={16} />
                    {isLoading ? "Connecting..." : isConnected ? "Connected" : "Connect"}
                  </Button> */}
                  <Button
                    className="w-full h-11 font-semibold shadow-lg dark:text-amber-50 shadow-primary/20"
                    onClick={() =>
                      window.open(
                        "https://waba.aisensy.com/register-waba/7f7fa318a6cb85531f317a9550d44024bee99ee1735f5cd97b31bd6912d8ad32edf98ae02c9a21cc489f4816d89a8631220a322a7131745e950e09d1da252ba330068e9c61fd01f1a8142034a60de231f047ce5a042c5432f3f16390b80e2a20db3f9edd3e471a43214e75f4d2a1613bd7dba353062d62dc4cc372c8946b1bce4b0de18e7424249b57beecf362b699d33c92030579fdbcd4b3c837f61c14ec374621cbd675bb3cbee5a18d6c7b861fde06799bb2da5e2084dc4c0ca49825a8ff476b55cb83ec702e4eeba9632a182f995c9404c11487bafa605e53c7660ed1045150ca63aa9de1c7faee86ac25816653c58584c29f3f728ba6fa7b53c835660c0ec83bb2ec1f267a36afd34ef97d6e5f30e51170b579252afa1e435153d9435ff2f7cab3446d48a80245ed5b826dc22b8ebff0bfb255c305aac308ef189c09ae8d38c9d29800a58f98cfb931f7e5312a0a2987b63437085f7d62c44294f4dcd08bbf1d54308421b1103d6c661b80ee933d214845f80ca2246e199c401078eb4695b9b73c22641af7951e05959b9ad0acfece85a2211b500afb4332a9de3e44915284d2a98ac078fe82b0929fa3cbb12d4052bbdb404e449e3d55de61a8a52c23af807917f157a0c392c72c1f5b7820d05bcd7fa5cbf3266cb7b915f42b7561401877b1a5b23c637d62a8cdbd3c4ad975",
                        "_blank"
                      )
                    }
                    disabled={isLoading}
                  >
                    <Link2 className="mr-2" size={16} />
                    {isLoading ? "Connecting..." : "Connect"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <WebhookConfiguration />
          </div>

          <div className="bg-white dark:bg-(--card-color) border border-gray-100 dark:border-(--card-border-color) rounded-xl overflow-hidden shadow-sm">
            <div className="flex [@media(max-width:395px)]:flex-col border-b border-gray-100 dark:border-(--card-border-color)">
              <button onClick={() => setActiveTab("manual")} className={cn("flex-1 py-4 text-sm font-bold transition-all border-b-2", activeTab === "manual" ? "text-primary border-primary bg-primary/5" : "text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-200")}>
                Manual Configuration
              </button>
              <button onClick={() => setActiveTab("qrcode")} className={cn("flex-1 py-4 text-sm font-bold transition-all border-b-2", activeTab === "qrcode" ? "text-primary border-primary bg-primary/5" : "text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-200")}>
                Connect via QR Code
              </button>
            </div>

            <div className="p-0 animate-in fade-in slide-in-from-bottom-2 duration-300">{activeTab === "manual" ? <ManualConnectionKeys isDisabled={!!isConnected} /> : <QRCodeConnection isDisabled={!!isConnected} />}</div>
          </div>
        </div>

        <div className="xl:col-span-4 lg:sticky lg:top-8 h-fit">
          <WabaSetupGuide isConnected={!!isConnected} />
        </div>
      </div>
    </div>
  );
};

export default ConnectWABA;
