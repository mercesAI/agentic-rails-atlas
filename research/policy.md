# Policy and regulation research

Accessed 2026-10-11. Source records live in `research/policy.json` (ids `src-policy-*`, plus reused dossier ids). Every statement carries a confidence: **verified** (primary text read), **reported** (secondary source only), **unverified** (not confirmed).

This file is research for writers. It is not legal advice, and the site must say so once on the Policy pages.

## 1. Seed audit (ATLAS_PROMPT.md Section 8.1)

| Seed | Result | Evidence |
|---|---|---|
| GENIUS Act signed 2025-07-18 | confirmed | Public Law 119-27, "Approved July 18, 2025" [src-policy-genius-act] |
| Effective on the earlier of 2027-01-18 or 120 days after final rules | confirmed | Section 20 says 18 months after enactment or 120 days after the regulators "issue any final regulations" [src-policy-genius-act] |
| Final rules pending; OCC to finalize by November 2026 | confirmed (reported) | OCC proposal 2026-02-25; Comptroller Gould targeted November (PYMNTS 2026-08-19); no final rule in the Federal Register on 2026-10-11 [src-policy-occ-genius-proposal] [src-policy-pymnts-occ-november] |
| The Act says nothing about AI agents | corrected (nuance) | No provision treats agents as payers, but Section 9 tells Treasury to seek comment on AML detection methods and lists "artificial intelligence" among them [src-policy-genius-act] |
| Regulation E 1005.2(m) access-device exclusion | confirmed | Text read on eCFR [src-policy-rege-1005-2] |
| Regulation Z 1026.12(b) $50 cap and "actual, implied, or apparent authority" | confirmed | Text read on eCFR [src-policy-regz-1026-12] |
| Senator Warner letter to Treasury 2026-06-02 | confirmed (reported) | Letter PDF dated 260602 in its file name; content from press summaries; warner.senate.gov returned 403 [src-policy-warner-letter] [src-policy-warner-summary] |
| No CFPB rule specific to AI agents | confirmed | Federal Register API search returned 0 CFPB documents for "artificial intelligence" and agent since 2025-01-01; the closest item is the 1033 reconsideration [src-policy-fr-cfpb-ai-search] [src-policy-cfpb-1033-anpr] |
| EU Digital Omnibus, Regulation (EU) 2026/1744, in force 2026-07-27 | confirmed | OJ of 2026-07-24; Article 4: third day after publication [src-policy-eu-ai-omnibus] |
| Annex III high-risk moved to 2027-12-02 | confirmed, with addition | Annex I (product) high-risk moved to 2028-08-02 [src-policy-eu-ai-omnibus] |
| Article 50 transparency applies from 2026-08-02 | confirmed, with addition | General application date stays 2026-08-02; generative systems already on the market get until 2026-12-02 for Article 50(2) marking [src-policy-eu-ai-omnibus] |
| PSD3 and PSR provisional agreement 2025-11-27, not in the OJ | confirmed (reported) | Final compromise texts 2026-04-23; ECON vote 2026-05-05; plenary, Council adoption and OJ still pending in the latest sources found [src-policy-arthurcox-psd3] [src-policy-obt-psd3] |
| PSR applies around 2028 | confirmed (reported) | 18 to 21 months after entry into force by secondary estimates [src-policy-obt-psd3] |
| MiCA CASP transition ended 2026-07-01 | confirmed | AMF relaying ESMA, 2026-06-23 [src-policy-amf-mica-end] |
| FCA payments priorities 2026-03-25 include agentic AI | confirmed | FCA Payments Regulatory Priorities report [src-policy-fca-payments-priorities] |
| HM Treasury consultation 2026-07-14 to 2026-10-06 | confirmed | GOV.UK content API: opened 2026-07-14, closed 2026-10-06 [src-policy-hmt-mpsr] |
| Canada Bill C-15 Royal Assent 2026-03-26 | confirmed | LEGISinfo; S.C. 2026, c. 3 [src-policy-ca-c15] |
| Stablecoin Act expected in force in 2027 | confirmed (reported) | Law firm commentary [src-policy-dlapiper-c15] |
| RPAA fully in force since 2025-09-08 | confirmed | Bank of Canada page [src-policy-boc-rpaa] |
| Consumer-driven banking phase 2 by mid-2027 | confirmed (reported) | Budget 2025 coverage [src-policy-ca-cdb] |
| MAS AI guidelines 2026-10-07, effective 2027-10-07 | confirmed, with addition | Sections 5 and 6 phase in by 2028-10-07; MAS will consult on agentic AI guidance in 2027 [src-policy-mas-ai-release] |
| Worldpay analysis 2026-07-30, "no liability shift yet" | confirmed | Page states it; date from the visa-tap dossier's page metadata [src-worldpay-liability] |
| EMVCo lists agentic transaction indicators as future work | confirmed | EMVCo draft framework 2026-09-01 [src-mcap-emvco-news] [src-mcap-emvco-hub] |
| No public agent-specific dispute or liability rules from Visa or Mastercard | confirmed (evidence of absence) | Worldpay, Nevermined reviews; the 2026-09-11 KYA collaboration announced no rule change [src-worldpay-liability] [src-nevermined-vic] [src-mcap-nevermined-review] [src-policy-ant-kya] |

