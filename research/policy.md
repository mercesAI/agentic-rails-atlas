# Policy and regulation research

Accessed 2026-10-11; refreshed 2026-11-14 (see section 10). Source records live in `research/policy.json` (ids `src-policy-*`, plus reused dossier ids). Every statement carries a confidence: **verified** (primary text read), **reported** (secondary source only), **unverified** (not confirmed).

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

Correction 2026-10-18, revised 2026-10-19 after a legal check (last row of the table above, "No public agent-specific dispute or liability rules from Visa or Mastercard"): wrong for Visa. The one public document "Visa Core Rules and Visa Product and Service Rules" carries agent rules in the editions of 2025-10-18 (effective that day; 2025-11-04 in Chile) and 2026-04-18, mainly in the Product and Service Rules (section 4.1.24). The rules govern the relationship between Visa and its Members and their agents and confer no rights on third parties (1.1.1.5, ID# 0007428); where they conflict with applicable law, such as Regulation E or Z, PSD2 or the UK PSRs, the law governs (1.1.1.3, ID# 0000385). Section 4.1.24.2 (ID# 0031168) requires an Agentic Payment Provider to enroll in Visa Intelligent Commerce and register with Visa, directly or through an Agentic Payment Enabler. Section 4.1.24.10 (ID# 0031176) makes the cardholder responsible, within Visa's system, for the provider's actions in an Agentic Transaction as if the cardholder initiated it, and the glossary entry Cardholder (ID# 0024372) treats the provider as the Cardholder for such a transaction. The glossary entry Agentic Payment Provider (ID# 0031164) lists conditions an agent app must meet (payment instruction and cardholder verification, use at more than one merchant, an EMV payment token passed to the merchant, no part in authorization, clearing or settlement), so not every agent qualifies. Section 5.4.2.5 (ID# 0008771) bars a merchant from requiring a cardholder to waive the right to dispute an Agentic Transaction. Visa calls none of these agent rules a liability shift (the only rules it titles that way are the EMV Liability Shift dispute conditions 10.1 and 10.2), and they add no agent-specific dispute condition, fee or interchange rate (rule 1.5.5.2 bars an Agentic Payment Provider from surcharging, with regional exceptions). They do allocate some risk: an issuer must pay the acquirer for an Agentic Transaction processed under the cardholder's payment instructions (1.7.6.1, ID# 0006558) and must not block Agentic Payment Provider transactions in a systematic or wholesale manner (1.7.4.1, ID# 0029326). For disputes processed from 2026-10-24, an Agentic Payment Provider's login ID counts among the matching data that can make a Dispute Condition 10.4 (card-absent fraud) dispute invalid (ID# 0030254). Worldpay (2026-07-30) says no liability shift exists yet. Update 2026-11-14: the current public edition is dated 2026-10-24, and it renumbers the agent section from 4.1.24 to 4.1.23 (Agentic Platform Requirements, pages 263 to 269) with the same rule IDs, so 4.1.24.2 above is now 4.1.23.2 (ID# 0031168) and 4.1.24.10 is now 4.1.23.10 (ID# 0031176); its summary of changes lists no agentic change, and the Dispute Condition 10.4 login-ID rule has applied since 2026-10-24. Visa's US interchange schedule of the same date still has no agentic category. [verified] [src-visa-rules-public] [src-visa-us-irf-2026-04] The Mastercard half of the row now rests on the 2026-06-02 Mastercard Rules, the edition at mastercard.com since at least 2026-07-10 (read from the Wayback Machine; the 2025-06-03 edition cited on 2026-10-18 was out of date). They never use the word agentic and do not mention ERC-8004, but rules 9.2.4 and 9.5.1 require pass-through wallet operators and checkout facilitators to follow the standards of programs they join, naming the Mastercard Agent Pay Program Standards; a web search on 2026-10-19 found no public copy of them. [verified; the Worldpay statement and the standards search reported] [src-visa-rules-public] [src-worldpay-liability] [src-mastercard-rules-2026-06]

Correction 2026-10-18 (row "Final rules pending; OCC to finalize by November 2026"): Treasury issued a procedural GENIUS Act interim final rule for state certifications, published and effective 2026-09-30 (FR Doc. 2026-19966). It is not a final rule of a primary federal payment stablecoin regulator, so the Section 20 trigger had still not occurred on 2026-10-18 (Federal Register search). [verified] [src-policy-fr-genius-ifr]

Correction 2026-11-14 (row "Final rules pending; OCC to finalize by November 2026"): the OCC announced its final rule on 2026-10-21 and the Federal Register published it on 2026-10-23 (FR Doc. 2026-21706, 91 FR 67000), effective 2027-01-18. The OCC calls it the first final rule of a primary federal payment stablecoin regulator implementing the Act and says 2027-01-18 is the Act's effective date (120 days after 2026-10-23 falls later, so the 18-month date governs). It has no AI-agent provision, and its BSA, AML and sanctions rules come in a separate rulemaking with Treasury. No FDIC, Federal Reserve, NCUA or Treasury final rule had followed by 2026-11-14. [verified] [src-policy-fr-occ-genius-final] [src-policy-occ-nr-2026-92]

Correction 2026-11-14 (rows "PSD3 and PSR provisional agreement 2025-11-27, not in the OJ" and "PSR applies around 2028"): the Council adopted its first-reading positions on both files on 2026-10-29 (documents dated 2026-11-04). Both now await the European Parliament's second reading, with an indicative plenary date of 2026-12-14, and neither is in the Official Journal. The Council texts replace the secondary timing estimates: most PSR provisions apply 21 months after entry into force (Articles 51 and 58 after 27 months), PSD3 must be transposed and applied 21 months after entry into force, and payment institutions already authorized under PSD2 may continue until 27 months. [verified] [src-policy-consilium-psr-position] [src-policy-consilium-psd3-position] [src-policy-oeil-psr] [src-policy-oeil-psd3]

Correction 2026-11-14 (row "Stablecoin Act expected in force in 2027"): now confirmed from a primary source. The proposed Stablecoin Regulations (Canada Gazette, Part I, 2026-10-24) say the government intends them to come into force with the Act in fall 2027; no commencement order had appeared by 2026-11-14. [verified] [src-policy-ca-gazette-stablecoin-regs]

## 2. United States

### Consumer protection and liability
- **Debit and account transfers (Regulation E).** An unauthorized transfer is one started by someone other than the consumer without actual authority and with no benefit to the consumer. It excludes transfers by a person to whom the consumer gave the access device, until the consumer tells the institution that person is no longer authorized. A consumer who gives an agent a credential may therefore carry the loss for that agent's transfers until notice. [verified] [src-policy-rege-1005-2]
- **Credit cards (Regulation Z).** Unauthorized use means use by someone without "actual, implied, or apparent authority" from which the cardholder gets no benefit. Liability is capped at the lesser of $50 or the amount obtained before notice. Whether an agent acting outside a mandate has apparent authority is the open question. [verified] [src-policy-regz-1026-12]
- **No agent rule from the CFPB.** No CFPB rule or proposal on AI agents was found. The 2025-08-22 advance notice on personal financial data rights reopens who counts as a consumer's representative, which matters for agents that read account data. [verified] [src-policy-fr-cfpb-ai-search] [src-policy-cfpb-1033-anpr] Since Executive Order 14434 (published 2026-10-02) agencies write "Super Intelligence" for AI in non-statutory documents, so absence searches must use both terms; a CFPB search for "super intelligence" on 2026-11-14 also found nothing. [verified] [src-policy-fr-eo-14434] [src-policy-fr-cfpb-ai-search]
- **Congress.** Senator Warner wrote to Treasury on 2026-06-02 asking it to examine agentic payment rails and how current law allocates liability when agents err or enable fraud. [reported] [src-policy-warner-letter] [src-policy-warner-summary]
- **Courts.** In Amazon v. Perplexity the Ninth Circuit (2026-08-04, published) vacated an injunction against an agentic browser. On that record the user, not the agent vendor, accesses the site, so computer-access claims were unlikely to succeed. The court limited the holding to its record. [verified] [src-policy-ca9-opinion] It denied rehearing en banc on 2026-09-10 and issued its mandate on 2026-09-18. Back in the district court, Amazon's amended complaint (2026-09-21) adds a contract claim (tortious interference) based on the Agent Terms in its Conditions of Use, which since 2025-05-30 require agents to identify themselves with a self-declared user agent string; Perplexity's motion to dismiss (2026-10-13) is set for hearing on 2026-11-20, and trial is set for 2027-09-27. [verified] [src-policy-cl-amazon-perplexity-ca9] [src-policy-cl-amazon-perplexity-district] [src-orbit-amazon-perplexity-fac] [src-orbit-amazon-conditions-of-use]

### AML and sanctions
- OFAC obligations are the same for digital and fiat currency transactions. [verified] [src-policy-ofac-faq-virtual]
- FinCEN's 2019 guidance applies money transmitter rules to many convertible virtual currency business models, which can reach stablecoin facilitators and custodial agent wallets. [verified, scope summary] [src-policy-fincen-2019-cvc]
- The GENIUS Act treats a permitted payment stablecoin issuer as a financial institution for Bank Secrecy Act purposes, subject to sanctions and AML law, and defines lawful orders that require an issuer to seize, freeze, burn or prevent transfers of its stablecoins. [verified] [src-policy-genius-act]

### Stablecoin rules
- GENIUS Act: signed 2025-07-18; effective on the earlier of 2027-01-18 or 120 days after the primary federal payment stablecoin regulators issue final regulations. The OCC proposed its rule on 2026-02-25 and aims to finalize by November 2026. [verified, OCC timing reported] [src-policy-genius-act] [src-policy-occ-genius-proposal] [src-policy-pymnts-occ-november] Update 2026-11-14: the OCC's final rule was announced on 2026-10-21 and published on 2026-10-23 (FR Doc. 2026-21706); it and the Act take effect on 2027-01-18. It covers permitted and foreign payment stablecoin issuers under the OCC and some custody activities, and leaves BSA, AML and sanctions rules to a separate rulemaking. The FDIC, Federal Reserve, NCUA and Treasury had no final rule by 2026-11-14. [verified] [src-policy-fr-occ-genius-final] [src-policy-occ-nr-2026-92]
- The Act does not deal with agents as payers. It mentions artificial intelligence once, as an AML detection method for Treasury to study. [verified] [src-policy-genius-act] The OCC's final rule has no AI-agent provision either; its preamble declines technology-specific requirements. [verified] [src-policy-fr-occ-genius-final]

### Strong customer authentication
- The US has no general SCA mandate comparable to PSD2. Authentication of agent payments is set by network rules and issuer risk decisions. [verified by absence in Regulation E and Z; context]

### AI-specific rules
- No federal statute governs AI agents in payments. Warner's AI AGENT Act exists only as a discussion draft. [reported] [src-policy-warner-summary]
- OCC Bulletin 2026-54 (2026-11-04) gives examiners a framework for banks' use of "super intelligence", the federal term for AI under Executive Order 14434. It places a fully autonomous, customer-facing payment agent in Tier 1 (critical) regardless of test results, treats agentic-commerce systems outside the bank's control as a channel risk (identity, delegation, authentication, velocity limits, disputes, suspension and revocation scaled to the action), and says it sets no supervisory expectations for banks: guidance, not a rule. [verified] [src-policy-occ-bulletin-2026-54] [src-policy-occ-si-framework] [src-policy-fr-eo-14434]

### Data protection
- Regulation P governs financial institutions' sharing of consumer financial information. [verified] [src-policy-glba-reg-p]
- California's CCPA regulations on automated decisionmaking technology (ADMT) were approved on 2025-09-22 and are effective from 2026-01-01, with access and opt-out rights for ADMT use. [verified] [src-policy-cppa-admt]

## 3. European Union

### Consumer protection and liability
- PSD2 sets payer consent, refund rights and a capped payer liability for unauthorized transactions. Applying "consent to the specific transaction" to a standing agent mandate is untested. [verified for the instrument; application is analysis] [src-policy-eu-psd2]
- PSD3 and the Payment Services Regulation: provisional agreement 2025-11-27; final compromise texts 2026-04-23. [reported] [src-policy-arthurcox-psd3] [src-policy-obt-psd3] The Council adopted its first-reading positions on 2026-10-29; both files await the European Parliament's second reading (indicative plenary 2026-12-14) and were not in the Official Journal on 2026-11-14. Most PSR provisions apply 21 months after entry into force (Articles 51 and 58 after 27 months); PSD3 must be transposed and applied after 21 months, when it repeals PSD2 and the second E-Money Directive. Neither text has an AI-agent provision ("artificial intelligence" appears once, in a PSR recital on fraud monitoring). Recitals that bear on agent payments: 158 (strong customer authentication when a merchant-initiated mandate is set up, not for each later merchant-initiated transaction), 170 (pass-through wallet operators need outsourcing agreements and the payer's PSP keeps full liability), and 16 and 171 (technical service providers and payment schemes liable, up to the transaction amount, for failing to support strong customer authentication). [verified] [src-policy-consilium-psr-position] [src-policy-consilium-psd3-position] [src-policy-oeil-psr] [src-policy-oeil-psd3]

