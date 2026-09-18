# TypeScript launch decision

For the commercial-launch release, `strictNullChecks` remains disabled. Enabling it is a separate migration because it changes nullability assumptions across the entire application and cannot be reviewed safely as a local fix.

The release must not hide this with `@ts-expect-error`. Project-wide type checks may therefore retain TanStack Router's explicit `strictNullChecks` diagnostic until the post-launch migration is completed. All other TypeScript diagnostics remain actionable.
