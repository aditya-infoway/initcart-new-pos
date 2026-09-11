import { useNavigate } from "react-router";
import {
  ClockIcon,
  ArrowLeftIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import { Page } from "@/components/shared/Page";
import { Button } from "@/components/ui";
import { useThemeContext } from "@/app/contexts/theme/context";

// ----------------------------------------------------------------------

export default function ComingSoon() {
  const navigate = useNavigate();
  const { primaryColorScheme: primary } = useThemeContext();

  return (
    <Page title="Coming Soon">
      <main className="min-h-[calc(100vh-4rem)] w-full grid place-items-center">
        <div className="w-full max-w-lg p-6 text-center">

          {/* Illustration */}
          <div className="mx-auto mb-6 flex size-28 items-center justify-center rounded-full"
            style={{ backgroundColor: `${primary[500]}15` }}>
            <div className="flex size-20 items-center justify-center rounded-full"
              style={{ backgroundColor: `${primary[500]}25` }}>
              <WrenchScrewdriverIcon
                className="size-10"
                style={{ color: primary[600] }}
              />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4"
            style={{ backgroundColor: `${primary[500]}15`, color: primary[600] }}>
            <ClockIcon className="size-3.5" />
            Under Development
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-dark-50">
            Coming Soon
          </h1>

          {/* Subtitle */}
          <p className="mt-3 text-gray-500 dark:text-dark-300 leading-relaxed">
            This page is currently under development.<br />
            We're working hard to bring it to you soon.
          </p>

          {/* Progress bar */}
          <div className="mt-8 mx-auto max-w-xs">
            <div className="flex justify-between text-xs text-gray-400 dark:text-dark-400 mb-1.5">
              <span>In progress</span>
              <span>Coming soon…</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-dark-600">
              <div
                className="h-full rounded-full animate-pulse"
                style={{ width: "45%", backgroundColor: primary[500] }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outlined"
              className="gap-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeftIcon className="size-4" /> Go Back
            </Button>
            <Button
              color="primary"
              className="gap-2"
              onClick={() => navigate("/dashboards/home")}
            >
              Go to Dashboard
            </Button>
          </div>

        </div>
      </main>
    </Page>
  );
}