### AML and sanctions
- The recast Transfer of Funds Regulation applies the travel rule to crypto-asset transfers, including stablecoin payments made through a provider. [verified] [src-policy-eu-tfr]
- The Anti-Money Laundering Regulation applies generally from 2027-07-10. [verified] [src-policy-eu-amlr]

### Stablecoin rules
- MiCA governs e-money tokens and crypto-asset service providers. The CASP transitional period ended 2026-07-01; unauthorized firms had to wind down. [verified] [src-policy-amf-mica-end] [src-policy-eu-mica]
- On 2026-10-14 the EBA classified USDC (issued in the EU by Circle Internet Financial Europe SAS) as the first significant e-money token under MiCA; from 2026-11-12 the EBA supervises its own funds, reserve of assets, liquidity and recovery and redemption plans, and the French ACPR keeps the rest. [verified] [src-policy-eba-usdc-significant]
- The PSD3 text adds a MiCA Article 60(4a) that lets a payment institution provide crypto-asset services for e-money tokens, where they match its authorized payment services, after notifying its home authority at least 40 working days ahead; PSR recitals deem e-money tokens to be electronic money and say transfers of them for clients could qualify as executing payment transactions. [verified] [src-policy-consilium-psd3-position] [src-policy-consilium-psr-position]

### Strong customer authentication
- The RTS on SCA (Delegated Regulation 2018/389) requires two-factor authentication and dynamic linking of amount and payee for remote payments. An agent that pays without the user present needs an exemption, a merchant-initiated transaction setup, or a delegated authentication model. [verified for the instrument; application is analysis] [src-policy-eu-rts-sca]
- PSD3 and PSR changes reported by commentators include SCA adjustments and EUDI wallet acceptance. [reported] [src-policy-obt-psd3] Update 2026-11-14: the Council's PSR text confirms both, in recital 158 (strong customer authentication at the set-up of a merchant-initiated mandate) and recital 162 (European Digital Identity Wallets as a means of authentication). [verified] [src-policy-consilium-psr-position]

