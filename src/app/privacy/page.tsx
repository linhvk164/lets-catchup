import type { Metadata } from "next";
import { ExternalLink } from "@/components/ExternalLink";
import { InfoPage, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Privacy Policy · Let's Catch Up",
  description:
    "How Let's Catch Up handles your information and what the app stores.",
};

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy Policy" updated="Last updated: August 6, 2026">
      <InfoSection title="Overview">
        <p>
          Let&apos;s Catch Up is a scheduling web application created by Linh
          Khuong. It helps people in different time zones find overlapping
          availability and share invitations through digital postcards.
        </p>
      </InfoSection>

      <InfoSection title="Information We Collect">
        <p>
          When you create or join an invitation, the app may store the following
          on our servers and on your device (browser local storage):
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Your name</li>
          <li>Your selected city or timezone</li>
          <li>Your availability</li>
          <li>Your personal message (if provided)</li>
          <li>Your selected postcard image reference</li>
          <li>Invitation identifiers used for sharing</li>
        </ul>
        <p>
          The app does not require an account. Invitation details are stored on
          the server under a short link so everyone with the link sees the same
          live invite. Your browser may also keep a local cache for faster
          loading and offline fallback.
        </p>
      </InfoSection>

      <InfoSection title="Server Storage and Retention">
        <p>
          Shared invitations are stored on a cloud database (currently Upstash
          Redis) keyed by invitation id. Each write refreshes a retention window
          of about 90 days. Invitations that are not updated may expire and be
          deleted after that period of inactivity.
        </p>
        <p>
          Custom photo uploads embedded as local data URLs are not uploaded to
          the server; only standard postcard image references and other invite
          fields are persisted remotely.
        </p>
      </InfoSection>

      <InfoSection title="Analytics">
        <p>
          Let&apos;s Catch Up does not currently collect product analytics such
          as pages visited, device type, or feature usage.
        </p>
        <p>
          If analytics are added in the future, this policy will be updated to
          describe what is collected and why. Analytics would be used only to
          improve the product and not for advertising.
        </p>
      </InfoSection>

      <InfoSection title="Cookies and Local Storage">
        <p>The app does not currently set cookies.</p>
        <p>It uses browser local storage to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Cache invitation details on your device</li>
          <li>Remember whether you created or joined a postcard</li>
          <li>Support opening invitations when the network is unavailable</li>
        </ul>
        <p>
          Clearing your browser storage may remove locally cached invitations on
          that device. The shared server copy remains until it expires or is
          updated.
        </p>
      </InfoSection>

      <InfoSection title="AI Usage">
        <p>
          This application was developed using AI-assisted programming tools
          during the design and development process.
        </p>
        <p>
          The application itself does{" "}
          <strong className="font-medium text-ink">not</strong> use AI to:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>interpret scheduling recommendations</li>
          <li>calculate overlapping availability</li>
          <li>perform timezone conversions</li>
        </ul>
        <p>
          These features use deterministic logic rather than large language
          models.
        </p>
        <p>
          User-written availability is processed using rule-based parsing
          designed specifically for scheduling.
        </p>
        <p>
          The featured photography, interface design, illustrations, product
          decisions, and written content are created by humans unless otherwise
          credited.
        </p>
      </InfoSection>

      <InfoSection title="Hosting">
        <p>
          Let&apos;s Catch Up is hosted using modern cloud infrastructure.
          Invitation data is stored with Upstash. Standard server logs may
          temporarily record technical information such as IP address, browser
          version, and request timestamps for security and operational purposes.
        </p>
      </InfoSection>

      <InfoSection title="Data Sharing">
        <p>Personal information is not sold to third parties.</p>
        <p>
          Anyone with your invitation link can view and update that invitation
          (for example by adding availability). Information is otherwise
          processed only by services required to operate the website, such as
          hosting and database providers.
        </p>
      </InfoSection>

      <InfoSection title="Contact">
        <p>
          If you have questions about this Privacy Policy or the application,
          you can contact:
        </p>
        <p className="text-ink">
          <ExternalLink
            href="https://linhvkhuong.com"
            className="font-medium text-ocean-deep"
          >
            Linh Khuong
          </ExternalLink>
          {/* Email can be added here later. */}
        </p>
      </InfoSection>
    </InfoPage>
  );
}
