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
import { ExternalLink, Link2, MessageCircle, Plug, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customLink, setCustomLink] = useState("");
  const [showCustomLinkInput, setShowCustomLinkInput] = useState(false);
  const [connection] = useConnectionMutation();
  const { selectedWorkspace } = useAppSelector((state: any) => state.workspace);
  const { user, token } = useAppSelector((state: any) => state.auth);
  const { data: workspacesData, refetch: refetchWorkspaces, isLoading: isLoadingWorkspaces } = useGetWorkspacesQuery(undefined, {
    pollingInterval: 10000, // Poll every 10 seconds
  });
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

  const handleRefreshStatus = async () => {
    try {
      setIsRefreshing(true);
      const { data: updatedWorkspaces } = await refetchWorkspaces();
      if (updatedWorkspaces?.data) {
        const currentWs = updatedWorkspaces.data.find((ws: any) => ws._id === selectedWorkspace?._id);
        if (currentWs) {
          dispatch(setWorkspace(currentWs));
          
          // Show status update toast
          if (currentWs.connection_status === 'connected') {
            toast.success('Connection is active', {
              description: 'Your WhatsApp Business account is connected and ready.'
            });
          } else if (currentWs.connection_status === 'connecting') {
            toast.info('Connection in progress', {
              description: 'Your WhatsApp Business account is being connected.'
            });
          } else if (currentWs.connection_status === 'disconnected') {
            toast.warning('Connection lost', {
              description: 'Your WhatsApp Business account has been disconnected.'
            });
          } else {
            toast.info('Status refreshed', {
              description: 'No active connection found.'
            });
          }
        }
      }
    } catch (error) {
      toast.error('Failed to refresh status', {
        description: 'Please try again later.'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const { startSignup, fbReady, isConfigured } = useEmbeddedSignup(handleFinish);

  const handleAisensyConnect = () => {
    console.log('🔍 Connect Debug:', { fbReady, isConfigured, hasFB: !!window.FB });
    
    // Primary: use Meta JS SDK popup (proper Embedded Signup flow)
    if (fbReady && isConfigured) {
      console.log('✅ Using Facebook SDK popup');
      startSignup();
      return;
    }

    // Fallback: use the pre-generated AiSensy Embedded Signup URL
    console.log('⚠️ Falling back to AiSensy URL');
    const embeddedSignupUrl = process.env.NEXT_PUBLIC_AISENSY_EMBEDDED_SIGNUP_URL;
    if (embeddedSignupUrl) {
      // Open as a popup window matching Meta's popup dimensions
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(
        embeddedSignupUrl,
        'AiSensy WhatsApp Signup',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );
      return;
    }

    toast.error('WhatsApp signup is not configured. Please contact your administrator.');
  };

  const handleCustomLinkConnect = () => {
    if (!customLink.trim()) {
      toast.error('Please enter a valid link');
      return;
    }
    
    if (!customLink.includes('waba.aisensy.com')) {
      toast.error('Please enter a valid AiSensy WABA link');
      return;
    }

    window.open(customLink, '_blank');
    toast.success('Opening AiSensy connection page');
  };

  return (
    <div className="p-4 sm:p-8 max-w-400 mx-auto space-y-6 sm:space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-(--light-border) rounded-lg bg-(--light-primary) dark:bg-(--card-color) dark:border-(--card-border-color)">
            <Plug className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Integrations</h1>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Connect your WhatsApp Business Account to start messaging.</p>
          </div>
        </div>
        {selectedWorkspace && (
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Active</span>
              </div>
            ) : currentStatus === "connecting" ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Connecting</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Not Connected</span>
              </div>
            )}
          </div>
        )}
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
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <Badge variant="success" className="px-2.5 py-1 gap-1.5 flex items-center bg-green-50 dark:bg-(--page-body-bg) dark:border-(--card-border-color) dark:hover:bg-(--table-hover) text-primary border-green-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Connected
                      </Badge>
                    ) : currentStatus === "connecting" ? (
                      <Badge variant="secondary" className="px-2.5 py-1 gap-1.5 flex items-center bg-yellow-50 dark:bg-(--dark-body) text-yellow-700 dark:text-yellow-400 border-yellow-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                        Connecting...
                      </Badge>
                    ) : currentStatus === "disconnected" ? (
                      <Badge variant="secondary" className="px-2.5 py-1 gap-1.5 flex items-center bg-red-50 dark:bg-(--dark-body) text-red-700 dark:text-red-400 border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Disconnected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="px-2.5 py-1 gap-1.5 dark:bg-(--dark-body) flex items-center">
                        Not Connected
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={handleRefreshStatus}
                      disabled={isRefreshing || isLoadingWorkspaces}
                      title="Refresh connection status"
                    >
                      <RefreshCw className={cn("h-4 w-4", (isRefreshing || isLoadingWorkspaces) && "animate-spin")} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-300">WhatsApp Business</h3>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 dark:text-gray-400">Connect with customers on their favorite messaging app. Send updates, support messages, and more directly...</p>
                  {latestWorkspace && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1 pt-2">
                      {currentWabaId && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">WABA ID:</span>
                          <code className="bg-gray-100 dark:bg-(--dark-sidebar) px-2 py-0.5 rounded text-xs">{currentWabaId}</code>
                        </div>
                      )}
                      {isBaileys && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Type:</span>
                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs">Baileys (QR Code)</span>
                        </div>
                      )}
                      {!isBaileys && currentWabaId && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Type:</span>
                          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded text-xs">Meta Business</span>
                        </div>
                      )}
                    </div>
                  )}
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
                  <Button className="w-full h-11 font-semibold shadow-lg dark:text-amber-50 shadow-primary/20" onClick={handleAisensyConnect} disabled={!!isConnected || isLoading}>
                    <Link2 className="mr-2" size={16} />
                    {isLoading ? "Connecting..." : isConnected ? "Connected" : "Connect"}
                  </Button>
                </div>

                {!isConnected && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-(--card-border-color)">
                    <button
                      onClick={() => setShowCustomLinkInput(!showCustomLinkInput)}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {showCustomLinkInput ? '− Hide' : '+ Use'} custom AiSensy link
                    </button>
                    
                    {showCustomLinkInput && (
                      <div className="mt-3 space-y-2">
                        <input
                          type="text"
                          value={customLink}
                          onChange={(e) => setCustomLink(e.target.value)}
                          placeholder="Paste AiSensy link from console..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-(--card-border-color) rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-(--dark-sidebar) dark:text-gray-300"
                        />
                        <Button
                          onClick={handleCustomLinkConnect}
                          disabled={!customLink.trim()}
                          className="w-full h-9 text-sm"
                          variant="outline"
                        >
                          Open Custom Link
                        </Button>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Generate a link from AiSensy console and paste it here
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
