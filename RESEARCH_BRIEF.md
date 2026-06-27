# Deep Research Brief: "Build-Your-Own Animated Card" App

This document is the **input context** for a Claude Code deep-research session.
It is not the research itself. It frames who the founder is, what the product
is, what is already proven, and the exact questions the research must answer.
Paste the "READY-TO-RUN PROMPT" section into a deep-research session, or run the
`deep-research` skill with it as args.

---

## 1. Founder context (who is asking and why)

A solo, non-traditional founder. Not starting from a market study, starting from
a thing he already built and loved making: a digital birthday card for his
girlfriend (turning 18). The card lives in this repo. It is the seed of the idea.

Key signal: **the card does not look AI-generated or templated.** It was
deliberately crafted to feel handmade, like a real letterpress card. This matters
because it tells us the founder's instinct is toward *taste and craft*, and the
likely wedge is "cards that feel personal and premium," not "cheapest ecard."

The founder wants to familiarize himself with the niche before committing:
who is already here, why they win, what they miss, and whether there is real,
durable demand for what he wants to build.

## 2. What already exists (the seed artifact in this repo)

A single `index.html` (no build step, no dependencies, ~920 lines) that renders:

- A **3D card** on cream cardstock that flips open on tap/click.
- A custom **canvas particle engine** (`burst()`): hearts, paper confetti,
  petals, gold foil, all hand-tuned via a `CONFIG` block.
- A custom **emoji-physics pile** (`dropEmojis()`): ~37 emoji that fall, collide,
  stack, and "sleep" when settled. Real physics, not a GIF.
- A taped **polaroid photo**, **handwritten note** (Caveat font), foil
  "Happy Birthday" headline, a pressable **wax seal**, a gold "18" medallion.
- **`prefers-reduced-motion`** support, retina-crisp canvas, ~60fps target.
- A planned **tap-to-open present** feature that reveals an outbound link
  (Google Drive photo/wallpaper) and is meant to be animated with **Higgsfield**
  (AI video) — i.e. the founder is already thinking about an effects/animation
  pipeline, not just static templates.
- Hosting via **GitHub Pages** (or Vercel); shared as a **link**.

Design philosophy already in play ("anti-slop / taste" rules): restrained warm
palette, one accent, real fonts, layered shadows, paper grain, zero em-dashes.
**This is the differentiator to pressure-test: craft over template-spam.**

## 3. The product idea (as proposed by the founder)

A consumer app to **build your own animated greeting cards** and share them.

- **Build-your-own + templates.** Start from scratch or a template.
- **Effect library.** Falling emojis, confetti, glow, etc. (The repo proves the
  founder can build these as real, performant effects.)
- **Share via QR or link.** No printing, no postage, no app install for the
  recipient (open in browser).
- **Pricing:** 3 free cards per year, then $1/card or a subscription.
- **Beachhead audiences:** frequent travelers, people far from home, and
  **long-distance couples**.
- **Roadmap / vision:** family Christmas cards; a personal **library of cards
  you have received**; eventually the default way most people give and receive
  cards, displacing paper ("ease of use, customization, less paper waste").

## 4. What the research must figure out

Organize the report around these themes. Each bullet is a real question, not a
keyword.

### A. The competitive landscape (who is in the space)
- **Identify "Rachel's virtual card" first.** The founder references a specific
  "Rachel's virtual card" as the comparison. Find out what it actually is: a
  viral template, a creator's product, a TikTok/Etsy trend, or a named app.
  Pin down what it does and why it spread.
- Map the players across these adjacent categories, with what each does, pricing,
  platform, and who they target:
  - **Modern digital/animated card apps:** Givingli, Cardsnacks, JibJab,
    Smilebox, Paperless Post, Punchbowl, Open Me, Ojolie, Vibly.
  - **Legacy ecards:** American Greetings / Blue Mountain, Hallmark eCards.
  - **Physical-card-from-phone:** Touchnote, Felt, Punkpost, Ink Cards, Postable,
    Moonpig, Funky Pigeon, Thortful, Greetabl, Shutterfly/Mixbook.
  - **Group / collaborative cards (adjacent, fast-growing):** Kudoboard,
    GroupGreeting, GroupTogether, illume, SendWishOnline, DiT.
  - **DIY design tools people already use for cards:** Canva, Adobe Express.
  - **Long-distance-couple products (the beachhead):** Lovebox (physical),
    Bond Touch, Between, Paired, Cupla, Lovewick, Cupttime-style apps.
