import type { Metadata } from "next";
import { ExternalLink } from "@/components/ExternalLink";
import { InfoPage, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "About · Let's Catch Up",
  description:
    "Why Let's Catch Up exists — personal postcard invites for friends across time zones.",
};

export default function AboutPage() {
  return (
    <InfoPage title="About Let's Catch Up">
      <InfoSection title="What is Let's Catch Up?">
        <p>
          Let&apos;s Catch Up began with a simple problem.
        </p>
        <p>
          My friends and I live in different cities and countries, and finding a
          time that works for everyone often turns into a long chain of
          messages, screenshots, and timezone conversions. I wanted a simpler,
          more thoughtful way to plan a catch-up.
        </p>
        <p>
          Instead of sending another scheduling link, Let&apos;s Catch Up turns
          the invitation into a postcard. Friends add their availability in
          their own timezone, and the app finds overlapping times that work for
          everyone.
        </p>
      </InfoSection>

      <InfoSection title="Let's Catch Up's use of AI">
        <p>
          This project was built with the help of AI-assisted development tools.
          They helped speed up implementation, prototyping, and coding so I
          could focus on product thinking, interaction design, and the overall
          experience.
        </p>
        <p>
          However, the app itself{" "}
          <strong>does not rely on AI to schedule meetings</strong>.
        </p>
        <p>
          Availability parsing, timezone conversion, and recommendation logic
          are calculated based on the availability that participants provide. We
          don&apos;t send scheduling requests to any large language model.
        </p>
      </InfoSection>

      <InfoSection title="Photography">
        <p>
          Featured postcard photography is provided by{" "}
          <ExternalLink
            href="https://www.linkedin.com/in/connie-kang-59441320b/"
            className="font-medium text-ocean-deep"
          >
            Connie Kang
          </ExternalLink>
          . Users may also upload their own images when creating a postcard.
        </p>
        {/* Credits can be expanded here as photography partners grow. */}
      </InfoSection>

      <InfoSection title="About the Creator">
        <p>
          I&apos;m Linh Khuong, a product designer passionate about creating
          digital experiences inspired by real-world objects and interactions.
          Let&apos;s Catch Up is an exploration of how thoughtful design can
          make staying connected feel more personal.
        </p>
        <p>
          You can learn more about my work at{" "}
          <ExternalLink
            href="https://linhvkhuong.com"
            className="font-medium text-ocean-deep"
          >
            linhvkhuong.com
          </ExternalLink>
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}
