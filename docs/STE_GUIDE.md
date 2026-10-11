# STE writing guide for the atlas

This guide is for writers of `src/content/protocols/<slug>/ste.mdx`. It is an original summary of the public ASD-STE100 Issue 9 writing rules, adapted to agent identity, checkout and payment protocols. ASD owns the copyright and the trademark of ASD-STE100. This guide does not reproduce rule text or dictionary entries. Rule numbers in brackets come from a public secondary index and are "reported", not read in the standard (see `research/ste.md` Section 2).

The linter (`pnpm lint:ste`) checks the mechanical rules. It cannot check meaning, the topic sentence, or the official vocabulary. Every report carries the label: "Written to the public ASD-STE100 Issue 9 writing rules. Vocabulary not checked against the official dictionary."

## 1. File structure

An `ste.mdx` file has frontmatter and these blocks. The linter finds them by component name and checks nothing outside them.

| Block | Rules | Limit per sentence |
|---|---|---|
| `<SteDescription>` | descriptive | 25 words, 6 sentences per paragraph |
| `<SteProcedure title="...">` with an ordered list | procedural | 20 words, imperative start |
| `<SteCaution>` | procedural (a command, then the risk) | 20 words |
| `<SteNote>` | descriptive (information only) | 25 words |
| `<SteTerms>` as `- **term**: definition` | descriptive (definition only) | 25 words |

Target 500 to 900 words per protocol: one description, 2 to 4 procedures from different personas, 3 to 6 safety blocks, and the terms list.

## 2. Words

- Use common words with one meaning each. Use a word only in its usual part of speech [1.1 to 1.4].
- Protocol terms are technical nouns (TN) or technical verbs (TV) [1.5, 1.12]. Add a new TN to `src/lib/ste/technical-nouns.json` before you use it.
- Use one TN for one thing. For example, write "facilitator" every time. Do not change to "settlement service" for the same role [1.11].
- Do not use a TN as a verb or a TV as a noun. "x402 the request" is not correct [1.7, 1.13].
- Use US spelling [1.14].
- Put code, field names, header names and URLs in backticks or write them exactly as the specification does (`payTo`, `PAYMENT-REQUIRED`). The linter counts each one as one word.

## 3. Noun clusters

- Do not put more than three nouns in a row [2.1]. Use a preposition: "the proof of the settlement batch", not "the settlement batch proof".
- Write a long technical noun in full first, then make it clear [2.2]. For example, write "Shared Payment Token (SPT)" on first use, then "SPT".

## 4. Verbs

- Use these forms only: infinitive, imperative, simple present, simple past, simple future, and the past participle as an adjective ("the signed payment") [3.1 to 3.3].
- Do not use perfect or progressive forms ("has settled", "is sending") [3.4].
- Use an -ing word only as part of a TN such as "signing key" or "onboarding" [3.5]. "Signing the payload" is not correct. Write "Sign the payload".
- Use the active voice [3.6]. In a description, you can use the passive only when the agent is unknown. Mark that sentence with `{/* ste-agent-unknown */}`. Never use the passive in a procedure.
- Show an action with a verb, not with a noun made from a verb [3.7]. Write "Verify the signature", not "Do the verification of the signature".
- Do not use phrasal verbs [9.3]. Write "configure", not "set up". Write "revert", not "roll back". The list is in `src/lib/ste/phrasal-verbs.json`.
- The linter marks "should", "would", "may", "might" and "could" for review. State the condition or the requirement: "The server sends status 402 if the payment is missing."

## 5. Sentences

- Write short, clear sentences [4.1]. Do not remove words such as "the" or "that" [4.2, 4.5].
- Do not use contractions. Write "do not", not "don't" [4.2].
- Put complex text in a vertical list [4.3]. Use connecting words to join related sentences [4.4].

## 6. Procedures

