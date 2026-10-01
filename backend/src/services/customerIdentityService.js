class CustomerIdentityError extends Error {
  constructor() {
    super('Registration could not be completed with these details.');
    this.status = 409;
  }
}

const registerCustomerProfile = (database, { fullName, phoneNumber, kennitala, email, passwordHash }) => {
  const kennitalaDigits = kennitala.replace(/\D/g, '');
  return database.withTransaction(async client => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [kennitalaDigits]);
    const existing = await client.query(`
      SELECT id
      FROM customers
      WHERE regexp_replace(kennitala, '[^0-9]', '', 'g') = $1
      ORDER BY id ASC
      LIMIT 1
      FOR UPDATE
    `, [kennitalaDigits]);

    if (existing.rows.length > 0) throw new CustomerIdentityError();

    const result = await client.query(`
      INSERT INTO customers (full_name, phone_number, kennitala, email, password_hash, is_registered)
      VALUES ($1, $2, $3, $4, $5, TRUE)
      RETURNING id, full_name, email
    `, [fullName, phoneNumber, kennitala, email, passwordHash]);
    return result.rows[0];
  });
};

module.exports = { CustomerIdentityError, registerCustomerProfile };