### AI-specific rules
- AI Act: general application 2026-08-02, including Article 50 transparency (people must be told they interact with an AI system). The Digital Omnibus (in force 2026-07-27) moves Annex III high-risk obligations to 2027-12-02 and Annex I to 2028-08-02, and gives existing generative systems until 2026-12-02 for Article 50(2) marking. Creditworthiness scoring is an Annex III use; a shopping or payment agent is not high-risk by default. [verified] [src-policy-eu-ai-omnibus] [src-policy-eu-ai-act]

### Data protection
- GDPR Article 22 limits decisions based solely on automated processing that have legal or similarly significant effects. [verified for the instrument] [src-policy-eu-gdpr]

## 4. United Kingdom

### Consumer protection and liability
- The Payment Services Regulations 2017 treat a transaction as authorised only if the payer consented to its execution (regulation 67). Payer liability for lost, stolen or misappropriated instruments is capped at GBP 35, subject to exceptions (regulation 77). [verified] [src-policy-uk-psrs-67] [src-policy-uk-psrs-77]
- The FCA's Payments Regulatory Priorities (2026-03-25) say it will consider, with HM Treasury, whether regulation must change to support agentic AI payments. [verified] [src-policy-fca-payments-priorities]
- HM Treasury's consultation "Modernising Payment Services Regulation" ran from 2026-07-14 to 2026-10-06 and asks how authentication, consent and liability should adapt for agentic payments. No government response as of 2026-11-14. [verified] [src-policy-hmt-mpsr]
- In a speech on 2026-10-19 the FCA's chief data, information and intelligence officer said the FCA will work with industry, other regulators and frontier labs to develop a trusted framework for agentic finance, covering agent identity, delegated authority, accountability and execution. It is a statement of intent: no rule, consultation or change to the PSRs 2017 followed by 2026-11-14. A companion page, "AI in financial services: good practice and areas for improvement", says its examples create no new requirements. [verified] [src-policy-fca-speech-agentic] [src-policy-fca-ai-good-practice]
- On 2026-10-30 the members of the Digital Regulation Cooperation Forum (CMA, FCA, ICO and Ofcom) published a joint statement on protecting people and businesses in an agentic economy, described on the CMA's GOV.UK pages (the statement itself answered HTTP 403). The CMA's guidance "Using AI agents: complying with consumer law" (2026-03-09, updated 2026-10-30) says a business is responsible for what its AI agent does as it is for an employee, even if someone else built or provides the agent. [verified] [src-policy-cma-ai-agents-guidance] [src-policy-cma-agentic-ai-consumers]

