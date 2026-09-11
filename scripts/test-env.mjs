/**
 * Test-time environment. Loaded before the test files (see the `test` script)
 * so that modules which validate their configuration at import time — `@/lib/env`
 * in particular — can be imported by a unit test without a database or a
 * `.env` file being present. Nothing here is a credential; the tests never
 * open a connection.
 */
process.env.NODE_ENV ||= "test";
process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";
process.env.NEXT_PUBLIC_SITE_URL ||= "https://para-cleopatre.tn";
