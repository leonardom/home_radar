This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Validation Source Of Truth (FE-6)

Frontend validation schemas are aligned to backend Zod contracts:

- Auth forms:
	- Frontend: `features/auth/auth-form.schemas.ts`
	- Backend source: `backend-api/src/modules/auth/register.schemas.ts`
	- Backend source: `backend-api/src/modules/auth/token.schemas.ts`
- Filters forms:
	- Frontend: `features/filters/filter-form.schemas.ts`
	- Backend source: `backend-api/src/modules/filters/filters.schemas.ts`

Parity rules currently mirrored:

- Email normalization and max length constraints.
- Password strength constraints (uppercase, lowercase, number, length).
- Numeric non-negative integer constraints for filter ranges.
- Cross-field range validation (`min <= max`).
- At-least-one-filter-criterion requirement for filter creation.
- At-least-one-field requirement for filter updates.

React Hook Form integration and server-validation mapping utilities:

- `lib/forms/validation.ts`