- Each numbered step is one instruction, with a maximum of 20 words [5.1, 5.2]. Two instructions can share a step when they occur at the same time.
- Start each instruction with a verb in the imperative ("Send", "Read", "Do not sign") [5.3].
- Put a condition first and end it with a comma: "If the server sends status 402, read the `PAYMENT-REQUIRED` header." [5.4].
- A note gives information only, never an instruction [5.5].
- Write each procedure for one persona, and put the persona in the title: "Pay for a resource with x402 (client)".

## 7. Descriptions

- Use a maximum of 25 words in a sentence.
- Write one topic in a paragraph. The first sentence is the topic sentence. Use a maximum of 6 sentences in a paragraph.

## 8. Safety instructions

Each safety block has three parts [7.1 to 7.3]: a signal word, then a clear command or condition, then the risk or the result. The component shows the signal word as text, so write only the command and the risk.

Signal words in this atlas (an atlas convention, not a rule of the standard):

| Signal word | Use it for |
|---|---|
| CAUTION | a risk of financial loss, data exposure or security compromise |
| NOTE | information only |
| WARNING | a risk to people. This is rare in this domain. Do not use it for a financial risk. |

Example:

```mdx
<SteCaution>
DO NOT SIGN A PAYMENT IF THE payTo ADDRESS IS NOT THE ADDRESS THAT YOU EXPECT. YOU CANNOT REVERSE AN EXACT SETTLEMENT.
</SteCaution>
```

## 9. Punctuation and word counts

- Do not use semicolons [8.1]. Write two sentences.
- Do not use em dashes (atlas house rule).
- Use hyphens only to join related words [8.2]. A hyphenated word counts as one word [8.7].
- Text in parentheses counts as one word [8.5]. A number with its unit counts as one word [8.6].
- In a vertical list, a colon counts as a full stop [8.4].
- Do not use "e.g.", "i.e." or "etc.". Write "for example", "that is", or the full list.

## 10. Writing practice

- If a simple word change does not work, write the sentence again with a different structure [9.1].
- Keep the same style and the same terms in all eight protocols [9.4].

## 11. The linter

```sh
pnpm lint:ste                    # all protocols
pnpm lint:ste --protocol x402    # one protocol
```

The linter writes `src/generated/ste-report/<slug>.json`. The build fails only when a procedural sentence has more than 20 words or a descriptive sentence has more than 25 words. Fix all other errors before you merge. Warnings and review items need a decision from the writer.

| Rule key | Procedure, caution | Description, note, terms |
|---|---|---|
| `sentence-length` | error over 20 words (fails the build) | error over 25 words (fails the build) |
| `paragraph-length` | warning over 6 sentences | error over 6 sentences |
| `ing-word` | error | error |
| `passive-voice` | error | warning |
| `verb-form` (perfect, progressive) | error | error |
| `contraction`, `semicolon`, `em-dash` | error | error |
| `imperative-start` | error (numbered steps only) | not applied |
| `phrasal-verb`, `noun-cluster`, `latin-abbreviation` | warning | warning |
| `vague-modal` | review | review |
| `unapproved-word` | warning, only when `ste/approved-words.local.txt` exists | same |

The vocabulary check is optional. If you own a copy of the standard, you can make `ste/approved-words.local.txt` (one word on each line) from it on your computer. The file is in `.gitignore`. Do not commit it.

## 12. Exemplar

This procedure and caution pass the linter with zero flags (fixture `tests/fixtures/ste/x402-exemplar.mdx`):

```mdx
<SteProcedure title="Pay for a resource with x402 (client)">

1. Send the request to the server.
2. If the server sends status 402, read the PAYMENT-REQUIRED header.
3. Decode the header. Find the payment option that your wallet supports.
4. Make sure that the amount and the payTo address are correct.
5. Sign the payment with your key.
6. Send the request again. Put the signed payment in the PAYMENT-SIGNATURE header.
7. Read the PAYMENT-RESPONSE header. Keep the transaction identifier.

</SteProcedure>
```