- For the standouts: **why are they successful?** (Distribution, virality loop,
  pricing, occasion lock-in, gifting attach, brand, SEO, app-store presence.)
- **What are they missing / what do users complain about?** Mine app-store
  reviews, Reddit, TikTok comments, Trustpilot. Look for: templated/cheesy feel,
  paywalls at the worst moment, recipient friction (forced signup, app install),
  weak animation, no "received cards" archive, no real personalization.

### B. Is there real, durable demand?
- Size the **greeting card market** (US + global), the **digital/ecard** slice,
  and its growth rate. Note the secular decline of paper cards vs. digital.
- Quantify the **beachhead segments**: how many people are in long-distance
  relationships, are frequent travelers, or live far from family? Are these
  reachable, and do they spend on staying connected?
- Find evidence of **willingness to pay** for digital cards (do Givingli /
  Paperless Post / JibJab subscriptions retain? what are their reported users /
  revenue?). Is $1/card or a subscription realistic, or are users trained to
  expect free ecards? What is the right price metric (per-card vs. per-occasion
  vs. annual)?
- Assess **seasonality / occasion dependence** (Christmas, Valentine's,
  birthdays, Mother's/Father's Day) and what it means for retention and the
  "library of received cards" retention hook.

### C. The wedge and differentiation
- Is "**craft / non-templated / premium animation**" a defensible wedge, or do
  incumbents already cover it? Specifically test the founder's bet that current
  apps feel cheesy/templated and a taste-forward product can win.
- How much does the **Higgsfield / AI-generated effects** angle add? Is
  "AI-personalized animated effects" a real differentiator or a gimmick?
- Evaluate the **recipient-friction wedge** (open in browser via link/QR, no
  signup, no install). How do incumbents handle this and is frictionless sharing
  a real growth lever (the viral loop: every recipient is a prospect)?
- Evaluate the **"received cards library"** as a retention/network mechanic:
  does it create lock-in or a reason to return between occasions?

### D. Go-to-market and growth
- What is the **wedge occasion + audience** to launch with? (e.g.
  long-distance couples first, given the seed artifact, then expand to birthdays,
  then family Christmas cards.)
- What are the **viral / distribution loops** for this category and which actually
  work (recipient-to-sender conversion, social sharing, occasion reminders,
  group-card invites)? What did Givingli / Kudoboard do to grow?
- **Channels:** TikTok/Reels (card-reveal content is inherently shareable),
  Etsy/Gumroad for templates, app store vs. pure web, influencer/creator angle.
- **CAC vs. LTV** sanity check given a $1/card or low-priced subscription.

### E. Business model, unit economics, and moat
- Pressure-test **3 free / year then $1 per card or subscription**: gross margin
  (hosting, AI-video generation cost per card if Higgsfield-style effects are
  used), conversion from free to paid, churn for an occasion-driven product.
- What is the **moat** beyond taste? (Content/template library, creator
  marketplace, the received-cards network, occasion-reminder habit, brand.)
- Where does **gifting attach** fit (gift cards, small gifts, the Google-Drive /
  wallpaper "present" mechanic the founder already prototyped)? Givingli monetizes
  via gift cards — is that the real revenue, not the card?

### F. Risks, threats, and honest red flags
- **Platform risk:** Canva, Apple (Messages/iMessage apps), Google, Instagram,
  and Hallmark can all add "animated cards." How defensible is this?
- **Commoditization risk:** AI makes "generate me a card" trivial. Does that help
  (lower production cost) or hurt (zero differentiation)?
- **Demand-durability risk:** is this a "nice gesture once" product or a habit?
- The classic **greeting-card-app graveyard:** find apps that tried this and
  failed or stalled (e.g. Quikcard, Sincerely/Postagram, Justwink by AG, Ink) and
  extract *why* they failed.

## 5. Output the research should produce

A cited report with:
1. **Executive summary** + a clear verdict: is there a real, winnable wedge here,
   and if so, which audience/occasion to start with?
2. **Competitor matrix** (name, what it does, platform, pricing, target user,
   why it wins, what it misses).
3. **"Rachel's virtual card" identified** and explained.
4. **Market sizing + demand evidence** for the beachhead segments, with numbers
   and sources.