### AML and sanctions
- The Money Laundering Regulations 2017 cover cryptoasset businesses and the travel rule for transfers. [verified for the instrument] [src-policy-uk-mlrs]

### Stablecoin rules
- The Treasury consultation proposes one set of regulated activities for fiat and tokenised payment services. [reported] [src-policy-hmt-mpsr]

### Strong customer authentication
- UK SCA rules (onshored RTS) apply in the same way as in the EU; the consultation asks how authentication should work for agents. [reported] [src-policy-hmt-mpsr]

### AI-specific rules
- No AI statute. The FCA applies existing rules and the Consumer Duty. [reported] [src-policy-fca-payments-priorities] Still true on 2026-11-14: the FCA's 2026-10-19 framework plan is a statement of intent, and the CMA's guidance applies existing consumer law to agents. [verified] [src-policy-fca-speech-agentic] [src-policy-cma-ai-agents-guidance]

### Data protection
- The Data (Use and Access) Act 2025 amends UK GDPR rules on automated decision-making and enables smart data schemes. [verified for the instrument; scope summary] [src-policy-uk-duaa]

## 5. Canada

### Consumer protection and liability
- No agent-specific payment liability rules found. [unverified; evidence of absence only]
- Consumer-driven banking phase 2 (payment initiation, write access) is targeted for mid-2027 under Bank of Canada oversight. [reported] [src-policy-ca-cdb]

