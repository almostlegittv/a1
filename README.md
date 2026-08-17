# AlmostLegitTV

This is a static React + Vite site for **AlmostLegitTV**. It is designed as a creator-led game-support hub rather than a store: supporters choose a game and complete the purchase, gifting, payment, code delivery, and redemption through Xbox/Microsoft’s own platform. AlmostLegitTV does not receive or store codes. Regular PayPal donations have a deliberately separate path.

## Local development

Use `pnpm dev` to run the site locally. Run `pnpm check` for TypeScript validation and `pnpm build` before deploying.

## Deploying to Vercel

Create a GitHub repository from this project, import it through Vercel, and keep the Vercel project root at the repository root. The included `vercel.json` sets the required build command (`pnpm build`), output directory (`dist/public`), and SPA rewrite rule. Vercel should detect the project as **Vite**.

The game and social URLs are declared at the top of `client/src/pages/Home.tsx`, so they can be updated in one place. Before launch, replace the temporary **Tip link coming soon** button with the actual preferred tip or donation URL. The game queue is currently public static content, designed so it can later be migrated into a CMS or creator-admin dashboard where received gifts and booked stream status are editable. The site should never instruct supporters to send Xbox codes through DMs or stream chat.

## Asset note

The homepage uses managed visual assets referenced in `client/src/pages/Home.tsx`. If exporting outside this managed project, host equivalent image files through your own image host or Vercel Blob and replace the four `ASSETS` URLs. The CSS includes dark visual fallbacks so the page remains legible while an asset is replaced.

## Vercel package note

This ZIP is prepared for Vercel and includes local copies of the visual assets under `client/public/assets`, so the site does not depend on Manus-managed storage URLs. Upload the extracted folder to a GitHub repository, import that repository into Vercel, and keep the project root at the repository root. Use the included `vercel.json` settings. Vercel will run `pnpm build` and serve `dist/public`.
