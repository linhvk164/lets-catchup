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
          on your device (browser local storage) and in shareable invitation
          links:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Your name</li>
          <li>Your selected city or timezone</li>
          <li>Your availability</li>
          <li>Your personal message (if provided)</li>
          <li>Your selected postcard image</li>
          <li>Invitation identifiers used for sharing</li>
        </ul>
        <p>
          The app does not require an account. Invitation details are primarily
          kept in your browser and passed through the share link so friends can
          open the same postcard.
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
        <p>
          It uses browser local storage (and invitation data in the share URL)
          to:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Keep invitation details available on your device</li>
          <li>Remember whether you created or joined a postcard</li>
          <li>Support sharing invitations through a link</li>
        </ul>
        <p>
          Clearing your browser storage may remove locally saved invitations on
          that device.
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
          Standard server logs may temporarily record technical information such
          as IP address, browser version, and request timestamps for security
          and operational purposes.
        </p>
      </InfoSection>

      <InfoSection title="Data Sharing">
        <p>Personal information is not sold to third parties.</p>
        <p>
          Because invitations are stored locally and shared through links, your
          invitation content is mainly held on participants&apos; devices and in
          the URLs they share. Information is only otherwise processed by
          services required to operate the website, such as hosting providers.
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