### AML and sanctions
- The Proceeds of Crime (Money Laundering) and Terrorist Financing Act covers money services businesses, including virtual currency dealers. [verified for the instrument] [src-policy-ca-pcmltfa]

### Stablecoin rules
- The Stablecoin Act (in Bill C-15, Royal Assent 2026-03-26, S.C. 2026, c. 3) makes the Bank of Canada supervisor of non-prudentially regulated issuers, with a public registry. It is expected in force in 2027 once regulations are made. [verified for assent; in-force timing reported] [src-policy-ca-c15] [src-policy-dlapiper-c15] Justice Laws (consolidation current to 2026-09-30, read 2026-10-19) marks the whole Act not in force; section 97 leaves commencement to orders of the Governor in Council. [verified] [src-policy-ca-stablecoin-act] On 2026-10-24 the Department of Finance prepublished proposed Stablecoin Regulations (Canada Gazette, Part I, 60-day comment period): issuer rules on Bank of Canada registration, one-to-one reserves, redemption with capped fees and no yield, with the stated intention that they come into force with the Act in fall 2027. Proposed, not final; no commencement order by 2026-11-14. [verified] [src-policy-ca-gazette-stablecoin-regs]

### Payments supervision
- The Retail Payment Activities Act is fully in force: since 2025-09-08 payment service providers must have risk management and funds safeguarding frameworks. [verified] [src-policy-boc-rpaa] [src-policy-ca-rpaa]
- The proposed Stablecoin Regulations of 2026-10-24 would also amend the Retail Payment Activities Regulations: a stablecoin from an issuer on the Bank of Canada's list would meet the prescribed criteria, so payment service providers that perform payment functions with it would have to register with the Bank of Canada and meet its safeguarding and operational-risk rules, while financial institutions that issue such stablecoins would not themselves fall under the Act. Whether a USDC-based payment is covered depends on whether its issuer is prescribed. [verified for the proposal; coverage of a given stablecoin is analysis] [src-policy-ca-gazette-stablecoin-regs]

