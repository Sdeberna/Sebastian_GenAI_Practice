import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
    : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const field = (name) => page.getByTestId(name);
const click = (name) => field(name).click();
const typical = 'Decline Thursday and propose Friday after 3 PM';
const challenge = 'Make it nicer but not too formal and explain that I have a class';
const suggestion = () => field('text-suggestion').innerText();

try {
  await page.goto(process.env.PROTOTYPE_URL || 'http://localhost:80/');
  await field('input-instruction').waitFor();
  assert.match(await field('simulation-notice').innerText(), /not a live AI model/);
  assert.match(await page.locator('#instruction-hint').innerText(), /Other wording or schedules are unsupported/);

  await field('input-instruction').fill(typical);
  await click('button-ai');
  const first = await suggestion();
  assert.match(first, /Thursday at 2 PM doesn't work/);
  assert.match(first, /Friday after 3 PM/);
  await click('button-regenerate');
  const alternate = await suggestion();
  assert.notEqual(alternate, first);
  await click('button-accept');
  assert.equal(await field('input-reply').inputValue(), alternate);
  assert.equal(await field('accept-confirmation').isVisible(), true);
  assert.match(await field('accept-confirmation').innerText(), /Added to your draft/);
  await field('input-reply').fill(`${alternate}\nMANUAL DRAFT`);
  let savedDraft = await field('input-reply').inputValue();
  await click('button-new-instruction');
  assert.equal(await field('input-instruction').inputValue(), '');
  assert.equal(await field('input-reply').inputValue(), savedDraft);
  console.log('Typical 1: PASS — scheduling reply, alternate wording, visible acceptance confirmation, editable draft preserved across a new instruction.');

  await field('input-instruction').fill('Politely decline Thursday at 2 PM and suggest Friday after 3 PM instead');
  await click('button-ai');
  assert.match(await suggestion(), /Friday after 3 PM/);
  assert.match(await field('prepared-notice').innerText(), /Not what you asked\? Edit or Cancel/);
  await click('button-edit');
  const typicalEdit = `${await field('input-suggestion-edit').inputValue()}\nMANUAL DRAFT`;
  await field('input-suggestion-edit').fill(typicalEdit);
  assert.match(await field('button-accept').innerText(), /replace draft/);
  await click('button-accept');
  assert.equal(await field('accept-confirmation').isVisible(), true);
  assert.equal(await field('input-reply').inputValue(), typicalEdit);
  savedDraft = typicalEdit;
  await click('button-new-instruction');
  console.log('Typical 2: PASS — second listed scheduling instruction, manual suggestion edits accepted, visible replacement confirmation, repeatable flow.');

  await field('input-instruction').fill(challenge);
  await click('button-ai');
  const friendly = await suggestion();
  assert.notEqual(friendly, first);
  assert.match(friendly, /have a class on Thursday at 2 PM/);
  assert.match(friendly, /Friday after 3 PM/);
  assert.match(friendly, /Thanks for reaching out! I'd love to catch up/);
  await click('button-edit');
  const edited = `${friendly}\nMANUAL SUGGESTION`;
  await field('input-suggestion-edit').fill(edited);
  await click('button-regenerate');
  await field('regenerate-warning').waitFor();
  assert.equal(await field('input-suggestion-edit').inputValue(), edited);
  await click('button-keep-edits');
  assert.equal(await field('input-suggestion-edit').inputValue(), edited);
  assert.equal(await field('regenerate-warning').count(), 0);
  await click('button-regenerate');
  await click('button-discard-edits');
  const friendlyAlternate = await suggestion();
  assert.notEqual(friendlyAlternate, friendly);
  assert.match(friendlyAlternate, /class Thursday at 2 PM/);
  await click('button-edit');
  await field('input-suggestion-edit').fill(`${friendlyAlternate}\nCANCEL THIS`);
  await click('button-cancel');
  assert.equal(await field('input-instruction').inputValue(), challenge);
  assert.equal(await field('input-reply').inputValue(), savedDraft);
  await click('button-ai');
  await click('button-edit');
  // Empty edited suggestions cannot be accepted.
  await field('input-suggestion-edit').fill('   ');
  assert.equal(await field('button-accept').isDisabled(), true);
  const acceptedEdits = `${friendly}\nCUSTOM ACCEPTED`;
  await field('input-suggestion-edit').fill(acceptedEdits);
  assert.match(await field('button-accept').innerText(), /replace draft/);
  await click('button-accept');
  assert.equal(await field('input-reply').inputValue(), acceptedEdits);
  assert.equal(await field('accept-confirmation').isVisible(), true);
  await click('button-new-instruction');
  console.log('Challenge: PASS — distinct friendly class-conflict responses, warning preserves edits, both regeneration choices work, Cancel restores instruction and draft, Accept retains edits and explicitly replaces draft.');

  for (const invalid of ['', '   \n\t']) {
    await field('input-instruction').fill(invalid);
    await click('button-ai');
    await field('text-error').waitFor();
    assert.match(await field('text-error').innerText(), /Enter an instruction first/);
    assert.equal(await field('panel-suggestion').count(), 0);
    assert.equal(await field('input-instruction').getAttribute('aria-invalid'), 'true');
    assert.equal(await field('input-reply').inputValue(), acceptedEdits);
  }
  await field('input-instruction').fill(typical);
  assert.equal(await field('text-error').count(), 0);
  await click('button-ai');
  await field('panel-suggestion').waitFor();
  await click('button-cancel');
  console.log('Invalid / empty: PASS — empty and whitespace-only inputs show validation, never advance, preserve draft; valid retry clears error and works.');

  for (const risk of [
    'Say yes, Thursday at 2 PM works for me',
    'Decline Thursday and propose Monday at 10 AM',
    `${typical} but make it Monday at 10 AM`,
    'I have a class but say yes to Thursday at 2 PM',
  ]) {
    await field('input-instruction').fill(risk);
    await click('button-ai');
    await field('unsupported-notice').waitFor();
    assert.equal(await field('panel-suggestion').count(), 0);
    assert.equal(await field('button-accept').count(), 0);
    assert.match(await field('unsupported-notice').innerText(), /does not support that instruction/);
    assert.equal(await field('input-reply').inputValue(), acceptedEdits);
    assert.equal(await field('input-instruction').inputValue(), risk);
  }
  await page.getByRole('button', { name: 'Edit instruction', exact: true }).click();
  assert.equal(await field('input-instruction').evaluate((element) => element === document.activeElement), true);
  await click('button-manual');
  assert.equal(await field('input-reply').inputValue(), acceptedEdits);
  await field('input-reply').fill('Yes, Thursday at 2 PM works for me.');
  assert.equal(await field('input-reply').inputValue(), 'Yes, Thursday at 2 PM works for me.');
  await click('button-new-instruction');
  await click('example-typical');
  assert.equal(await field('input-instruction').inputValue(), typical);
  await click('button-ai');
  await field('panel-suggestion').waitFor();
  await click('button-cancel');
  console.log('Risk: PASS — exact say-yes input and three unsupported/custom/conflicting requests blocked with inline recovery notice, no suggestion or Accept; draft preserved, manual editing and supported-example recovery work.');

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const inputBox = await field('input-instruction').boundingBox();
  const buttonBox = await field('button-ai').boundingBox();
  assert(inputBox && buttonBox);
  assert(buttonBox.x >= inputBox.x && buttonBox.x + buttonBox.width <= inputBox.x + inputBox.width + 1);
  assert(buttonBox.y >= inputBox.y && buttonBox.y + buttonBox.height <= inputBox.y + inputBox.height + 1);
  assert.deepEqual(errors, []);
  console.log('Additional checks: PASS — phone has no horizontal overflow, AI action is inside field bounds, simulation is explicit, no uncaught browser errors.');
  // Also verify manual recovery when there is no existing draft to preserve.
  await page.reload();
  await field('input-instruction').fill('Say yes, Thursday at 2 PM works for me');
  await click('button-ai');
  await click('button-manual');
  assert.equal(await field('input-reply').inputValue(), '');
  await field('input-reply').fill('Thursday works for me.');
  assert.equal(await field('input-reply').inputValue(), 'Thursday works for me.');
  console.log('Manual recovery from a fresh page: PASS — unsupported input opens a blank editable draft, never inserts prepared decline text.');
} finally {
  await browser.close();
}
