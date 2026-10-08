import { LegalPage, Section } from "@/components/legal/LegalPage";

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="October 1, 2026">
      <p>
        These terms govern your use of Flyby AI. By using the service you agree to them. If
        you are using Flyby on behalf of a company, you confirm you are authorized to
        accept these terms for that company.
      </p>

      <Section heading="What Flyby does">
        <p>
          Flyby plans, books and manages business travel. It can connect to your calendar
          to identify trips, select flights and hotels within your company's travel policy,
          rebook when plans change, and capture trip expenses from a linked card.
        </p>
      </Section>

      <Section heading="Bookings are with the travel provider, not with us">
        <p>
          When you book through Flyby, the resulting contract of carriage or accommodation
          is between you (or your company) and the airline, hotel or transport operator.
          Flyby acts as the booking interface. Their fare rules, change and cancellation
          policies, and conditions of carriage apply to your reservation, and we cannot
          override them.
        </p>
        <p>
          We take care to show accurate prices and availability, but fares and inventory
          change constantly and are only confirmed at the moment of booking.
        </p>
      </Section>

      <Section heading="Automatic booking">
        <p>
          If you enable automatic booking, Flyby selects flights and hotels on your behalf
          using your saved preferences and your company's travel policy. You remain
          responsible for reviewing what is booked. Bookings can be reversed in the app,
          subject to the travel provider's own cancellation rules — some fares are
          non-refundable, and that is determined by the provider, not by us.
        </p>
      </Section>

      <Section heading="Payment">
        <p>
          Travel is paid for using the payment method you provide, processed by our
          PCI-compliant payment provider. You are responsible for charges incurred through
          your account, including provider change and cancellation fees.
        </p>
      </Section>

      <Section heading="Your account">
        <p>
          Keep your credentials secure and tell us promptly if you believe your account has
          been accessed without authorization. You are responsible for activity under your
          account. Information you give us for a booking — traveler names, dates of birth,
          document details — must be accurate; airlines reject or charge to correct
          mismatched passenger details.
        </p>
      </Section>

      <Section heading="Acceptable use">
        <p>
          Do not use Flyby to break the law, to make fraudulent or speculative bookings, to
          interfere with the service or probe its security, or to access another company's
          data. We may suspend accounts that do.
        </p>
      </Section>

      <Section heading="Connected accounts">
        <p>
          Connecting a calendar or card is optional and can be revoked at any time in
          Settings. Access is limited to what each feature needs, and is described in our
          Privacy Policy.
        </p>
      </Section>

      <Section heading="Availability">
        <p>
          We aim to keep Flyby available and accurate, but the service depends on
          third-party airline, hotel, calendar and banking systems that can be unavailable
          or return incomplete results. The service is provided "as is" without warranties
          of any kind.
        </p>
      </Section>

      <Section heading="Limitation of liability">
        <p>
          To the fullest extent permitted by law, Flyby is not liable for indirect,
          incidental or consequential damages, or for losses arising from a travel
          provider's acts or omissions — including delays, cancellations, schedule changes
          or denied boarding. Our total liability for any claim is limited to the amount
          you paid Flyby for the service in the three months before the claim.
        </p>
      </Section>

      <Section heading="Intellectual property">
        <p>
          Flyby and its software are our property and are protected by copyright and other
          laws. These terms grant no right to copy, modify, reverse engineer or
          redistribute the service.
        </p>
      </Section>

      <Section heading="Termination">
        <p>
          You may stop using Flyby at any time. We may suspend or terminate access for
          breach of these terms. Bookings already made remain governed by the travel
          provider's terms.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          We may update these terms as the product develops, and will revise the date
          above. Continued use after a change means you accept the updated terms.
        </p>
      </Section>

      <Section heading="Contact">
        <p>Questions about these terms: reach us through the contact details on our website.</p>
      </Section>
    </LegalPage>
  );
}