### AI-specific rules
- No federal AI statute in force. [unverified; evidence of absence only]

### Data protection
- PIPEDA governs private-sector personal information. [verified for the instrument] [src-policy-ca-pipeda] Exemption orders under paragraph 26(2)(b) leave collection, use and disclosure within Quebec, Alberta and British Columbia to provincial law, except for federal works, undertakings or businesses. [verified] [src-policy-ca-pipeda-qc-order] [src-policy-ca-pipeda-ab-order] [src-policy-ca-pipeda-bc-order]

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

- No public dispute, chargeback or liability rule specific to agent-initiated transactions from Visa or Mastercard as of 2026-10-11. Properly tokenized agent transactions follow existing rules. Liability for disputes short of fraud ("my agent misread me") is unresolved, and Worldpay says no liability shift exists yet. [reported] [src-worldpay-liability] [src-nevermined-vic] [src-mcap-nevermined-review] (corrected 2026-10-18; see the correction below)
- Correction 2026-10-18, revised 2026-10-19, to the bullet above: wrong for Visa, whose rules have carried agent-specific requirements since 2025-10-18. Those rules govern Visa and its member institutions and yield to applicable law, and Visa calls none of these agent rules a liability shift; Mastercard's 2026-06-02 rules refer to Agent Pay Program Standards that were not found in public (see the correction under the seed audit). [verified] [src-visa-rules-public] [src-mastercard-rules-2026-06]
- Update 2026-11-14 to the two bullets above: Visa's current public rules are the 2026-10-24 edition, in which the agent section is 4.1.23 (renumbered from 4.1.24, rule IDs and substance unchanged), and the login-ID evidence rule for Dispute Condition 10.4 applies to disputes processed from 2026-10-24. That rule is dispute evidence, not an agent-specific dispute condition, and Visa's 2026-10-24 US interchange schedule has no agentic category. [verified] [src-visa-rules-public] [src-visa-us-irf-2026-04]
- EMVCo published a draft "EMV Agentic Payments" framework on 2026-09-01 (comments to 2026-09-30), proposing Intent Services; Know Your Agent and Agentic Transaction Indicators are listed as possible future work. [verified] [src-mcap-emvco-news] [src-mcap-emvco-hub]
- Ant International, Mastercard and Visa announced Know Your Agent interoperability work on 2026-09-11, building on Visa TAP and Mastercard Verifiable Intent. It is a collaboration, not a rule. [reported] [src-policy-ant-kya] [src-policy-pymnts-kya]
- Correction 2026-10-19 to the bullet above and to the 2026-09-11 date in the seed audit table: the joint release is dated 2026-09-10 (PYMNTS cites a 2026-09-09 release; Ant's separate follow-up release is dated 2026-09-11). The three firms, which each rolled out a protocol (Visa TAP, Mastercard Verifiable Intent, Ant's Agentic Mobile Protocol), will explore common Know Your Agent principles through BuildFin.ai, building on the SAFR framework; the work does not build on TAP. [reported] [src-policy-ant-kya] [src-policy-pymnts-kya]

