# Inline Email Assistant

A small class-assignment web prototype showing a writing assistant directly inside an email reply field, without opening a separate AI chat.

## First working slice

Read a sample email asking about Thursday at 2 PM. Type an instruction such as “Decline Thursday and propose Friday after 3 PM,” then click the AI button attached to the composer. Review a suggestion and choose:

- **Accept:** insert the current suggestion into the editable reply composer.
- **Edit:** modify the suggestion before accepting it.
- **Regenerate:** show an alternate prepared reply.
- **Cancel:** dismiss the suggestion and restore the original instruction.

Empty or whitespace-only instructions show a validation message. This prototype does not send email.

## Simulated AI

AI behavior is **simulated** using prepared responses for the sample scheduling scenario. No language model or external API is called. Arbitrary instructions are not semantically interpreted; generated wording must be reviewed.

## Three manual test cases

| Case | Steps | Expected result |
| --- | --- | --- |
| Typical | Enter “Decline Thursday and propose Friday after 3 PM.” Click AI, then Accept. | A polite prepared reply declines Thursday and proposes Friday after 3 PM; Accept inserts it into the editable composer. |
| Challenge | Enter “Be brief and friendly.” Generate, Regenerate, Edit the alternate suggestion, then Accept. Refresh to restart, enter an instruction, generate, edit, and choose Cancel. | Regenerate changes the prepared wording, accepted edits appear in the composer, and Cancel restores the instruction rather than inserting the suggestion. The simulation notice makes clear that the instruction is not interpreted. |
| Invalid / empty | Click AI with an empty field, then repeat with spaces only. | A clear validation message appears; no suggestion is generated. Typing a valid instruction allows the flow to continue. |

## Three known limitations

1. Prepared replies cover only the sample scheduling scenario; they do not understand arbitrary instructions, availability, language, or tone.
2. State lasts only for the current page session; refreshing clears instructions and edits.
3. The assistant works only in this prototype’s composer. It cannot send email, connect to Gmail, or operate in other applications or text fields.

## Run locally

Start the **Inline Email Assistant** preview in Replit. The app is frontend-only and requires no credentials or service setup.