## 2. United States

### Consumer protection and liability
- **Debit and account transfers (Regulation E).** An unauthorized transfer is one started by someone other than the consumer without actual authority and with no benefit to the consumer. It excludes transfers by a person to whom the consumer gave the access device, until the consumer tells the institution that person is no longer authorized. A consumer who gives an agent a credential may therefore carry the loss for that agent's transfers until notice. [verified] [src-policy-rege-1005-2]
- **Credit cards (Regulation Z).** Unauthorized use means use by someone without "actual, implied, or apparent authority" from which the cardholder gets no benefit. Liability is capped at the lesser of $50 or the amount obtained before notice. Whether an agent acting outside a mandate has apparent authority is the open question. [verified] [src-policy-regz-1026-12]
- **No agent rule from the CFPB.** No CFPB rule or proposal on AI agents was found. The 2025-08-22 advance notice on personal financial data rights reopens who counts as a consumer's representative, which matters for agents that read account data. [verified] [src-policy-fr-cfpb-ai-search] [src-policy-cfpb-1033-anpr]
- **Congress.** Senator Warner wrote to Treasury on 2026-06-02 asking it to examine agentic payment rails and how current law allocates liability when agents err or enable fraud. [reported] [src-policy-warner-letter] [src-policy-warner-summary]
- **Courts.** In Amazon v. Perplexity the Ninth Circuit (2026-08-04, published) vacated an injunction against an agentic browser. On that record the user, not the agent vendor, accesses the site, so computer-access claims were unlikely to succeed. The court limited the holding to its record. [verified] [src-policy-ca9-opinion]

### AML and sanctions
- OFAC obligations are the same for digital and fiat currency transactions. [verified] [src-policy-ofac-faq-virtual]
- FinCEN's 2019 guidance applies money transmitter rules to many convertible virtual currency business models, which can reach stablecoin facilitators and custodial agent wallets. [verified, scope summary] [src-policy-fincen-2019-cvc]
- The GENIUS Act treats a permitted payment stablecoin issuer as a financial institution for Bank Secrecy Act purposes, subject to sanctions and AML law, and defines lawful orders that require an issuer to seize, freeze, burn or prevent transfers of its stablecoins. [verified] [src-policy-genius-act]

### Stablecoin rules
- GENIUS Act: signed 2025-07-18; effective on the earlier of 2027-01-18 or 120 days after final rules. The OCC proposed its rule on 2026-02-25 and aims to finalize by November 2026. [verified, OCC timing reported] [src-policy-genius-act] [src-policy-occ-genius-proposal] [src-policy-pymnts-occ-november]
- The Act does not deal with agents as payers. It mentions artificial intelligence once, as an AML detection method for Treasury to study. [verified] [src-policy-genius-act]

### Strong customer authentication
- The US has no general SCA mandate comparable to PSD2. Authentication of agent payments is set by network rules and issuer risk decisions. [verified by absence in Regulation E and Z; context]

### AI-specific rules
- No federal statute governs AI agents in payments. Warner's AI AGENT Act exists only as a discussion draft. [reported] [src-policy-warner-summary]

### Data protection
- Regulation P governs financial institutions' sharing of consumer financial information. [verified] [src-policy-glba-reg-p]
- California's CCPA regulations on automated decisionmaking technology (ADMT) were approved on 2025-09-22 and are effective from 2026-01-01, with access and opt-out rights for ADMT use. [verified] [src-policy-cppa-admt]

## 3. European Union

### Consumer protection and liability
- PSD2 sets payer consent, refund rights and a capped payer liability for unauthorized transactions. Applying "consent to the specific transaction" to a standing agent mandate is untested. [verified for the instrument; application is analysis] [src-policy-eu-psd2]
- PSD3 and the Payment Services Regulation: provisional agreement 2025-11-27; final compromise texts 2026-04-23; not in the Official Journal in the latest sources found. The PSR would apply about 18 to 21 months after entry into force, so around 2028. No agent-specific provisions. [reported] [src-policy-arthurcox-psd3] [src-policy-obt-psd3]

