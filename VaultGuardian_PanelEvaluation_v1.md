# The Vault Guardian: Synthetic Panel Evaluation
**Version:** 1.0
**Date:** 2026-03-17
**Evaluators:** 9-persona synthetic panel across 3 lenses
**Game:** The Vault Guardian — browser-based arcade shooter, cybersecurity awareness tool for tradeshow kiosks

---

## Game Overview

A browser-based arcade shooter designed as an interactive cybersecurity awareness tool. Players defend a central vault against waves of cyber threats across 5 waves (150 seconds total). Each of 5 weapons represents a real-world security control:

- Strong Passwords (base defence)
- SSO (Single Sign-On)
- MFA (Multi-Factor Authentication)
- Password Managers (eliminates password reuse)
- IT Dashboards (visibility and monitoring)

**Target context:** Tradeshow kiosks, event booths, general audiences without technical prerequisites.

---

## Evaluation Panel

| # | Name | Role | Industry | Lens |
|---|---|---|---|---|
| 1 | Jamie Park | Senior UX Designer | SaaS Products | UX and Game Design |
| 2 | Cody Brennan | Indie Game Developer | Freelance | UX and Game Design |
| 3 | Tara Sullivan | Events and Tradeshow Manager | Enterprise Tech | UX and Game Design |
| 4 | Brendan Walsh | Enterprise IAM Specialist | Financial Services | Cybersecurity and Product |
| 5 | Nina Okafor | SaaS Security and Shadow IT Analyst | Technology | Cybersecurity and Product |
| 6 | Dr. Sarah Kim | CISO and Security Awareness Lead | Financial Services | Cybersecurity and Product |
| 7 | Mark Henderson | CFO | Professional Services | Target Audience |
| 8 | Lisa Tran | IT Manager | Retail | Target Audience |
| 9 | Ryan Castillo | B2B Marketing Manager | Enterprise Tech | Target Audience |

---

## Lens 1: UX and Game Design

### Jamie Park — Senior UX Designer
**Score: 7/10**

**Praise:** Dual input support (mouse/touch plus WASD) is the right call for a kiosk context where you cannot predict the setup. The 20-second idle reset shows genuine awareness of the environment — most game developers would not think to include it.

**Top objection:** There is no onboarding moment. A first-time player at a tradeshow booth — likely not a gamer — is dropped into combat with no guided prompt. The HUD carries four concurrent elements (weapon, time, health, score) which is manageable for a gamer and potentially disorienting for a CFO who picked it up on a dare. A single 5-second "here is what to do" overlay before wave 1 would solve this without disrupting the pace.

**Additional notes:**
- The weapon icon-to-concept mapping is the highest UX risk in the game. Does a person who does not know what SSO is understand what the SSO weapon does from its icon alone? If the visual language does not carry the concept, the educational value collapses for the exact audience the game is targeting
- "Zero-Knowledge Master" is a fun score tier label but "zero-knowledge" is a technical cryptography term. A non-technical player may read it as an insult rather than a badge. Worth reviewing all tier names for unintended meaning

**Likelihood to recommend:** High, with onboarding fix.

---

### Cody Brennan — Indie Game Developer
**Score: 6/10**

**Praise:** The wave structure with escalating HP and damage is solid foundational design. Using damage multipliers to differentiate weapons gives the player a clear reason to chase power-ups rather than ignoring them.

**Top objection:** The weapons feel like stat boosts, not mechanical upgrades. A 5x multiplier on IT Dashboards versus a 2x on Strong Passwords creates a numbers difference — but does the IT Dashboard feel different to fire? Does SSO behave differently from MFA in the player's hand? If the answer is no, the weapons are labels on the same action, and the educational metaphor breaks down. A player should experience why MFA is stronger than a password alone, not just see a higher number.

**Additional notes:**
- 150 seconds across 5 waves is 30 seconds per wave. If power-ups spawn infrequently, a player may complete the whole game having used only 1-2 weapons — missing most of the educational content
- Only two named enemy types across five waves is thin. Enemy variety is where pacing lives in a wave shooter. By wave 4, a player who has seen the same enemies since wave 1 is no longer engaged
- No information on hit feedback, death animations, or wave-transition moments — these are where game feel is made or lost

**Likelihood to recommend:** Medium. Structurally sound but needs mechanical differentiation between weapons to deliver on the educational premise.

---

### Tara Sullivan — Events and Tradeshow Manager
**Score: 8/10**

**Praise:** This is the strongest result in the lens. Offline capability, browser-based deployment, 150-second run time, and a 20-second idle reset are all decisions that show someone thought about the event context specifically. Zero setup overhead is a genuine differentiator versus any experience that requires an app install or internet dependency.

**Top objection:** The local leaderboard persists between players. At a corporate event, this creates two problems: a player's name and score is visible to whoever plays next (a privacy consideration), and there is no protection against inappropriate entries that could sit on screen during a conversation with a prospect. A session-scoped leaderboard, or a simple name-length filter, would close this.

