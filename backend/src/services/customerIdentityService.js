class CustomerIdentityError extends Error {
  constructor() {
    super('Registration could not be completed with these details.');
    this.status = 409;
  }
}

const lockCustomerIdentity = async (client, keys) => {
  for (const key of [...new Set(keys)].sort()) {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [key]);
  }
};

const findMappedClerkCustomer = async (client, subject) => {
  const result = await client.query(`
    SELECT c.id, c.full_name, c.email
    FROM customer_identities ci
    JOIN customers c ON c.id = ci.customer_id
    WHERE ci.provider = 'clerk'
      AND ci.provider_subject = $1
      AND c.is_registered = TRUE
  `, [subject]);
  return result.rows[0] || null;
};

const findClerkCustomer = (database, subject) => database.query(`
  SELECT c.id, c.full_name, c.email
  FROM customer_identities ci
  JOIN customers c ON c.id = ci.customer_id
  WHERE ci.provider = 'clerk'
    AND ci.provider_subject = $1
    AND c.is_registered = TRUE
`, [subject]).then(result => result.rows[0] || null);

const completeClerkCustomerProfile = (database, { subject, fullName, phoneNumber, kennitala, email }) => {
  const kennitalaDigits = kennitala.replace(/\D/g, '');
  const normalizedEmail = email.trim().toLowerCase();

  return database.withTransaction(async client => {
    await lockCustomerIdentity(client, [
      `clerk-subject:clerk:${subject}`,
      `customer-email:${normalizedEmail}`,
      `customer-kennitala:${kennitalaDigits}`,
    ]);

    const mappedCustomer = await findMappedClerkCustomer(client, subject);
    if (mappedCustomer) return mappedCustomer;

    const existing = await client.query(`
      SELECT id
      FROM customers
      WHERE lower(email) = $1
         OR regexp_replace(kennitala, '[^0-9]', '', 'g') = $2
      LIMIT 1
      FOR UPDATE
    `, [normalizedEmail, kennitalaDigits]);
    if (existing.rows.length > 0) throw new CustomerIdentityError();

    const inserted = await client.query(`
      INSERT INTO customers (
        full_name, phone_number, kennitala, email, is_registered, email_verified_at
      )
      VALUES ($1, $2, $3, $4, TRUE, CURRENT_TIMESTAMP)
      RETURNING id, full_name, email
    `, [fullName, phoneNumber, kennitala, normalizedEmail]);
    const customer = inserted.rows[0];

    await client.query(`
      INSERT INTO customer_identities (provider, provider_subject, customer_id)
      VALUES ('clerk', $1, $2)
    `, [subject, customer.id]);

    return customer;
  });
};

const registerCustomerProfile = (database, { fullName, phoneNumber, kennitala, email, passwordHash }) => {
  const kennitalaDigits = kennitala.replace(/\D/g, '');
  return database.withTransaction(async client => {
    await lockCustomerIdentity(client, [
      `customer-email:${email.trim().toLowerCase()}`,
      `customer-kennitala:${kennitalaDigits}`,
    ]);
    const existing = await client.query(`
      SELECT id
      FROM customers
      WHERE regexp_replace(kennitala, '[^0-9]', '', 'g') = $1
         OR lower(email) = lower($2)
      ORDER BY id ASC
      LIMIT 1
      FOR UPDATE
    `, [kennitalaDigits, email.trim()]);

    if (existing.rows.length > 0) throw new CustomerIdentityError();

    const result = await client.query(`
      INSERT INTO customers (full_name, phone_number, kennitala, email, password_hash, is_registered)
      VALUES ($1, $2, $3, $4, $5, TRUE)
      RETURNING id, full_name, email
    `, [fullName, phoneNumber, kennitala, email, passwordHash]);
    return result.rows[0];
  });
};

module.exports = {
  CustomerIdentityError,
  completeClerkCustomerProfile,
  findClerkCustomer,
  registerCustomerProfile,
};