### AML and sanctions
- The recast Transfer of Funds Regulation applies the travel rule to crypto-asset transfers, including stablecoin payments made through a provider. [verified] [src-policy-eu-tfr]
- The Anti-Money Laundering Regulation applies generally from 2027-07-10. [verified] [src-policy-eu-amlr]

### Stablecoin rules
- MiCA governs e-money tokens and crypto-asset service providers. The CASP transitional period ended 2026-07-01; unauthorized firms had to wind down. [verified] [src-policy-amf-mica-end] [src-policy-eu-mica]

### Strong customer authentication
- The RTS on SCA (Delegated Regulation 2018/389) requires two-factor authentication and dynamic linking of amount and payee for remote payments. An agent that pays without the user present needs an exemption, a merchant-initiated transaction setup, or a delegated authentication model. [verified for the instrument; application is analysis] [src-policy-eu-rts-sca]
- PSD3 and PSR changes reported by commentators include SCA adjustments and EUDI wallet acceptance. [reported] [src-policy-obt-psd3]

### AI-specific rules
- AI Act: general application 2026-08-02, including Article 50 transparency (people must be told they interact with an AI system). The Digital Omnibus (in force 2026-07-27) moves Annex III high-risk obligations to 2027-12-02 and Annex I to 2028-08-02, and gives existing generative systems until 2026-12-02 for Article 50(2) marking. Creditworthiness scoring is an Annex III use; a shopping or payment agent is not high-risk by default. [verified] [src-policy-eu-ai-omnibus] [src-policy-eu-ai-act]

### Data protection
- GDPR Article 22 limits decisions based solely on automated processing that have legal or similarly significant effects. [verified for the instrument] [src-policy-eu-gdpr]

## 4. United Kingdom

### Consumer protection and liability
- The Payment Services Regulations 2017 treat a transaction as authorised only if the payer consented to its execution (regulation 67). Payer liability for lost, stolen or misappropriated instruments is capped at GBP 35, subject to exceptions (regulation 77). [verified] [src-policy-uk-psrs-67] [src-policy-uk-psrs-77]
- The FCA's Payments Regulatory Priorities (2026-03-25) say it will consider, with HM Treasury, whether regulation must change to support agentic AI payments. [verified] [src-policy-fca-payments-priorities]
- HM Treasury's consultation "Modernising Payment Services Regulation" ran from 2026-07-14 to 2026-10-06 and asks how authentication, consent and liability should adapt for agentic payments. No government response yet. [verified] [src-policy-hmt-mpsr]

### AML and sanctions
- The Money Laundering Regulations 2017 cover cryptoasset businesses and the travel rule for transfers. [verified for the instrument] [src-policy-uk-mlrs]

### Stablecoin rules
- The Treasury consultation proposes one set of regulated activities for fiat and tokenised payment services. [reported] [src-policy-hmt-mpsr]

### Strong customer authentication
- UK SCA rules (onshored RTS) apply in the same way as in the EU; the consultation asks how authentication should work for agents. [reported] [src-policy-hmt-mpsr]

### AI-specific rules
- No AI statute. The FCA applies existing rules and the Consumer Duty. [reported] [src-policy-fca-payments-priorities]

### Data protection
- The Data (Use and Access) Act 2025 amends UK GDPR rules on automated decision-making and enables smart data schemes. [verified for the instrument; scope summary] [src-policy-uk-duaa]

## 5. Canada

### Consumer protection and liability
- No agent-specific payment liability rules found. [unverified; evidence of absence only]
- Consumer-driven banking phase 2 (payment initiation, write access) is targeted for mid-2027 under Bank of Canada oversight. [reported] [src-policy-ca-cdb]

### AML and sanctions
- The Proceeds of Crime (Money Laundering) and Terrorist Financing Act covers money services businesses, including virtual currency dealers. [verified for the instrument] [src-policy-ca-pcmltfa]

### Stablecoin rules
- The Stablecoin Act (in Bill C-15, Royal Assent 2026-03-26, S.C. 2026, c. 3) makes the Bank of Canada supervisor of non-prudentially regulated issuers, with a public registry. It is expected in force in 2027 once regulations are made. [verified for assent; in-force timing reported] [src-policy-ca-c15] [src-policy-dlapiper-c15]

### Payments supervision
- The Retail Payment Activities Act is fully in force: since 2025-09-08 payment service providers must have risk management and funds safeguarding frameworks. [verified] [src-policy-boc-rpaa] [src-policy-ca-rpaa]

### AI-specific rules
- No federal AI statute in force. [unverified; evidence of absence only]

### Data protection
- PIPEDA governs private-sector personal information. [verified for the instrument] [src-policy-ca-pipeda]

## 6. Singapore

### Consumer protection and liability
- The E-Payments User Protection Guidelines set duties and liability allocation for unauthorized and erroneous e-payments. [verified for the instrument] [src-policy-mas-eupg]