**Additional notes:**
- The default audio state matters more than the toggle. Autoplay sound at a busy tradeshow floor is either a crowd attractor or a noise complaint depending on booth placement. The default should be off with a clear visual prompt to enable it
- No description of what the attract mode displays. If it is a static title screen it will not pull foot traffic. If it shows active gameplay it will. Worth confirming and optimising — it is the game's only passive marketing moment

**Likelihood to recommend:** High. Minor fixes, strong fundamentals.

---

### Lens 1 Summary

| Persona | Score | Top Fix |
|---|---|---|
| Jamie Park | 7/10 | Add a 5-second onboarding overlay before wave 1 |
| Cody Brennan | 6/10 | Give weapons mechanical differences, not just stat multipliers |
| Tara Sullivan | 8/10 | Scope leaderboard to session, set audio default to off |

---

## Lens 2: Cybersecurity and Product Accuracy

### Brendan Walsh — Enterprise IAM Specialist
**Score: 7/10**

**Praise:** The weapon-as-control metaphor is sound. Elevating MFA, SSO, and password managers to distinct power-ups correctly signals they are separate, stackable controls — not interchangeable. The password manager framing ("eliminates reuse") is accurate and specific.

**Top objection:** The 99.9% stat is attributed to SSO in the game, but that figure originates from Microsoft's MFA research. SSO centralises authentication — it does not block automated attacks the way MFA does. If a security practitioner catches this at a booth, it undermines credibility fast.

**Additional notes:**
- "Strong Passwords" and "Password Managers" appear as separate weapons, implying they solve different problems. In practice, a password manager delivers both. The distinction is fine at surface level but could confuse someone who asks a follow-up question
- "Hackers" as final-wave boss is too generic. Naming them — credential stuffing, phishing, infostealers — would improve both accuracy and educational value

**Likelihood to recommend:** Medium-High. Would endorse with the SSO stat corrected.

---

### Nina Okafor — SaaS Security and Shadow IT Analyst
**Score: 5/10**

**Praise:** Placing IT Dashboard as a power-up rather than background decoration is the right call. It correctly signals that visibility is a security control, not just a reporting tool.

**Top objection:** The IT Dashboard is too generic to create a conversation about SaaS Monitoring or SaaS Protect. A player completes the game having learned that "dashboards are good" — not that their organisation likely has 50+ unapproved SaaS tools running right now. Shadow IT and AI sprawl are the most timely threats in this space and they are invisible in the game.

**Additional notes:**
- No enemy type represents an unapproved SaaS app, a shadow AI tool, or a third-party integration. These are the actual threats the IT Dashboard weapon should counter — without them, the weapon feels disconnected from its real-world purpose
- The game does not distinguish between visibility (what IT Dashboard gives you) and control (what you do with it)

**Likelihood to recommend:** Medium. Would require a named shadow IT enemy and tighter dashboard framing to create a genuine SaaS Protect conversation.

---

### Dr. Sarah Kim — CISO and Security Awareness Lead
**Score: 6/10**

**Praise:** The instructional design logic is correct: each weapon maps to a real control, the player experiences the consequence of not having it, and score tiers create a natural debrief hook for booth staff. The bones of a solid awareness tool are here.

**Top objection:** The educational payload is delivered at the wrong moment. Any concept introduced during active combat will not be read, processed, or retained. The game ends with a score and a leaderboard prompt — but no summary of what the player just learned. There is no "here is what protected your vault" screen. Without it, the learning does not stick.

**Additional notes:**
- The game teaches "these tools exist and are useful" — it does not prompt the behaviour change of "you should use a password manager personally." A single end-screen prompt ("Does your organisation use all five?") would shift it from informational to actionable
- No mechanism exists to measure whether learning occurred. For any internal training deployment, this is a barrier

**Likelihood to recommend:** Medium. Effective as a conversation starter. Not yet effective as a standalone awareness tool without a post-game learning moment.

---

### Lens 2 Summary

| Persona | Score | Top Fix |
|---|---|---|
| Brendan Walsh | 7/10 | Correct the SSO stat attribution to MFA |
| Nina Okafor | 5/10 | Add shadow IT and AI sprawl as named enemy types |
| Dr. Sarah Kim | 6/10 | Add a post-game summary screen with learning reinforcement |

---

## Lens 3: Target Audience

### Mark Henderson — CFO, Professional Services
**Score: 7/10**

**Praise:** The game asks nothing of him upfront. No signup, no tutorial, no jargon barrier. He can pick it up, play for 150 seconds, and walk away. For a non-technical executive at a tradeshow, that frictionless entry is the difference between engaging and moving on.

**Top objection:** He will not read a single weapon description during play. The entire educational layer is invisible to him until the game ends. And the game currently ends with a score and a leaderboard prompt — not a question that makes him think. The "aha" moment the booth team needs to open a conversation does not exist yet.

**Additional notes:**
- The score tier system is the most underused asset in the game for this persona. "You scored Novice — here are the 3 controls your vault was missing" would give a booth team member a natural, non-pushy opener
- If he scores well, he feels good and walks away. If he scores poorly, he may feel confused rather than curious. Neither outcome reliably creates a follow-up conversation without a post-game prompt