## 8. Per-protocol touchpoints (for section J rows)

| Protocol | Rules that touch it | Why |
|---|---|---|
| ERC-8004 | GDPR and UK GDPR; MiCA and TFR only indirectly; EU AI Act Article 50 | Public, permanent registration and feedback records can hold personal data that cannot be erased; the registry moves no funds, so payment and stablecoin rules apply to linked payment rails, not to the registry |
| x402 | GENIUS Act and the OCC's final rule (both effective 2027-01-18); MiCA (USDC a significant EMT under EBA and ACPR supervision from 2026-11-12); TFR travel rule; OFAC; FinCEN money transmission; UK MLRs; MAS PSA; Canada's RPAA if the proposed Stablecoin Regulations pass | Settles in USDC and other stablecoins; facilitators and custodial wallets may be money transmitters or CASPs; sanctions screening applies to payer and payee addresses |
| Visa TAP | Regulation Z and E; PSD2 SCA and RTS; UK PSRs regs 67 and 77; network rules; EMVCo framework | Card-not-present payments by a recognized agent; consent and unauthorized-use tests decide who carries losses; SCA exemptions or delegated authentication needed when the user is absent |
| OpenAI ACP | Regulation Z and E; PSD2 SCA; EU AI Act Article 50; GDPR; CCPA ADMT; Amazon v. Perplexity (agent access) | Merchant stays merchant of record and charges a delegated card token; disclosure that the buyer talks to an AI; checkout data sharing with the agent platform |
| UCP | Regulation Z and E; PSD2 SCA; GDPR; AI Act Article 50 | Google-tokenized card payments with the merchant as merchant of record; the merchant's PSP handles SCA and disputes |
| Stripe MPP | GENIUS Act and MiCA (stablecoin charges on Tempo); Regulation Z and E and PSD2 (card charges via Shared Payment Tokens); TFR; OFAC | Mixed rails: card methods inherit card law and network rules, stablecoin methods inherit stablecoin and AML rules |
| AP2 | Regulation E 1005.2(m); Regulation Z 1026.12(b); PSD2 and UK PSRs consent; EU AI Act; GDPR | Signed mandates are evidence of what the user authorized, which is the central fact in any unauthorized-transaction dispute |
| Mastercard Agent Pay | Regulation Z and E; PSD2 SCA; UK PSRs; network rules; EMVCo framework; MAS AI guidelines (issuers in Singapore) | Agentic tokens built on Mastercard tokenization; issuers and acquirers keep existing card liability until networks publish agent rules |

Update 2026-11-14 for every row: PSD3 and the PSR (Council first-reading positions of 2026-10-29) would replace PSD2 in every row that lists it, with no agent-specific provision; for US bank issuers, OCC Bulletin 2026-54 (guidance) rates a fully autonomous customer-facing payment agent as Tier 1 risk; in the UK, the CMA says a business answers for its AI agent under consumer law. [verified] [src-policy-consilium-psr-position] [src-policy-occ-si-framework] [src-policy-cma-ai-agents-guidance]

## 9. Open items

- PSD3 and PSR: Council adoption done (2026-10-29); watch the European Parliament's second reading (indicative plenary 2026-12-14) and OJ publication on EUR-Lex, then date the 21- and 27-month application points.
- GENIUS Act: the OCC's final rule is out (2026-10-23); watch the Federal Register for final FDIC, Federal Reserve, NCUA and Treasury rules and for the OCC's separate BSA, AML and sanctions rulemaking.
- HM Treasury: watch for the consultation response (none as of 2026-11-14).
- FCA: watch for the agentic finance framework announced on 2026-10-19 (no consultation as of 2026-11-14).
- DRCF: read the 2026-10-30 joint statement itself when drcf.org.uk can be read (HTTP 403 on 2026-11-14).
- Canada: watch for the final Stablecoin Regulations and a commencement order for the Stablecoin Act (target fall 2027).
- Federal absence searches: from 2026-10-02 search for "super intelligence" as well as "artificial intelligence" (Executive Order 14434).
- Warner letter: read the PDF text once a text layer can be extracted, then upgrade to verified.
- Amazon v. Perplexity: rehearing en banc denied (2026-09-10) and mandate issued (2026-09-18). Re-check after the 2026-11-20 hearing on the motion to dismiss the amended complaint, and after about 2026-12-09, the certiorari deadline (no petition on 2026-11-14).

