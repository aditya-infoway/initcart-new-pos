import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeftIcon, CheckCircleIcon, MegaphoneIcon, PlusIcon,
} from "@heroicons/react/24/outline";

import { Page } from "@/components/shared/Page";
import { Badge, Button, Card, Input, Textarea } from "@/components/ui";
import { DatePicker } from "@/components/shared/form/DatePicker";

export default function SchemeOfferCreatePage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  return (
    <Page title="Create Scheme Offer">
      <div className="transition-content w-full pb-8 space-y-4">
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <Button variant="outlined" className="h-8 gap-2 rounded-md px-3 text-sm" onClick={() => navigate("/b2b-inventory/scheme-offer")}>
              <ArrowLeftIcon className="size-4" /> Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-dark-100">Create Scheme / Offer</h1>
              <p className="text-xs text-gray-500 dark:text-dark-400">Placeholder — module coming soon</p>
            </div>
          </div>
          <Button color="primary" className="h-9 gap-2 rounded-md px-4 text-sm" disabled>
            <CheckCircleIcon className="size-4" /> Publish
          </Button>
        </div>

        <div className="px-(--margin-x)">
          <Card skin="bordered" className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400">
              <MegaphoneIcon className="size-4" /> Scheme Details
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Input label="Scheme Name" placeholder="e.g. Diwali Bumper Offer" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <DatePicker label="Start Date" value={startDate} onChange={(v: any) => setStartDate(v || today)} />
              <DatePicker label="End Date" value={endDate} onChange={(v: any) => setEndDate(v || today)} />
              <div>
                <Input label="Scheme Code" placeholder="e.g. SCH-001" disabled />
              </div>
              <div className="lg:col-span-4">
                <Textarea label="Description" rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Scheme terms & conditions…" />
              </div>
            </div>
          </Card>
        </div>

        <div className="px-(--margin-x)">
          <Card skin="bordered" className="overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-dark-600 bg-gray-50 dark:bg-dark-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MegaphoneIcon className="text-primary size-4" />
                <span className="font-semibold text-gray-700 dark:text-dark-200 text-sm">Eligible Items / Rules</span>
              </div>
              <Button color="primary" variant="soft" className="h-7 gap-1 px-2 text-xs" disabled>
                <PlusIcon className="size-3" /> Add Rule
              </Button>
            </div>
            <div className="py-20 text-center">
              <Badge color="neutral" variant="soft" className="text-xs">Placeholder rules table coming soon</Badge>
              <p className="mt-3 text-sm text-gray-400 dark:text-dark-400">This module is not yet connected to data.</p>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