### AML and sanctions, stablecoins
- The Payment Services Act 2019 licenses digital payment token services (statute site returned 403). [reported] [src-policy-sg-psa]
- MAS finalized its stablecoin framework on 2023-08-15. [verified] [src-policy-mas-stablecoin]

### AI-specific rules
- MAS issued Guidelines on AI Risk Management on 2026-10-07, effective 2027-10-07, with Sections 5 and 6 phased in by 2028-10-07. The release names agentic AI systems and plans a 2027 consultation on more agentic AI guidance. [verified] [src-policy-mas-ai-release] [src-policy-mas-ai-guidelines]
- The Ant International, Mastercard and Visa Know Your Agent work runs through the MAS-convened BuildFin.ai platform. [reported] [src-policy-ant-kya]

### Data protection
- The Personal Data Protection Act 2012 applies (statute site returned 403). [reported] [src-policy-sg-pdpa]

## 7. Card networks and EMVCo

- No public dispute, chargeback or liability rule specific to agent-initiated transactions from Visa or Mastercard as of 2026-10-11. Properly tokenized agent transactions follow existing rules. Liability for disputes short of fraud ("my agent misread me") is unresolved, and Worldpay says no liability shift exists yet. [reported] [src-worldpay-liability] [src-nevermined-vic] [src-mcap-nevermined-review]
- EMVCo published a draft "EMV Agentic Payments" framework on 2026-09-01 (comments to 2026-09-30), proposing Intent Services; Know Your Agent and Agentic Transaction Indicators are listed as possible future work. [verified] [src-mcap-emvco-news] [src-mcap-emvco-hub]
- Ant International, Mastercard and Visa announced Know Your Agent interoperability work on 2026-09-11, building on Visa TAP and Mastercard Verifiable Intent. It is a collaboration, not a rule. [reported] [src-policy-ant-kya] [src-policy-pymnts-kya]

## 8. Per-protocol touchpoints (for section J rows)

| Protocol | Rules that touch it | Why |
|---|---|---|
| ERC-8004 | GDPR and UK GDPR; MiCA and TFR only indirectly; EU AI Act Article 50 | Public, permanent registration and feedback records can hold personal data that cannot be erased; the registry moves no funds, so payment and stablecoin rules apply to linked payment rails, not to the registry |
| x402 | GENIUS Act; MiCA; TFR travel rule; OFAC; FinCEN money transmission; UK MLRs; MAS PSA | Settles in USDC and other stablecoins; facilitators and custodial wallets may be money transmitters or CASPs; sanctions screening applies to payer and payee addresses |
| Visa TAP | Regulation Z and E; PSD2 SCA and RTS; UK PSRs regs 67 and 77; network rules; EMVCo framework | Card-not-present payments by a recognized agent; consent and unauthorized-use tests decide who carries losses; SCA exemptions or delegated authentication needed when the user is absent |
| OpenAI ACP | Regulation Z and E; PSD2 SCA; EU AI Act Article 50; GDPR; CCPA ADMT; Amazon v. Perplexity (agent access) | Merchant stays merchant of record and charges a delegated card token; disclosure that the buyer talks to an AI; checkout data sharing with the agent platform |
| UCP | Regulation Z and E; PSD2 SCA; GDPR; AI Act Article 50 | Google-tokenized card payments with the merchant as merchant of record; the merchant's PSP handles SCA and disputes |
| Stripe MPP | GENIUS Act and MiCA (stablecoin charges on Tempo); Regulation Z and E and PSD2 (card charges via Shared Payment Tokens); TFR; OFAC | Mixed rails: card methods inherit card law and network rules, stablecoin methods inherit stablecoin and AML rules |
| AP2 | Regulation E 1005.2(m); Regulation Z 1026.12(b); PSD2 and UK PSRs consent; EU AI Act; GDPR | Signed mandates are evidence of what the user authorized, which is the central fact in any unauthorized-transaction dispute |
| Mastercard Agent Pay | Regulation Z and E; PSD2 SCA; UK PSRs; network rules; EMVCo framework; MAS AI guidelines (issuers in Singapore) | Agentic tokens built on Mastercard tokenization; issuers and acquirers keep existing card liability until networks publish agent rules |

## 9. Open items

- PSD3 and PSR: confirm plenary vote, Council adoption and OJ publication on EUR-Lex.
- GENIUS Act: watch the Federal Register for final OCC, FDIC, NCUA and Treasury rules.
- HM Treasury: watch for the consultation response.
- Warner letter: read the PDF text once a text layer can be extracted, then upgrade to verified.
- Amazon v. Perplexity: watch the district court docket on remand and any rehearing petition.