5. **Willingness-to-pay / pricing** analysis with comparables.
6. **A recommended wedge + GTM motion** (who to launch to, the viral loop, the
   first 3 features that matter).
7. **Top 5 risks** and how to de-risk each.
8. **Open questions / what to validate next** (cheap experiments the founder can
   run in weeks, e.g. a landing page, a TikTok of the existing card, a waitlist).

Bias toward **specific named companies, real numbers, and primary sources**
(app-store review counts and complaints, Crunchbase/funding, pricing pages,
Reddit/TikTok sentiment). Flag where data is thin and mark estimates as estimates.

---

## READY-TO-RUN PROMPT

> I'm a solo founder researching a consumer app idea before committing to it. The
> idea: a **build-your-own animated greeting card app** — start from scratch or a
> template, add effects from a library (falling emojis, confetti, glow, AI-generated
> animations), and share the finished card by **link or QR** so the recipient just
> opens it in a browser (no signup, no install). Pricing idea: **3 free cards per
> year, then $1 per card or a subscription.** Beachhead audiences: **frequent
> travelers, people far from home, and long-distance couples.** Roadmap: family
> Christmas cards, and a personal **library of cards you've received**, growing into
> the default way people give and receive cards (more personal, more customizable,
> less paper waste).
>
> This idea came from a real artifact: I hand-built a polished, **non-templated**
> animated birthday card for my girlfriend — a 3D card that flips open with a custom
> canvas particle engine (hearts, confetti, petals, foil), a real emoji-physics pile,
> a handwritten note and taped polaroid, reduced-motion support, shared as a link. It
> deliberately avoids the cheesy AI/template look. My instinct is that the wedge is
> **craft and taste**, plus **zero recipient friction**.
>
> Research the space thoroughly and give me a cited report. Specifically:
>
> 1. **Identify "Rachel's virtual card"** (a specific viral card/app I'm comparing to)
>    and explain what it is and why it spread.
> 2. **Map the competitive landscape** — modern animated-card apps (Givingli,
>    Cardsnacks, JibJab, Paperless Post, Punchbowl, Open Me, Smilebox), legacy ecards
>    (American Greetings/Blue Mountain, Hallmark), physical-card-from-phone (Touchnote,
>    Felt, Punkpost, Moonpig, Thortful), group cards (Kudoboard, GroupGreeting,
>    illume), DIY tools (Canva, Adobe Express), and long-distance-couple products
>    (Lovebox, Bond Touch, Paired, Between). For each: what it does, platform, pricing,
>    target user, **why it wins, and what it's missing** (mine app-store reviews,
>    Reddit, TikTok, Trustpilot for complaints).
> 3. **Is the demand real and durable?** Size the greeting-card and digital/ecard
>    market and its growth; quantify and assess the reachability of long-distance
>    couples, frequent travelers, and people far from family; find evidence of
>    **willingness to pay** for digital cards and whether $1/card or a subscription is
>    realistic; assess occasion seasonality and retention.
> 4. **Is my wedge defensible?** Pressure-test "premium, non-templated craft +
>    AI-generated effects + frictionless link/QR sharing + a library of received
>    cards." Do incumbents already cover this? Is the AI-effects angle a real
>    differentiator or a gimmick?
> 5. **GTM:** which audience/occasion to launch with, the viral/distribution loops
>    that actually work in this category (and what Givingli/Kudoboard did to grow),
>    and the best channels (TikTok card-reveal content, Etsy/templates, web vs. app).
> 6. **Business model & unit economics:** test 3-free-then-$1/card-or-subscription —
>    margins (including AI-video generation cost per card), free-to-paid conversion,
>    occasion-driven churn, and where gifting/gift-card attach fits (note Givingli
>    monetizes via gift cards).
> 7. **Top risks and red flags:** platform risk (Canva/Apple/Hallmark adding this),
>    AI commoditization, demand durability, and a short post-mortem of greeting-card
>    apps that failed and why.
>
> Deliver: an executive summary with a clear **verdict and recommended wedge**, a
> competitor matrix, market-size and willingness-to-pay numbers with sources, a
> recommended GTM motion, the top 5 risks with de-risking moves, and a list of cheap
> experiments I can run in the next few weeks to validate demand. Use specific named
> companies, real numbers, and primary sources; flag thin data and mark estimates.
