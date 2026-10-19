import CustomerLayout from "../components/layout/CustomerLayout/CustomerLayout";
import "./LegalPages.css";

function PrivacyPolicyPage() {
  return (
    <CustomerLayout pageClassName="legal-page">
      <main className="legal-content">
        <p className="legal-eyebrow">gbb &amp; co · Customer information</p>
        <h1>Privacy policy</h1>
        <p className="legal-intro">
          This draft explains how customer information is used when you browse
          our studios or make an appointment with Gabbablu or Amor Tattoo.
          It is intended to be read with Icelandic data-protection law and the
          GDPR as applicable in Iceland.
        </p>
        <aside className="legal-notice" role="note">
          <strong>Provisional policy.</strong> Before this policy is treated as
          final, the business operating each brand must confirm and publish its
          registered legal name, contact details, service-provider list,
          international-transfer details and specific retention periods.
        </aside>

        <section>
          <h2>Who is responsible for your information?</h2>
          <p>
            The data controller is the legal business operating the studio you
            contact or book with. Its registered name, address and privacy
            contact have not been provided for this draft and must be completed
            by the business before publication. Contact the studio using the
            contact details shown when you book to make a privacy request.
          </p>
        </section>

        <section>
          <h2>Information we use</h2>
          <ul>
            <li>
              Contact and identity details such as your name, email address,
              phone number and Kennitala.
            </li>
            <li>
              Appointment information such as the selected studio, service,
              staff member, appointment time, price and booking or cancellation
              status.
            </li>
            <li>
              Account and session information if you register or sign in.
            </li>
            <li>
              Any health, allergy or skin-safety information you choose to
              provide for a tattoo or other service where it is relevant.
            </li>
            <li>
              Privacy consent and cancellation-policy acceptance associated
              with your booking.
            </li>
          </ul>
          <p>
            Please provide only information that is relevant to your
            appointment. The guest booking form requests a Kennitala; before
            using this service, the controller must confirm and document why
            it is necessary and lawful for secure identification and
            appointment administration.
          </p>
        </section>

        <section>
          <h2>Why we use it and the legal basis</h2>
          <ul>
            <li>
              To arrange and administer appointments, identify the customer,
              provide the selected service and communicate about the booking.
              The basis is generally taking steps at your request or performing
              the booking contract.
            </li>
            <li>
              To keep appointment, cancellation and no-show records and
              administer any applicable fee manually. A cancellation made
              fewer than 48 hours before the appointment, or a no-show, may
              result in a 5,000 ISK fee. Staff handle any fee manually and may
              waive it. The system does not automatically charge a bank account
              or issue an invoice.
            </li>
            <li>
              To meet legal obligations, where a specific obligation applies,
              and to protect the studio’s legitimate interests in operating
              and securing its booking service, where those interests do not
              override your rights.
            </li>
            <li>
              Where we rely on consent, you may withdraw it at any time.
              Withdrawal does not affect processing already carried out
              lawfully.
            </li>
          </ul>
          <p>
            Kennitala use must meet the additional requirements of Icelandic
            law. Health information can be special-category personal data under
            the GDPR and requires an applicable Article 9 condition as well as
            an Article 6 legal basis. The controller must confirm and document
            the lawful basis and any required explicit consent before relying
            on these data.
          </p>
        </section>

        <section>
          <h2>Cancellation and no-show policy</h2>
          <p>
            The 48-hour period is measured back from the appointment time. A
            client cancellation made less than 48 hours before the appointment
            or a missed appointment without notice may result in a 5,000 ISK
            fee. Staff handle any fee manually and may waive it. A guest who
            cannot cancel through an account must contact the studio. Where
            available, registered clients may use the cancellation function in
            their account.
          </p>
          <blockquote>
            Appointments cancelled less than 48 hours before the scheduled
            time, and appointments missed without notice, may result in a
            5,000 ISK fee. Any applicable fee is handled manually by Gabbablu
            staff.
          </blockquote>
          <p>
            Appointment records may note whether a cancellation was made by
            the client, staff or business, whether it was a no-show, and
            whether a fee was waived or handled manually. Staff may record a
            missed appointment as cancelled/no-show and decide whether to
            waive or manually handle any applicable fee.
          </p>
        </section>

        <section>
          <h2>Tattoo safety</h2>
          <p>
            Tattoos are permanent body modifications. Removal is costly,
            painful and rarely restores skin to its original state. Risks
            include allergic reactions to ink, localized bacterial infections,
            keloid scarring and bloodborne pathogen transmission if proper
            hygiene fails.
          </p>
          <p>
            We will not tattoo anyone who is under the influence of alcohol or
            drugs, or anyone with sunburn, open wounds, rashes or skin
            irritation in the target area. Tell your artist if you have
            diabetes, hemophilia, epilepsy, a compromised immune system, or
            take blood-thinning medication. Pregnant or nursing individuals
            should postpone getting tattooed. Seek medical care immediately
            for spreading redness, severe swelling, foul-smelling discharge,
            pus or a fever.
          </p>
        </section>

        <section>
          <h2>Who may receive the information?</h2>
          <p>
            Relevant booking information is available to authorized staff
            responsible for managing the appointment and providing the
            service. The booking system also relies on technical service
            providers to host and operate it. The controller must identify
            those providers, describe their roles and confirm where data is
            stored or accessed, including any transfers outside the EEA, before
            this policy is finalized.
          </p>
        </section>

        <section>
          <h2>How long we keep it</h2>
          <p>
            Information should be kept only for as long as needed for the
            purposes above and any applicable legal obligations. The specific
            retention periods for customer accounts, appointment records,
            Kennitala and health information have not been supplied for this
            draft and must be set by the controller. Information should then
            be securely deleted or anonymized.
          </p>
        </section>

        <section>
          <h2>Your rights</h2>
          <p>
            Subject to the conditions and exceptions in applicable law, you
            may request access to, correction of, deletion of or restriction
            of your personal information; object to certain processing; request
            a portable copy where the right applies; and withdraw consent where
            processing is based on consent. You may also complain to the
            Icelandic Data Protection Authority,{" "}
            <a href="https://www.personuvernd.is/" target="_blank" rel="noreferrer">
              Persónuvernd
            </a>
            . Contact the controller using the studio contact details provided
            at booking to exercise these rights.
          </p>
        </section>

        <section>
          <h2>Changes to this policy</h2>
          <p>
            We will update this page when our processing changes. The controller
            should add the effective date and make any material changes clear
            to customers.
          </p>
        </section>
      </main>
    </CustomerLayout>
  );
}

export default PrivacyPolicyPage;
