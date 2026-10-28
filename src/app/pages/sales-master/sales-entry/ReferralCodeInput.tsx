// src/app/pages/sales-master/sales-entry/ReferralCodeInput.tsx
import {
  CheckCircleIcon,
  LinkIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import { Badge, Button, Input } from "@/components/ui";
import { Get, toastsuccessmsg, toasterrormsg } from "@/ApiHelper";
import { ReferralLookupResult } from "./data";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onVerified: (data: any) => void;
}

export function ReferralCodeInput({ value, onChange, onVerified }: Props) {
  const [loading, setLoading] = useState(false);
  const [agentInfo, setAgentInfo] = useState<ReferralLookupResult | null>(null);

  const lookupCalledByEnter = useRef(false);
  const isVerifying = useRef(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (blurTimeout.current) clearTimeout(blurTimeout.current);
    };
  }, []);

  const lookupReferral = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setAgentInfo(null);
      onVerified(null);
      return;
    }
    setLoading(true);
    try {
      const r = (await Get(
        `pos/referral-lookup/?referral_code=${encodeURIComponent(trimmed)}`,
      )) as any;
      const data = r?.data ?? r;

      if (data.found) {
        setAgentInfo({
          found: true,
          agent_id: data.agent_id,
          full_name: data.full_name,
          contact_number: data.contact_number,
          agent_type: data.agent_type,
          referral_code: data.referral_code,
        });
        onVerified({
          agent_id: data.agent_id,
          full_name: data.full_name,
          agent_type: data.agent_type,
        });
        toastsuccessmsg(`✓ Agent found: ${data.full_name}`);
      } else {
        setAgentInfo({
          found: false,
          message: data.message || "Invalid referral code or mobile number",
        });
        onVerified(null);
        toasterrormsg(data.message || "Invalid referral code or mobile number");
      }
    } catch {
      setAgentInfo({ found: false, message: "Error validating code" });
      onVerified(null);
      toasterrormsg("Error validating referral code");
    } finally {
      setLoading(false);
      isVerifying.current = false;
    }
  };

  const handleBlur = () => {
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
    blurTimeout.current = setTimeout(() => {
      if (value && !lookupCalledByEnter.current && !isVerifying.current) {
        lookupReferral(value);
      }
      lookupCalledByEnter.current = false;
      blurTimeout.current = null;
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupCalledByEnter.current = true;
      lookupReferral(value);
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-300">
          <LinkIcon className="size-3" />
          Referral Code / Mobile
          <span className="font-normal text-gray-400 text-[10px]">(optional)</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
            <Input
              placeholder="Enter agent referral code or mobile number"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                if (!e.target.value) {
                  setAgentInfo(null);
                  onVerified(null);
                }
              }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="pl-9"
              classNames={{
                input: clsx(
                  agentInfo?.found && "border-success-400 focus:ring-success-400",
                  agentInfo?.found === false && "border-red-400 focus:ring-red-400",
                ),
              }}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
            {agentInfo?.found && !loading && (
              <CheckCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-success size-5" />
            )}
            {agentInfo?.found === false && !loading && value && (
              <XMarkIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 size-5" />
            )}
          </div>
          <Button
            onClick={() => {
              isVerifying.current = true;
              if (blurTimeout.current) {
                clearTimeout(blurTimeout.current);
                blurTimeout.current = null;
              }
              lookupReferral(value);
            }}
            disabled={!value}
            color="primary"
          >
            Verify
          </Button>
        </div>
      </div>

      {agentInfo?.found && (
        <div className="p-3 bg-success-50 border border-success-200 rounded-xl dark:bg-success-500/10 dark:border-success-500/30">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-success flex items-center justify-center text-white">
              <UserIcon className="size-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-success-700 dark:text-success-400">
                {agentInfo.full_name}
              </p>
              <div className="flex gap-3 text-xs text-success-600 dark:text-success-500">
                <span>{agentInfo.contact_number}</span>
                <span>{agentInfo.referral_code}</span>
                <Badge color="success" variant="soft" className="text-[10px]">
                  {agentInfo.agent_type === "pos"
                    ? "POS Agent"
                    : agentInfo.agent_type === "society"
                      ? "Society Agent"
                      : "Agent"}
                </Badge>
              </div>
            </div>
            <Badge color="success" variant="soft" className="text-xs font-bold">
              Verified
            </Badge>
          </div>
        </div>
      )}

      {agentInfo?.found === false && value && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <XMarkIcon className="size-3" />
          {agentInfo.message || "Invalid referral code or mobile number"}
        </p>
      )}
    </div>
  );
}