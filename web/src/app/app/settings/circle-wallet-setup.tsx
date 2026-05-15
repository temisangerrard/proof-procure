"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, KeyRound, Mail, ShieldCheck, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type W3SSdkType = {
  getDeviceId: () => Promise<string>;
  updateConfigs: (configs?: unknown, onLoginComplete?: (error: unknown, result: unknown) => void) => void;
  verifyOtp: () => void;
  execute: (challengeId: string, onCompleted?: (error: unknown, result: unknown) => void) => void;
};

interface LoginResult {
  userToken: string;
  encryptionKey: string;
}

interface OtpTokens {
  deviceToken: string;
  deviceEncryptionKey?: string;
  otpToken: string;
}

interface CircleResponse {
  error?: string;
  challengeId?: string;
  deviceToken?: string;
  deviceEncryptionKey?: string;
  otpToken?: string;
  wallets?: Array<{
    id: string;
    address: string;
  }>;
}

interface CircleWalletSetupProps {
  email?: string;
}

export function CircleWalletSetup({ email = "" }: CircleWalletSetupProps) {
  const sdkRef = useRef<W3SSdkType | null>(null);
  const [appId, setAppId] = useState("");
  const [configured, setConfigured] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [walletEmail, setWalletEmail] = useState(email);
  const [otpTokens, setOtpTokens] = useState<OtpTokens | null>(null);
  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);
  const [challengeId, setChallengeId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [status, setStatus] = useState("Set up your payment account.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function boot() {
      const configResponse = await fetch("/api/wallet/circle/config");
      const config = await configResponse.json() as { appId?: string; configured?: boolean };
      setAppId(config.appId || "");
      setConfigured(Boolean(config.configured && config.appId));

      const storedUserToken = window.localStorage.getItem("circleUserToken");
      const storedEncryptionKey = window.localStorage.getItem("circleEncryptionKey");
      if (storedUserToken && storedEncryptionKey) {
        setLoginResult({ userToken: storedUserToken, encryptionKey: storedEncryptionKey });
      }

      if (!config.appId) return;

      const { W3SSdk } = await import("@circle-fin/w3s-pw-web-sdk");
      const onLoginComplete = (error: unknown, result: unknown) => {
        if (error) {
          setStatus("Code failed. Try again.");
          return;
        }

        const login = result as LoginResult;
        setLoginResult(login);
        window.localStorage.setItem("circleUserToken", login.userToken);
        window.localStorage.setItem("circleEncryptionKey", login.encryptionKey);
        setStatus("Email confirmed. Create wallet next.");
      };

      const sdk = new W3SSdk({ appSettings: { appId: config.appId } }, onLoginComplete) as W3SSdkType;
      sdkRef.current = sdk;

      const storedDeviceId = window.localStorage.getItem("circleDeviceId");
      const id = storedDeviceId || await sdk.getDeviceId();
      window.localStorage.setItem("circleDeviceId", id);
      setDeviceId(id);
    }

    void boot();
  }, []);

  async function requestOtp() {
    if (!deviceId || !walletEmail) return;
    setBusy(true);
    setStatus("Sending code...");

    const response = await fetch("/api/wallet/circle/request-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId, email: walletEmail }),
    });
    const data = await response.json() as CircleResponse;

    if (!response.ok) {
      setStatus(data.error || "Could not send code.");
      setBusy(false);
      return;
    }

    if (!data.deviceToken || !data.otpToken) {
      setStatus("Code could not be started.");
      setBusy(false);
      return;
    }

    setOtpTokens({
      deviceToken: data.deviceToken,
      deviceEncryptionKey: data.deviceEncryptionKey,
      otpToken: data.otpToken,
    });
    sdkRef.current?.updateConfigs({
      appSettings: { appId },
      loginConfigs: {
        deviceToken: data.deviceToken,
        deviceEncryptionKey: data.deviceEncryptionKey,
        otpToken: data.otpToken,
      },
    });
    setStatus("Code sent. Open the code screen.");
    setBusy(false);
  }

  function verifyOtp() {
    if (!otpTokens) return;
    sdkRef.current?.verifyOtp();
  }

  async function initializeWallet() {
    if (!loginResult?.userToken) return;
    setBusy(true);
    setStatus("Preparing wallet...");

    const response = await fetch("/api/wallet/circle/initialize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userToken: loginResult.userToken }),
    });
    const data = await response.json() as CircleResponse;

    if (!response.ok) {
      setStatus(data.error || "Could not prepare wallet.");
      setBusy(false);
      return;
    }

    if (data.wallets?.[0]) {
      setWalletAddress(data.wallets[0].address);
      setStatus("Wallet ready.");
      setBusy(false);
      return;
    }

    setChallengeId(data.challengeId || "");
    setStatus("Approve wallet creation.");
    setBusy(false);
  }

  async function createWallet() {
    if (!challengeId || !sdkRef.current) return;
    setBusy(true);
    sdkRef.current.execute(challengeId, async (error) => {
      if (error) {
        setStatus("Wallet approval failed.");
        setBusy(false);
        return;
      }
      await loadWallet();
      setBusy(false);
    });
  }

  async function loadWallet() {
    if (!loginResult?.userToken) return;
    setStatus("Loading wallet...");
    const response = await fetch("/api/wallet/circle/wallets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userToken: loginResult.userToken }),
    });
    const data = await response.json() as CircleResponse;

    if (!response.ok) {
      setStatus(data.error || "Could not load wallet.");
      return;
    }

    const wallet = data.wallets?.[0];
    setWalletAddress(wallet?.address || "");
    setStatus(wallet ? "Wallet ready." : "No wallet found.");
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold">Payment account</h2>
        <p className="mt-1 text-sm text-slate-500">Set up the account that sends supplier payments.</p>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {!configured && (
            <div className="rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-900 ring-1 ring-amber-200">
              Circle app key is missing. Add it before live wallet setup.
            </div>
          )}

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <Input
              className="h-12 rounded-xl px-4"
              value={walletEmail}
              onChange={(event) => setWalletEmail(event.target.value)}
              placeholder="you@business.com"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <ActionButton icon={Mail} label="Send code" onClick={requestOtp} disabled={!configured || busy || !deviceId || !walletEmail} />
            <ActionButton icon={KeyRound} label="Enter code" onClick={verifyOtp} disabled={!otpTokens || busy} />
            <ActionButton icon={ShieldCheck} label="Create wallet" onClick={initializeWallet} disabled={!loginResult || busy} />
            <ActionButton icon={WalletCards} label="Approve" onClick={createWallet} disabled={!challengeId || busy} />
          </div>

          {loginResult && (
            <Button variant="outline" className="h-11" onClick={loadWallet} disabled={busy}>
              Refresh wallet
            </Button>
          )}
        </div>

        <div className="rounded-2xl bg-slate-950 p-4 text-white">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
            <CheckCircle2 className="size-5" />
          </div>
          <p className="mt-4 text-sm font-semibold text-emerald-300">Status</p>
          <p className="mt-1 text-lg font-semibold">{status}</p>
          {walletAddress && (
            <p className="mt-4 break-all rounded-xl bg-white/10 p-3 text-xs text-slate-300">
              {walletAddress}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Mail;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button className="h-12 justify-start gap-2" variant="outline" onClick={onClick} disabled={disabled}>
      <Icon className="size-4" />
      {label}
    </Button>
  );
}