**Likelihood to recommend:** Medium. Would create a moment, but not reliably convert it into a conversation without a post-game hook.

---

### Lisa Tran — IT Manager, Retail
**Score: 8/10**

**Praise:** This is the persona the game serves best. She already understands what MFA, SSO, and password managers are. The game validates them in a format she could use with her own non-technical staff. The browser-based, offline deployment means she could realistically run this at an all-hands or store manager meeting without any IT overhead.

**Top objection:** The tradeshow aesthetic works against her for internal deployment. The visual register — arcade shooter, score attack, leaderboard — signals "event game" not "training tool." She would want a mode that slows down, names the concepts more explicitly, and does not make a store manager feel like they are bad at something in front of colleagues.

**Additional notes:**
- She is the most likely persona to become a genuine advocate. If she plays at a booth and thinks "I could use this," that is a warm conversation about LastPass's broader platform
- The password manager weapon framing ("eliminates password reuse") is exactly the message she is already trying to land with her team

**Likelihood to recommend:** High for event context. Medium for internal training without a separate mode.

---

### Ryan Castillo — B2B Marketing Manager
**Score: 6/10**

**Praise:** The weapon-as-product-feature metaphor is a smart piece of brand design. Every weapon is a LastPass capability. A player who asks "what is the IT Dashboard weapon?" has just asked for a product demo. The game creates natural conversation hooks that most branded experiences have to force.

**Top objection:** The post-game screen is a dead end. A player finishes, sees their score, enters the leaderboard, and that is it. There is no branded moment, no CTA, no "find out how your organisation scores" prompt, no connection back to LastPass. The game does the hard work of creating engagement and then hands the player back to the booth team with nothing in their hand.

**Additional notes:**
- Shareability is low. There is no score card, no screenshot prompt, no "challenge a colleague" mechanic. A shareable score image with a LastPass watermark would extend reach beyond the booth
- Score tier names are a missed brand moment. Tier names tied to LastPass positioning ("Vault Guardian," "Access Champion") would reinforce brand recall

**Likelihood to recommend:** Medium. Strong raw material, underdelivers on brand conversion without a post-game screen.

---

### Lens 3 Summary

| Persona | Score | Top Fix |
|---|---|---|
| Mark Henderson | 7/10 | Post-game prompt tied to score tier to open booth conversation |
| Lisa Tran | 8/10 | Optional training mode with slower pacing for internal deployment |
| Ryan Castillo | 6/10 | Branded post-game screen with CTA and shareable score card |

---

## Full Panel Results

| Persona | Lens | Score |
|---|---|---|
| Jamie Park | UX and Game Design | 7/10 |
| Cody Brennan | UX and Game Design | 6/10 |
| Tara Sullivan | UX and Game Design | 8/10 |
| Brendan Walsh | Cybersecurity and Product | 7/10 |
| Nina Okafor | Cybersecurity and Product | 5/10 |
| Dr. Sarah Kim | Cybersecurity and Product | 6/10 |
| Mark Henderson | Target Audience | 7/10 |
| Lisa Tran | Target Audience | 8/10 |
| Ryan Castillo | Target Audience | 6/10 |
| **Panel average** | | **6.7/10** |

---

## Priority Fix List

Issues raised by more than one persona across different lenses, ordered by impact.

### Fix 1: Add a post-game summary screen
**Raised by:** Dr. Sarah Kim, Mark Henderson, Ryan Castillo

The single highest-impact change. One screen showing which controls protected the vault, one question prompting the player to think about their own organisation, one LastPass CTA. Converts engagement into conversation and completes the educational arc.

### Fix 2: Give weapons mechanical differences, not just stat multipliers
**Raised by:** Cody Brennan, Nina Okafor, Brendan Walsh

Weapons should feel and behave differently in the player's hand. This simultaneously improves game feel, makes security concepts more memorable through experience rather than labels, and creates a more accurate product representation. The highest-effort fix but resolves issues across all three lenses.

### Fix 3: Correct the SSO stat attribution
**Raised by:** Brendan Walsh

The 99.9% automated attack block figure belongs to MFA, not SSO. A quick copy fix with significant credibility implications if left uncorrected in a room with security practitioners.

### Fix 4: Add shadow IT or AI sprawl as a named enemy type
**Raised by:** Nina Okafor, Ryan Castillo

The IT Dashboard weapon needs a visible threat it counters. Without a named shadow IT or AI sprawl enemy, the SaaS monitoring conversation never starts and the weapon feels unmotivated.

### Fix 5: Scope the leaderboard to session
**Raised by:** Tara Sullivan

Privacy and inappropriate content risk at corporate events. Low development effort, removes a real operational concern for event managers.

### Fix 6: Add a 5-second onboarding overlay before wave 1
**Raised by:** Jamie Park, Mark Henderson

One prompt before combat begins. Removes the barrier for non-gamers without slowing down players who already know what to do.