## 10. Refresh 2026-11-14

What changed since the 2026-10-11 to 2026-10-21 reads, with the `research/policy.json` records and Policy-lane events added or updated:

- GENIUS Act: OCC final rule announced 2026-10-21 and published 2026-10-23, effective 2027-01-18 with the Act; no AI-agent provision; no other agency's final rule by 2026-11-14. New sources src-policy-fr-occ-genius-final and src-policy-occ-nr-2026-92; notes updated on src-policy-pymnts-occ-november, src-policy-fr-occ-genius-nprm and src-policy-fr-genius-ifr; new event 2026-10-23; the 2027-01-18 event is retitled to the date the Act and the OCC rule take effect.
- PSD3 and PSR: Council first-reading positions adopted 2026-10-29; awaiting Parliament's second reading (indicative plenary 2026-12-14); 21- and 27-month application points from the texts; no AI-agent provision. New sources src-policy-consilium-psr-position, src-policy-consilium-psd3-position and src-policy-oeil-psd3; src-policy-oeil-psr re-read; new event 2026-10-29; the 2025-11-27 event detail updated.
- OCC Bulletin 2026-54 (2026-11-04): examiner framework on super intelligence, guidance and not a rule; Executive Order 14434 changes the federal term for AI from 2026-10-02. New sources src-policy-occ-bulletin-2026-54, src-policy-occ-si-framework and src-policy-fr-eo-14434; new event 2026-11-04; src-policy-fr-cfpb-ai-search notes add the new search term.
- FCA speech of 2026-10-19 (trusted framework for agentic finance; statement of intent) and its good-practice page. New sources src-policy-fca-speech-agentic and src-policy-fca-ai-good-practice; new event 2026-10-19.
- DRCF joint statement of 2026-10-30, as described by the CMA, and the CMA's AI-agent consumer-law guidance (first published 2026-03-09, before this research began; a gap until now). New sources src-policy-cma-ai-agents-guidance and src-policy-cma-agentic-ai-consumers; new event 2026-10-30.
- Canada: proposed Stablecoin Regulations prepublished 2026-10-24 (fall 2027 target; stablecoin payment service providers under the RPAA); the Act is still not in force. New source src-policy-ca-gazette-stablecoin-regs; new event 2026-10-24; the 2026-03-26 event detail updated.
- EU stablecoins: the EBA classified USDC as the first significant e-money token (2026-10-14), with dual supervision from 2026-11-12. New source src-policy-eba-usdc-significant; new event 2026-10-14.
- Amazon v. Perplexity: rehearing en banc denied (2026-09-10), mandate (2026-09-18), amended complaint with an Agent Terms contract claim (2026-09-21), motion to dismiss (2026-10-13; hearing 2026-11-20). The CourtListener records src-policy-cl-amazon-perplexity-district and -ca9 were re-read; new events 2026-09-10, 2026-09-21 and 2026-10-13 (the same events, with the same titles, are in research/orbit.b.timeline.json).
- Visa rules: the 2026-10-24 edition renumbers the agent section to 4.1.23 (section 1 correction note updated; src-visa-rules-public and src-visa-us-irf-2026-04 are the visa-tap records).
- Checked with no change (2026-11-14): no CFPB or FTC agent rule; no HM Treasury consultation response; EU AI omnibus and Article 50 dates unchanged; Canada Stablecoin Act not in force. Not covered here: Walmart's Agentic Access Terms (2026-10-21) and Amazon's Agent Terms as retailer policy are left for a later round; the Colorado, FinCEN travel-rule and MAS items found this round are minor.
