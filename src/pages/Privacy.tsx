import { LegalPage, Section } from "@/components/legal/LegalPage";

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="October 1, 2026">
      <p>
        Flyby AI ("Flyby", "we", "us") helps companies plan, book and expense business
        travel. This policy explains what we collect, why we collect it, and the
        control you have over it. We only collect what the product needs to work.
      </p>

      <Section heading="Information we collect">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-foreground">Account information.</strong> Your name,
            email address and company, so we can identify you and your workspace.
          </li>
          <li>
            <strong className="text-foreground">Calendar data.</strong> If you connect
            Google Calendar or Microsoft Outlook, we read upcoming events — title, dates,
            location and attendees — to detect meetings that require travel, and to keep a
            booked trip in step when a meeting moves. We can also add trips you book to
            your calendar.
          </li>
          <li>
            <strong className="text-foreground">Trip and booking data.</strong> Flights
            and hotels you search for or book, plus traveler details
            required by airlines to issue a ticket.
          </li>
          <li>
            <strong className="text-foreground">Card transactions.</strong> If you link a
            card through our banking provider, we receive transaction records — merchant,
            amount, date and category — to file trip expenses automatically.
          </li>
          <li>
            <strong className="text-foreground">Usage data.</strong> Basic logs needed to
            operate the service securely and diagnose faults.
          </li>
        </ul>
      </Section>

      <Section heading="What we never collect">
        <p>
          We do not collect or store your card number, CVV, bank password, or your Google
          or Microsoft password. Card entry for bookings is handled by our PCI-compliant
          payment provider, and bank authentication happens inside our banking provider's
          own interface. We receive only revocable access tokens.
        </p>
      </Section>

      <Section heading="How we use your information">
        <p>
          To plan and book travel within your company's policy, to keep bookings accurate
          when plans change, to capture and report expenses, and to operate and secure the
          service. We also use an AI model to interpret travel requests written in plain
          language and to explain why a particular flight or hotel was recommended.
        </p>
        <p>
          <strong className="text-foreground">
            We do not sell your personal information, and we do not use it for advertising.
          </strong>
        </p>
      </Section>

      <Section heading="Google user data">
        <p>
          Flyby's use and transfer of information received from Google APIs adheres to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank" rel="noreferrer"
            className="text-primary hover:underline"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
        <p>
          We request only the narrowest calendar scopes the product needs: read access to
          your events, the ability to manage events Flyby itself creates, and your email
          address so you can see which account is connected. Google calendar data is used
          solely to provide the travel features described above. It is never sold,
          transferred to third parties for advertising, or used to train generalized AI
          models, and it is not read by humans except where you explicitly ask us to, where
          required for security or to comply with law.
        </p>
      </Section>

      <Section heading="Sharing">
        <p>We share information only where it is needed to deliver the service:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-foreground">Travel providers</strong> — traveler
            details are passed to airlines and hotels through our booking provider in order
            to issue a reservation.
          </li>
          <li>
            <strong className="text-foreground">Your company</strong> — trips and expenses
            are visible to administrators of your workspace, as expected for business
            travel.
          </li>
          <li>
            <strong className="text-foreground">Service providers</strong> — calendar,
            banking, payment, hosting and AI providers that process data on our behalf
            under contract.
          </li>
          <li>
            <strong className="text-foreground">Legal</strong> — where we are required to
            by law.
          </li>
        </ul>
      </Section>

      <Section heading="Retention and deletion">
        <p>
          We keep information for as long as your account is active or as needed to provide
          the service, and longer only where a record of a booking or expense must be
          retained for legal or accounting reasons. You can disconnect a calendar or a card
          at any time in Settings, which revokes our access immediately. You may request
          deletion of your account and associated data by contacting us.
        </p>
      </Section>

      <Section heading="Security">
        <p>
          Connections are encrypted in transit. Access tokens are stored server-side,
          access to production systems is restricted, and sensitive actions are logged. No
          system is perfectly secure, but we take protecting this data seriously.
        </p>
      </Section>

      <Section heading="Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, export or
          delete your personal information, and to withdraw consent for a connected
          account. Contact us and we will act on your request.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          We will update this policy as the product changes, and will revise the date at
          the top. Material changes will be communicated in the app.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about this policy or your data: reach us through the contact details
          listed on our website.
        </p>
      </Section>
    </LegalPage>
  );
}
